const store = require('../db/store');

const { sanitizeString, sanitizeArray } = require('../utils/sanitize');

const getWeek = async (req, res) => {
    try {
        const userId = req.user.id;
        const targetDate = req.query.date ? new Date(req.query.date) : new Date();
        const week = await store.getWeek(userId, targetDate);
        res.json(week);
    } catch (error) {
        console.error("Error fetching week:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const updateDay = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params; // id is YYYY-MM-DD
        const { plannedActivity, isRestDay, status, extras } = req.body;

        // Validation & Sanitization
        const sanitizedData = {};

        if (plannedActivity !== undefined) {
            sanitizedData.plannedActivity = sanitizeString(plannedActivity);
        }

        if (isRestDay !== undefined) {
            sanitizedData.isRestDay = !!isRestDay;
        }

        if (status !== undefined) {
            const allowedStatuses = ['pending', 'completed', 'skipped'];
            if (allowedStatuses.includes(status)) {
                sanitizedData.status = status;
            }
        }

        if (extras !== undefined) {
            sanitizedData.extras = sanitizeArray(extras);
        }

        if (Object.keys(sanitizedData).length === 0) {
            return res.status(400).json({ error: "No valid fields provided for update" });
        }

        const result = await store.updateDay(userId, id, sanitizedData);

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

