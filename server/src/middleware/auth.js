/**
 * Mock Authentication Middleware
 * In a real app, this would verify a JWT token.
 * For now, it just looks for a x-user-id header.
 */
const mockAuth = (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: Missing x-user-id header" });
    }

    // Mock user object
    req.user = {
        id: userId,
        name: userId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    };

    next();
};

module.exports = mockAuth;
