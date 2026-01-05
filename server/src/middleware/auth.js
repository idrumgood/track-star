const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const { ensureUser } = require('../db/store');

/**
 * Google Authentication Middleware
 * Verifies the Google ID Token sent in the Authorization header.
 */
const auth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized: Missing or invalid Authorization header" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        // Synchronize user data with Firestore
        await ensureUser({
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: payload.picture
        });

        // Populate user object
        req.user = {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: payload.picture
        };

        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(401).json({ error: "Unauthorized: Invalid ID Token" });
    }
};

module.exports = auth;

