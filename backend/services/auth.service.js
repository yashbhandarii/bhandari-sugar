const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Handle user login.
 * @param {string} mobile 
 * @param {string} password 
 * @returns {Promise<Object>} { user, token }
 */
exports.login = async (mobile, password) => {
    // 1. Check if user exists
    const result = await db.query('SELECT * FROM users WHERE mobile = $1', [mobile]);
    if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    // 3. Generate Token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('Server configuration error: JWT_SECRET not set');
    }
    const token = jwt.sign(
        { id: user.id, role: user.role, name: user.name },
        secret,
        { expiresIn: '1d' }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            mobile: user.mobile,
            role: user.role
        }
    };
};
