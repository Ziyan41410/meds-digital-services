const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
    static async create(data) {
        const hash = await bcrypt.hash(data.password, 10);
        const [res] = await db.execute(
            'INSERT INTO users (first_name, last_name, username, email, phone, password_hash, role_id) VALUES (?,?,?,?,?,?,?)',
            [data.first_name, data.last_name, data.username, data.email, data.phone, hash, data.role_id || 5]
        );
        return res.insertId;
    }

    static async findByEmail(email) {
        if (!email) return null;
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0] || null;
    }

    static async findByUsername(username) {
        if (!username) return null;
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0] || null;
    }

    static async findByPhone(phone) {
        if (!phone) return null;
        const [rows] = await db.execute('SELECT * FROM users WHERE phone = ?', [phone]);
        return rows[0] || null;
    }

    static async findById(id) {
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async updateVerificationToken(userId, token) {
        try {
            const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await db.execute(
                'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
                [userId, token, expires]
            );
        } catch (err) {
            // Table might not exist yet, log and continue
            console.warn('Warning: email_verification_tokens table not ready:', err.message);
        }
    }

    static async verifyEmail(token) {
        try {
            const [result] = await db.execute(
                'UPDATE users SET is_verified = 1, email_verified_at = NOW() WHERE id = (SELECT user_id FROM email_verification_tokens WHERE token = ? AND expires_at > NOW())',
                [token]
            );
            if (result.affectedRows > 0) {
                await db.execute('DELETE FROM email_verification_tokens WHERE token = ?', [token]);
                return true;
            }
        } catch (err) {
            console.warn('Warning: verifyEmail failed:', err.message);
        }
        return false;
    }

    static async updateResetToken(email, token, expires) {
        try {
            const [user] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
            if (user.length === 0) return;
            
            await db.execute(
                'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
                [user[0].id, token, expires]
            );
        } catch (err) {
            console.warn('Warning: updateResetToken failed:', err.message);
        }
    }

    static async resetPassword(token, newPassword) {
        try {
            const hash = await bcrypt.hash(newPassword, 10);
            const [tokenRecord] = await db.execute(
                'SELECT user_id FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
                [token]
            );
            
            if (tokenRecord.length === 0) return false;
            
            const userId = tokenRecord[0].user_id;
            const [result] = await db.execute(
                'UPDATE users SET password_hash = ? WHERE id = ?',
                [hash, userId]
            );
            
            if (result.affectedRows > 0) {
                await db.execute('DELETE FROM password_reset_tokens WHERE token = ?', [token]);
                return true;
            }
        } catch (err) {
            console.warn('Warning: resetPassword failed:', err.message);
        }
        return false;
    }

    static async updateLastLogin(userId) {
        await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [userId]);
    }

    static async updateProfile(userId, data) {
        const fields = [];
        const values = [];

        for (const field of ['first_name', 'last_name', 'email', 'phone']) {
            if (Object.prototype.hasOwnProperty.call(data, field)) {
                fields.push(`${field} = ?`);
                values.push(data[field]);
            }
        }

        if (fields.length === 0) return false;

        values.push(userId);
        const [result] = await db.execute(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return result.affectedRows > 0;
    }

    static async valueExistsForOtherUser(field, value, userId) {
        if (!value) return false;
        const allowed = new Set(['email', 'phone', 'username']);
        if (!allowed.has(field)) throw new Error('Invalid user field');

        const [rows] = await db.execute(
            `SELECT id FROM users WHERE ${field} = ? AND id <> ? LIMIT 1`,
            [value, userId]
        );
        return rows.length > 0;
    }

    static async updatePassword(userId, newPassword) {
        const hash = await bcrypt.hash(newPassword, 10);
        const [result] = await db.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hash, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = User;
