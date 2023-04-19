const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

module.exports = {
    create(payload, options = {}) {
        return jwt.sign(payload, JWT_SECRET, options);
    },
    decode(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return null;
        }
    },
    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000)
    }
};