const jwt = require('jsonwebtoken');
var env = require("dotenv");

env.config()

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

verifyToken = (req, res, next) => {
    const token = req.header('Authorization')? req.header('Authorization').split(" ")[1] : null;
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET_KEY);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = verifyToken;