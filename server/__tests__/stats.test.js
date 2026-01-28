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

        expect(res.json).toHaveBeenCalledWith({
            rawDays: mockDays
        });
    });

    test('returns correct raw days for activity ranking test', async () => {
        const mockDays = [
            { id: '1', status: 'completed', isRestDay: false, plannedActivity: 'Run' },
            { id: '2', status: 'completed', isRestDay: false, plannedActivity: 'Swim' },
            { id: '3', status: 'completed', isRestDay: false, plannedActivity: 'Run' },
        ];
        store.getDaysInRange.mockResolvedValue(mockDays);

        await getStats(req, res);

        expect(res.json).toHaveBeenCalledWith({
            rawDays: mockDays
        });
    });

    test('returns correct raw days for streak test', async () => {
        const mockDays = [
            { id: '1', status: 'completed', isRestDay: false },
            { id: '2', status: 'completed', isRestDay: false },
            { id: '3', status: 'skipped', isRestDay: false },
            { id: '4', status: 'completed', isRestDay: false },
        ];
        store.getDaysInRange.mockResolvedValue(mockDays);

        await getStats(req, res);

        expect(res.json).toHaveBeenCalledWith({
            rawDays: mockDays
        });
    });
});
