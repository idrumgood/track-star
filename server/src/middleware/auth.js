const admin = require('firebase-admin');
const { ensureUser } = require('../db/store');

/**
 * Firebase Authentication Middleware
 * Verifies the Firebase ID Token sent in the Authorization header.
 */
const auth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized: Missing or invalid Authorization header" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        // decodedToken contains uid, email, name, picture, etc.
        const userData = {
            id: decodedToken.uid,
            name: decodedToken.name || decodedToken.email?.split('@')[0],
            email: decodedToken.email,
            picture: decodedToken.picture || ''
        };

        // Synchronize user data with Firestore
        await ensureUser(userData);

        // Populate user object
        req.user = userData;

        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(401).json({ error: "Unauthorized: Invalid ID Token" });
    }
};

module.exports = auth;

