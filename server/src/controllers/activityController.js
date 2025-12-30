const prisma = require('../db/prisma');

const getActivities = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch global activities (userId is null) AND user-specific activities
        const activities = await prisma.activityType.findMany({
            where: {
                OR: [
                    { userId: null },
                    { userId: userId }
                ]
            },
            orderBy: { name: 'asc' }
        });

        res.json(activities);
    } catch (error) {
        console.error("Error fetching activities:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { getActivities };
