const { encrypt, decrypt } = require('../services/encryptionService');
const db = require('./database');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('Authentication error'));
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User ${socket.userId} connected`);

        socket.on('join_project', (projectId) => {
            socket.join(`project_${projectId}`);
        });

        socket.on('send_message', async (data) => {
            try {
                const encryptedMsg = encrypt(data.message);
                const [result] = await db.execute(
                    `INSERT INTO messages (sender_id, receiver_id, project_id, message, is_encrypted) VALUES (?, ?, ?, ?, 1)`,
                    [socket.userId, data.receiverId, data.projectId, encryptedMsg]
                );
                const [sender] = await db.execute(`SELECT first_name, last_name FROM users WHERE id = ?`, [socket.userId]);
                io.to(`project_${data.projectId}`).emit('new_message', {
                    id: result.insertId,
                    sender_id: socket.userId,
                    message: data.message,
                    sender_name: `${sender[0].first_name} ${sender[0].last_name}`,
                    timestamp: new Date()
                });
            } catch (err) {
                console.error(err);
            }
        });

        socket.on('disconnect', () => {
            console.log(`User ${socket.userId} disconnected`);
        });
    });
};