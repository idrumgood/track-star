const mockGet = jest.fn();
const mockSet = jest.fn();

jest.mock('@google-cloud/firestore', () => {
    return {
        Firestore: jest.fn().mockImplementation(() => ({
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            get: mockGet,
            set: mockSet
        }))
    };
});

const store = require('../src/db/store');

describe('store.js', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('updateDay - Bug Fixes', () => {
        test('should set status to skipped if uncompleting a past day', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayId = yesterday.toISOString().split('T')[0];

            mockGet.mockResolvedValue({
                exists: true,
                data: () => ({
                    id: yesterdayId,
                    status: 'completed',
                    isRestDay: false
                })
            });

            const result = await store.updateDay('user1', yesterdayId, { status: 'pending' });

            expect(result.status).toBe('skipped');
            expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
                status: 'skipped'
            }));
        });

        test('should NOT set status to skipped if uncompleting a future day', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowId = tomorrow.toISOString().split('T')[0];

            mockGet.mockResolvedValue({
                exists: true,
                data: () => ({
                    id: tomorrowId,
                    status: 'completed',
                    isRestDay: false
                })
            });

            const result = await store.updateDay('user1', tomorrowId, { status: 'pending' });

            expect(result.status).toBe('pending');
            expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
                status: 'pending'
            }));
        });

        test('should keep rest day status as pending even if in past (not skipped)', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayId = yesterday.toISOString().split('T')[0];

            mockGet.mockResolvedValue({
                exists: true,
                data: () => ({
                    id: yesterdayId,
                    status: 'completed',
                    isRestDay: true
                })
            });

            const result = await store.updateDay('user1', yesterdayId, { status: 'pending' });

            expect(result.status).toBe('pending');
        });
    });
});
