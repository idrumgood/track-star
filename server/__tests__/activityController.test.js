const { getActivities } = require('../src/controllers/activityController');
const store = require('../src/db/store');

jest.mock('../src/db/store', () => ({
    getActivities: jest.fn(),
}));

describe('activityController.js', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            user: { id: 'user1' }
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
    });

    test('getActivities should fetch global and user-specific activities', async () => {
        const mockActivities = [
            { id: 1, name: 'Running', userId: null },
            { id: 2, name: 'Custom Lift', userId: 'user1' }
        ];

        store.getActivities.mockResolvedValue(mockActivities);

        await getActivities(req, res);

        expect(store.getActivities).toHaveBeenCalledWith('user1');
        expect(res.json).toHaveBeenCalledWith(mockActivities);
    });

    test('getActivities should handle errors', async () => {
        store.getActivities.mockRejectedValue(new Error('DB Error'));

        await getActivities(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
});
