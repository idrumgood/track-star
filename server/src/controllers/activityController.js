const store = require('../db/store');

const getActivities = async (req, res) => {
    try {
        const userId = req.user.id;
        const activities = await store.getActivities(userId);
        res.json(activities);
    } catch (error) {
        console.error("Error fetching activities:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const deleteActivity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        await store.deleteActivity(userId, id);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting activity:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { getActivities, deleteActivity };
