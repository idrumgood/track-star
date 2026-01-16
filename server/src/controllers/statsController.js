const store = require('../db/store');

const getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ error: "Missing start or end date" });
        }

        // Basic date validation
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ error: "Invalid start or end date format" });
        }

        const days = await store.getDaysInRange(userId, start, end);

        res.json({
            rawDays: days
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { getStats };
