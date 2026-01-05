const store = require('../src/db/store');
const { generateId } = require('../src/utils/dateUtils');
const db = require('../src/db/firestore');

// Mock Firestore SDK
jest.mock('../src/db/firestore', () => {
    const mockDoc = {
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn()
    };
    return {
        doc: jest.fn(() => mockDoc),
        collection: jest.fn()
    };
});

describe('store.js (Firestore)', () => {
    let mockDocRef;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDocRef = db.doc();
    });

    describe('updateDay - Business Rules', () => {
        test('should set status to skipped if uncompleting a past day', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayId = generateId(yesterday);

            // Mock existing document
            mockDocRef.get.mockResolvedValue({
                exists: true,
                data: () => ({
                    days: {
                        [yesterdayId]: {
                            date: yesterday.toISOString(),
                            status: 'completed',
                            isRestDay: false,
                            plannedActivityRaw: 'Run',
                            extras: []
                        }
                    }
                })
            });

            const result = await store.updateDay('user1', yesterdayId, { status: 'pending' });

            expect(result.status).toBe('skipped');
            expect(mockDocRef.set).toHaveBeenCalledWith(expect.objectContaining({
                days: {
                    [yesterdayId]: expect.objectContaining({
                        status: 'skipped'
                    })
                }
            }), { merge: true });
        });

        test('should keep rest day status as pending even if in past (not skipped)', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayId = generateId(yesterday);

            mockDocRef.get.mockResolvedValue({
                exists: true,
                data: () => ({
                    days: {
                        [yesterdayId]: {
                            status: 'completed',
                            isRestDay: true,
                            plannedActivityRaw: 'Rest'
                        }
                    }
                })
            });

            const result = await store.updateDay('user1', yesterdayId, { status: 'pending' });

            expect(result.status).toBe('pending');
        });
    });

    describe('getWeek', () => {
        test('should initialize missing days in the month document', async () => {
            const date = new Date('2025-12-30'); // Tuesday

            // Mock empty document
            mockDocRef.get.mockResolvedValue({ exists: false });

            const result = await store.getWeek('user1', date);

            expect(result).toHaveLength(7);
            // Verify that it tried to save the initialized days
            expect(mockDocRef.set).toHaveBeenCalled();
            expect(result[0].plannedActivity).toBe('Plan');
        });
    });

    describe('getDaysInRange', () => {
        test('should fetch multiple months if range spans month boundary', async () => {
            const start = '2025-12-30';
            const end = '2026-01-02';

            // Mock multiple month docs
            mockDocRef.get.mockResolvedValueOnce({
                exists: true,
                data: () => ({
                    days: {
                        '2025-12-30': { status: 'completed', plannedActivityRaw: 'Run' },
                        '2025-12-31': { status: 'pending', plannedActivityRaw: 'Plan' }
                    }
                })
            }).mockResolvedValueOnce({
                exists: true,
                data: () => ({
                    days: {
                        '2026-01-01': { status: 'pending', plannedActivityRaw: 'Rest' },
                        '2026-01-02': { status: 'completed', plannedActivityRaw: 'Walk' }
                    }
                })
            });

            const result = await store.getDaysInRange('user1', start, end);

            expect(result).toHaveLength(4);
            expect(db.doc).toHaveBeenCalledTimes(3); // 1 from beforeEach, 2 from getDaysInRange
            expect(result[0].id).toBe('2025-12-30');
            expect(result[3].id).toBe('2026-01-02');
        });
    });

    describe('ensureUser', () => {
        test('should create user with default settings if not exists', async () => {
            const userData = { id: 'user1', email: 'test@example.com', name: 'Test User', picture: 'pic' };
            mockDocRef.get.mockResolvedValue({ exists: false });

            const result = await store.ensureUser(userData);

            expect(mockDocRef.set).toHaveBeenCalledWith(expect.objectContaining({
                email: 'test@example.com',
                settings: { theme: 'dark' }
            }));
            expect(result.theme).toBe('dark');
        });

        test('should merge user data if user already exists', async () => {
            const userData = { id: 'user1', email: 'new@example.com', name: 'New Name' };
            mockDocRef.get.mockResolvedValue({
                exists: true,
                data: () => ({ email: 'old@example.com', settings: { theme: 'light' } })
            });

            const result = await store.ensureUser(userData);

            expect(mockDocRef.set).toHaveBeenCalledWith(expect.objectContaining({
                email: 'new@example.com'
            }), { merge: true });
            expect(result.theme).toBe('light');
        });
    });

    describe('Profile Management', () => {
        test('should get user profile', async () => {
            mockDocRef.get.mockResolvedValue({
                exists: true,
                data: () => ({ name: 'Test', settings: { theme: 'dark' } })
            });

            const result = await store.getUserProfile('user1');
            expect(result.name).toBe('Test');
        });

        test('should update user profile', async () => {
            mockDocRef.get.mockResolvedValue({
                exists: true,
                data: () => ({ name: 'Updated' })
            });

            const result = await store.updateUserProfile('user1', { name: 'Updated' });

            expect(mockDocRef.set).toHaveBeenCalledWith({ name: 'Updated' }, { merge: true });
            expect(result.name).toBe('Updated');
        });
    });
});
