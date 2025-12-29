const { getStats } = require('../src/controllers/statsController');
const store = require('../src/db/store');

jest.mock('../src/db/store');

describe('statsController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: { id: 'user123' },
            query: { start: '2025-12-01', end: '2025-12-07' }
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
    });

    test('calculates correct summary and consistency', async () => {
        const mockDays = [
            { id: '2025-12-01', date: '2025-12-01T00:00:00Z', status: 'completed', isRestDay: false, plannedActivity: 'Run' },
            { id: '2025-12-02', date: '2025-12-02T00:00:00Z', status: 'pending', isRestDay: true },
            { id: '2025-12-03', date: '2025-12-03T00:00:00Z', status: 'skipped', isRestDay: false, plannedActivity: 'Gym' },
        ];
        store.getDaysInRange.mockResolvedValue(mockDays);

        await getStats(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            summary: expect.objectContaining({
                completed: 1,
                skipped: 1,
                restDays: 1,
                consistency: 50 // 1 completed out of 2 non-rest days
            })
        }));
    });

    test('ranks activities by frequency', async () => {
        const mockDays = [
            { id: '1', status: 'completed', isRestDay: false, plannedActivity: 'Run' },
            { id: '2', status: 'completed', isRestDay: false, plannedActivity: 'Swim' },
            { id: '3', status: 'completed', isRestDay: false, plannedActivity: 'Run' },
        ];
        store.getDaysInRange.mockResolvedValue(mockDays);

        await getStats(req, res);

        const callArgs = res.json.mock.calls[0][0];
        expect(callArgs.activities[0]).toEqual({ name: 'Run', count: 2 });
        expect(callArgs.activities[1]).toEqual({ name: 'Swim', count: 1 });
    });

    test('calculates longest streak correctly', async () => {
        const mockDays = [
            { id: '1', status: 'completed', isRestDay: false },
            { id: '2', status: 'completed', isRestDay: false },
            { id: '3', status: 'skipped', isRestDay: false },
            { id: '4', status: 'completed', isRestDay: false },
        ];
        store.getDaysInRange.mockResolvedValue(mockDays);

        await getStats(req, res);

        const callArgs = res.json.mock.calls[0][0];
        expect(callArgs.streaks.longest).toBe(2);
    });
});
