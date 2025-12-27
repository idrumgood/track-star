const store = require('../db/store');

const getWeek = (req, res) => {
    try {
        const userId = req.user.id;
        const targetDate = req.query.date ? new Date(req.query.date) : new Date();
        const week = store.getWeek(userId, targetDate);
        res.json(week);
    } catch (error) {
        console.error("Error fetching week:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const updateDay = (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params; // id is YYYY-MM-DD
        const updatedDay = req.body;

        const result = store.updateDay(userId, id, updatedDay);

        if (result) {
            res.json(result);
        } else {
            res.status(404).json({ error: "Day or Week not found" });
        }
    } catch (error) {
        console.error("Error updating day:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    getWeek,
    updateDay
};
