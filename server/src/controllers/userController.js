const store = require('../db/store');
const { sanitizeString } = require('../utils/sanitize');

const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await store.getUserProfile(userId);
        if (profile) {
            res.json(profile);
        } else {
            res.status(404).json({ error: "User profile not found" });
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, picture, settings } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = sanitizeString(name);
        if (picture !== undefined) updates.picture = sanitizeString(picture);
        if (settings !== undefined) updates.settings = settings;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No valid fields provided for update" });
        }

        const result = await store.updateUserProfile(userId, updates);
        res.json(result);
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    getProfile,
    updateProfile
};
