const prisma = require('../src/db/prisma');
const store = require('../src/db/store');
const { generateId } = require('../src/utils/dateUtils');

jest.mock('../src/db/prisma', () => ({
    user: {
        upsert: jest.fn(),
    },
    day: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        createMany: jest.fn(),
    },
    extra: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
    },
    activityType: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
    }
}));

describe('store.js', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock for ensureUser
        prisma.user.upsert.mockResolvedValue({ id: 'user1' });
    });

    describe('updateDay - Business Rules', () => {
        test('should set status to skipped if uncompleting a past day', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayId = generateId(yesterday);
            const yesterdayUtc = new Date(yesterday.setHours(0, 0, 0, 0));

            prisma.day.findUnique.mockResolvedValue({
                id: `user1_${yesterdayId}`,
                userId: 'user1',
                date: yesterdayUtc,
                status: 'completed',
                isRestDay: false,
                plannedActivityRaw: 'Run',
                extras: []
            });

            prisma.day.update.mockImplementation(({ data }) => Promise.resolve({
                id: `user1_${yesterdayId}`,
                date: yesterdayUtc,
                status: data.status,
                isRestDay: false,
                plannedActivityRaw: 'Run',
                extras: []
            }));

            const result = await store.updateDay('user1', yesterdayId, { status: 'pending' });

            expect(result.status).toBe('skipped');
            expect(prisma.day.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: `user1_${yesterdayId}` },
                data: expect.objectContaining({
                    status: 'skipped'
                })
            }));
        });

        test('should NOT set status to skipped if uncompleting a future day', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowId = generateId(tomorrow);
            const tomorrowUtc = new Date(tomorrow.setHours(0, 0, 0, 0));

            prisma.day.findUnique.mockResolvedValue({
                id: `user1_${tomorrowId}`,
                userId: 'user1',
                date: tomorrowUtc,
                status: 'completed',
                isRestDay: false,
                plannedActivityRaw: 'Run',
                extras: []
            });

            prisma.day.update.mockImplementation(({ data }) => Promise.resolve({
                id: `user1_${tomorrowId}`,
                date: tomorrowUtc,
                status: data.status,
                isRestDay: false,
                plannedActivityRaw: 'Run',
                extras: []
            }));

            const result = await store.updateDay('user1', tomorrowId, { status: 'pending' });

            expect(result.status).toBe('pending');
            expect(prisma.day.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: 'pending'
                })
            }));
        });

        test('should keep rest day status as pending even if in past (not skipped)', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayId = generateId(yesterday);
            const yesterdayUtc = new Date(yesterday.setHours(0, 0, 0, 0));

            prisma.day.findUnique.mockResolvedValue({
                id: `user1_${yesterdayId}`,
                userId: 'user1',
                date: yesterdayUtc,
                status: 'completed',
                isRestDay: true,
                plannedActivityRaw: 'Rest',
                extras: []
            });

            prisma.day.update.mockImplementation(({ data }) => Promise.resolve({
                id: `user1_${yesterdayId}`,
                date: yesterdayUtc,
                status: data.status,
                isRestDay: true,
                plannedActivityRaw: 'Rest',
                extras: []
            }));

            const result = await store.updateDay('user1', yesterdayId, { status: 'pending' });

            expect(result.status).toBe('pending');
        });
    });

    describe('updateDay - Activity Matching', () => {
        test('should match an existing global activity (case-insensitive)', async () => {
            const today = new Date();
            const todayId = generateId(today);

            prisma.day.findUnique.mockResolvedValue({
                id: `user1_${todayId}`,
                userId: 'user1',
                date: today,
                status: 'pending',
                isRestDay: false,
                plannedActivityRaw: 'Plan',
                extras: []
            });

            // Mock finding a global activity
            prisma.activityType.findFirst.mockResolvedValue({
                id: 10,
                name: 'Running',
                userId: null,
                icon: '🏃'
            });

            await store.updateDay('user1', todayId, { plannedActivity: 'running' });

            expect(prisma.activityType.findFirst).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    name: expect.objectContaining({ mode: 'insensitive' })
                })
            }));

            expect(prisma.day.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    plannedActivityRaw: 'running',
                    activityTypeId: 10
                })
            }));

            // Should NOT have created a new activity
            expect(prisma.activityType.create).not.toHaveBeenCalled();
        });

        test('should create a new user-specific activity if no match found', async () => {
            const today = new Date();
            const todayId = generateId(today);

            prisma.day.findUnique.mockResolvedValue({
                id: `user1_${todayId}`,
                userId: 'user1',
                date: today,
                status: 'pending',
                isRestDay: false,
                plannedActivityRaw: 'Plan',
                extras: []
            });

            // Mock finding nothing
            prisma.activityType.findFirst.mockResolvedValue(null);

            // Mock creation success
            prisma.activityType.create.mockResolvedValue({
                id: 99,
                name: 'Unicycling',
                userId: 'user1'
            });

            await store.updateDay('user1', todayId, { plannedActivity: 'Unicycling' });

            expect(prisma.activityType.create).toHaveBeenCalledWith({
                data: {
                    name: 'Unicycling',
                    userId: 'user1'
                }
            });

            expect(prisma.day.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    activityTypeId: 99
                })
            }));
        });

        test('should NOT create a new activity for default "Plan" text', async () => {
            const today = new Date();
            const todayId = generateId(today);

            prisma.day.findUnique.mockResolvedValue({ id: `user1_${todayId}`, userId: 'user1', date: today, extras: [] });
            prisma.activityType.findFirst.mockResolvedValue(null);

            await store.updateDay('user1', todayId, { plannedActivity: 'Plan' });

            expect(prisma.activityType.create).not.toHaveBeenCalled();
            expect(prisma.day.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    activityTypeId: null
                })
            }));
        });
    });

    describe('getWeek', () => {
        test('should generate a new week if no days found', async () => {
            const date = new Date('2025-12-30'); // Tuesday
            prisma.day.findMany.mockResolvedValueOnce([]); // First call finds nothing
            prisma.day.createMany.mockResolvedValue({ count: 7 });

            // Second call after creation
            prisma.day.findMany.mockResolvedValueOnce(Array.from({ length: 7 }, (_, i) => ({
                id: `user1_2025-12-2${9 + i}`,
                date: new Date(2025, 11, 29 + i),
                status: 'pending',
                isRestDay: false,
                plannedActivityRaw: 'Plan',
                extras: []
            })));

            const result = await store.getWeek('user1', date);

            expect(result).toHaveLength(7);
            expect(prisma.day.createMany).toHaveBeenCalled();
        });
    });

    describe('getDaysInRange', () => {
        test('should return formatted days in range', async () => {
            const start = '2025-12-01';
            const end = '2025-12-02';

            prisma.day.findMany.mockResolvedValue([
                {
                    id: 'user1_2025-12-01',
                    date: new Date('2025-12-01T12:00:00Z'),
                    status: 'completed',
                    isRestDay: false,
                    plannedActivityRaw: 'Run',
                    extras: [{ name: 'Warmup' }]
                }
            ]);

            const result = await store.getDaysInRange('user1', start, end);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(expect.objectContaining({
                id: '2025-12-01',
                plannedActivity: 'Run',
                extras: ['Warmup']
            }));
        });
    });
});
