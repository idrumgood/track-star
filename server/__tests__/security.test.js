const { updateDay } = require('../src/controllers/weekController');
const { getStats } = require('../src/controllers/statsController');
const store = require('../src/db/store');

jest.mock('../src/db/store');

describe('Security and Validation', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: { id: 'user123' },
            params: { id: '2025-12-30' },
            body: {},
            query: {}
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
    });

    describe('weekController.updateDay', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('whitelists allowed fields and ignores extra ones', async () => {
            req.body = {
                plannedActivity: 'Running',
                isAdmin: true, // Should be ignored
                otherField: 'malicious' // Should be ignored
            };
            store.updateDay.mockResolvedValue({ id: '2025-12-30', plannedActivity: 'Running' });

            await updateDay(req, res);

            expect(store.updateDay).toHaveBeenCalledWith(
                'user123',
                '2025-12-30',
                { plannedActivity: 'Running' }
            );
        });

        test('sanitizes HTML from plannedActivity', async () => {
            req.body = {
                plannedActivity: '<script>alert("xss")</script>Gym'
            };
            store.updateDay.mockResolvedValue({ id: '2025-12-30', plannedActivity: 'Gym' });

            await updateDay(req, res);

            expect(store.updateDay).toHaveBeenCalledWith(
                'user123',
                '2025-12-30',
                { plannedActivity: 'Gym' }
            );
        });

        test('sanitizes HTML from extras array', async () => {
            req.body = {
                extras: ['<button>Click</button> Stretching', 'Yoga']
            };
            store.updateDay.mockResolvedValue({ id: '2025-12-30', extras: ['Click Stretching', 'Yoga'] });

            await updateDay(req, res);

            expect(store.updateDay).toHaveBeenCalledWith(
                'user123',
                '2025-12-30',
                { extras: ['Click Stretching', 'Yoga'] }
            );
        });

        test('returns 400 if no valid fields provided', async () => {
            req.body = { invalidField: 'test' };

            await updateDay(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "No valid fields provided for update" });
            expect(store.updateDay).not.toHaveBeenCalled();
        });
    });

    describe('statsController.getStats', () => {
        test('returns 400 for invalid date format', async () => {
            req.query = { start: 'not-a-date', end: '2025-12-31' };

            await getStats(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Invalid start or end date format" });
        });
    });
});
