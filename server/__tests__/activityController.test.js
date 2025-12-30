const { getActivities } = require('../src/controllers/activityController');
const prisma = require('../src/db/prisma');

jest.mock('../src/db/prisma', () => ({
    activityType: {
        findMany: jest.fn(),
    },
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

        prisma.activityType.findMany.mockResolvedValue(mockActivities);

        await getActivities(req, res);

        expect(prisma.activityType.findMany).toHaveBeenCalledWith({
            where: {
                OR: [
                    { userId: null },
                    { userId: 'user1' }
                ]
            },
            orderBy: { name: 'asc' }
        });
        expect(res.json).toHaveBeenCalledWith(mockActivities);
    });

    test('getActivities should handle errors', async () => {
        prisma.activityType.findMany.mockRejectedValue(new Error('DB Error'));

        await getActivities(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
});
