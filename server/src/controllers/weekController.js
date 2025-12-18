const store = require('../db/store');

const getWeek = (req, res) => {
    try {
        const targetDate = req.query.date ? new Date(req.query.date) : new Date();
        const week = store.getWeek(targetDate);
        res.json(week);
    } catch (error) {
        console.error("Error fetching week:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const updateDay = (req, res) => {
    try {
        const { id } = req.params; // id is YYYY-MM-DD
        const updatedDay = req.body;

        const result = store.updateDay(id, updatedDay);

        if (result) {
            res.json(result);
        } else {
            // Differentiate 404 Week vs 404 Day if needed, but for now generic 404 is okay as per original
            // Original: 404 Check key, then check index.
            // Store returns null for both cases.
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
