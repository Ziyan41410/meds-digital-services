const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Store active connections
const activeUsers = new Map(); // userId -> Set of socket ids
const socketUsers = new Map(); // socketId -> userId

/**
 * Initialize Socket.io for real-time chat
 */
const initializeSocket = (io) => {
  io.on('connection', async (socket) => {
    console.log('✅ User connected:', socket.id);

    let authenticatedUserId = null;

    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        authenticatedUserId = decoded.id;
        socketUsers.set(socket.id, authenticatedUserId);
        if (!activeUsers.has(authenticatedUserId)) {
          activeUsers.set(authenticatedUserId, new Set());
        }
        activeUsers.get(authenticatedUserId).add(socket.id);
        socket.join(`user_${authenticatedUserId}`);
      }
    } catch (error) {
      console.error('Socket auth error:', error.message);
    }

    // =============================================
    // CONNECTION EVENTS
    // =============================================

    /**
     * Set user for this socket connection
     */
    socket.on('set_user', async (data) => {
      try {
        const userId = authenticatedUserId;

        if (!userId) {
          socket.emit('error', { message: 'ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„' });
          return;
        }

        // Store socket-user mapping
        socketUsers.set(socket.id, userId);

        // Store active user
        if (!activeUsers.has(userId)) {
          activeUsers.set(userId, new Set());
        }
        activeUsers.get(userId).add(socket.id);
        socket.join(`user_${userId}`);

        console.log(`👤 User ${userId} connected with socket ${socket.id}`);

        // Broadcast user online status
        io.emit('user_online', {
          userId,
          timestamp: new Date(),
          activeConnections: activeUsers.get(userId).size
        });

        // Send back confirmation
        socket.emit('user_set', { userId, socketId: socket.id });
      } catch (error) {
        console.error('Error setting user:', error);
        socket.emit('error', { message: 'خطأ في تعيين المستخدم' });
      }
    });

    /**
     * Join a chat room
     */
    socket.on('join_room', async (data) => {
      try {
        const { chatId } = data;
        const userId = authenticatedUserId;
        const roomName = `chat_${chatId}`;

        if (!userId) {
          socket.emit('error', { message: 'ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„' });
          return;
        }

        // Verify user is participant
        const [participant] = await db.execute(
          'SELECT * FROM chat_participants WHERE chat_id = ? AND user_id = ? AND is_active = TRUE',
          [chatId, userId]
        );

        if (participant.length === 0) {
          socket.emit('error', { message: 'ليس لديك صلاحية الوصول إلى هذه المحادثة' });
          return;
        }

        socket.join(roomName);
        console.log(`📍 User ${userId} joined room ${roomName}`);

        // Notify others
        socket.to(roomName).emit('user_joined', {
          userId,
          chatId,
          timestamp: new Date()
        });

        // Send confirmation
        socket.emit('room_joined', { chatId, roomName });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'خطأ في الانضمام للغرفة' });
      }
    });

    /**
     * Leave a chat room
     */
    socket.on('leave_room', (data) => {
      try {
        const { chatId } = data;
        const roomName = `chat_${chatId}`;
        const userId = socketUsers.get(socket.id);

        socket.leave(roomName);
        console.log(`📍 User ${userId} left room ${roomName}`);

        // Notify others
        socket.to(roomName).emit('user_left', {
          userId,
          chatId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });

    // =============================================
    // MESSAGE EVENTS
    // =============================================

    /**
     * Send message in real-time
     */
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, replyToId } = data;
        const userId = socketUsers.get(socket.id);
        const roomName = `chat_${chatId}`;

        if (!userId) {
          socket.emit('error', { message: 'يجب تعيين المستخدم أولاً' });
          return;
        }

        const [participant] = await db.execute(
          'SELECT id FROM chat_participants WHERE chat_id = ? AND user_id = ? AND is_active = TRUE',
          [chatId, userId]
        );

        if (participant.length === 0) {
          socket.emit('error', { message: 'ليس لديك صلاحية الإرسال في هذه المحادثة' });
          return;
        }

        // Save to database
        const insertQuery = `
          INSERT INTO chat_messages (chat_id, sender_id, content, reply_to_id)
          VALUES (?, ?, ?, ?)
        `;

        const [result] = await db.execute(insertQuery, [
          chatId,
          userId,
          content,
          replyToId || null
        ]);

        // Get sender info
        const [senderInfo] = await db.execute(
          'SELECT id, first_name, last_name, profile_image FROM users WHERE id = ?',
          [userId]
        );

        const message = {
          id: result.insertId,
          chat_id: chatId,
          sender_id: userId,
          sender_name: `${senderInfo[0].first_name} ${senderInfo[0].last_name}`,
          sender_avatar: senderInfo[0].profile_image,
          content,
          replyToId: replyToId || null,
          created_at: new Date(),
          edited_at: null,
          deleted_at: null
        };

        // Broadcast message to room
        io.to(roomName).emit('message_received', message);

        // Update chat last_message_at
        await db.execute('UPDATE chats SET last_message_at = NOW() WHERE id = ?', [chatId]);

        // Create notifications for other participants
        const [participants] = await db.execute(
          'SELECT user_id FROM chat_participants WHERE chat_id = ? AND user_id != ? AND is_active = TRUE',
          [chatId, userId]
        );

        for (const p of participants) {
          await db.execute(
            'INSERT INTO chat_notifications (user_id, chat_id, message_id, type) VALUES (?, ?, ?, ?)',
            [p.user_id, chatId, result.insertId, 'message']
          );

          // Emit notification event
          const userSockets = activeUsers.get(p.user_id);
          if (userSockets) {
            userSockets.forEach(socketId => {
              io.to(socketId).emit('notification', {
                type: 'message',
                chatId,
                messageId: result.insertId,
                senderName: senderInfo[0].first_name
              });
            });
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'خطأ في إرسال الرسالة' });
      }
    });

    /**
     * Edit message in real-time
     */
    socket.on('edit_message', async (data) => {
      try {
        const { messageId, content, chatId } = data;
        const userId = socketUsers.get(socket.id);
        const roomName = `chat_${chatId}`;

        console.log('📝 Edit message received:', { messageId, chatId, userId });

        // Verify ownership
        const [message] = await db.execute(
          'SELECT * FROM chat_messages WHERE id = ?',
          [messageId]
        );

        if (message.length === 0 || message[0].sender_id !== userId) {
          console.warn('⚠️ Unauthorized edit attempt');
          socket.emit('error', { message: 'لا يمكنك تعديل هذه الرسالة' });
          return;
        }

        // Update in database
        await db.execute(
          'UPDATE chat_messages SET content = ?, edited_at = NOW() WHERE id = ?',
          [content, messageId]
        );

        // Broadcast edit
        const editedData = {
          messageId,
          content,
          edited_at: new Date(),
          chatId
        };
        console.log('📤 Broadcasting message_edited:', editedData);
        io.to(roomName).emit('message_edited', editedData);
      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'خطأ في تعديل الرسالة' });
      }
    });

    /**
     * Delete message in real-time
     */
    socket.on('delete_message', async (data) => {
      try {
        const { messageId, chatId } = data;
        const userId = socketUsers.get(socket.id);
        const roomName = `chat_${chatId}`;

        console.log('🗑️ Delete message received:', { messageId, chatId, userId });

        // Verify ownership
        const [message] = await db.execute(
          'SELECT * FROM chat_messages WHERE id = ?',
          [messageId]
        );

        if (message.length === 0 || message[0].sender_id !== userId) {
          console.warn('⚠️ Unauthorized delete attempt');
          socket.emit('error', { message: 'لا يمكنك حذف هذه الرسالة' });
          return;
        }

        // Soft delete
        await db.execute(
          'UPDATE chat_messages SET deleted_at = NOW() WHERE id = ?',
          [messageId]
        );

        // Broadcast delete
        const deletedData = {
          messageId,
          deleted_at: new Date(),
          chatId
        };
        console.log('📤 Broadcasting message_deleted:', deletedData);
        io.to(roomName).emit('message_deleted', deletedData);
      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'خطأ في حذف الرسالة' });
      }
    });

    // =============================================
    // TYPING & STATUS EVENTS
    // =============================================

    /**
     * User starts typing
     */
    socket.on('typing_start', (data) => {
      try {
        const { chatId, userName } = data;
        const roomName = `chat_${chatId}`;
        const userId = socketUsers.get(socket.id);

        socket.to(roomName).emit('user_typing', {
          userId,
          userName,
          chatId
        });
      } catch (error) {
        console.error('Error in typing_start:', error);
      }
    });

    /**
     * User stops typing
     */
    socket.on('typing_stop', (data) => {
      try {
        const { chatId } = data;
        const roomName = `chat_${chatId}`;
        const userId = socketUsers.get(socket.id);

        socket.to(roomName).emit('user_typing_stop', {
          userId,
          chatId
        });
      } catch (error) {
        console.error('Error in typing_stop:', error);
      }
    });

    // =============================================
    // REACTION EVENTS
    // =============================================

    /**
     * Add reaction to message
     */
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, emoji, chatId } = data;
        const userId = socketUsers.get(socket.id);
        const roomName = `chat_${chatId}`;

        // Save to database
        await db.execute(
          'INSERT IGNORE INTO chat_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)',
          [messageId, userId, emoji]
        );

        // Broadcast reaction
        io.to(roomName).emit('reaction_added', {
          messageId,
          emoji,
          userId,
          chatId
        });
      } catch (error) {
        console.error('Error adding reaction:', error);
        socket.emit('error', { message: 'خطأ في إضافة التفاعل' });
      }
    });

    /**
     * Remove reaction from message
     */
    socket.on('remove_reaction', async (data) => {
      try {
        const { messageId, emoji, chatId } = data;
        const userId = socketUsers.get(socket.id);
        const roomName = `chat_${chatId}`;

        // Remove from database
        await db.execute(
          'DELETE FROM chat_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
          [messageId, userId, emoji]
        );

        // Broadcast removal
        io.to(roomName).emit('reaction_removed', {
          messageId,
          emoji,
          userId,
          chatId
        });
      } catch (error) {
        console.error('Error removing reaction:', error);
        socket.emit('error', { message: 'خطأ في إزالة التفاعل' });
      }
    });

    // =============================================
    // READ RECEIPT EVENTS
    // =============================================

    /**
     * Mark message as read
     */
    socket.on('message_read', async (data) => {
      try {
        const { messageId, chatId } = data;
        const userId = socketUsers.get(socket.id);
        const roomName = `chat_${chatId}`;

        // Save to database
        await db.execute(
          'INSERT INTO chat_read_receipts (message_id, user_id, read_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE read_at = NOW()',
          [messageId, userId]
        );

        // Broadcast read status
        socket.to(roomName).emit('message_read_receipt', {
          messageId,
          userId,
          chatId,
          read_at: new Date()
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // =============================================
    // DISCONNECT EVENT
    // =============================================

    socket.on('disconnect', () => {
      try {
        const userId = socketUsers.get(socket.id);

        // Remove socket mapping
        socketUsers.delete(socket.id);

        if (userId) {
          const userSockets = activeUsers.get(userId);
          if (userSockets) {
            userSockets.delete(socket.id);

            // If no more connections, mark as offline
            if (userSockets.size === 0) {
              activeUsers.delete(userId);

              // Broadcast offline status
              io.emit('user_offline', {
                userId,
                timestamp: new Date()
              });

              console.log(`👤 User ${userId} disconnected (no active connections)`);
            }
          }
        }

        console.log('❌ User disconnected:', socket.id);
      } catch (error) {
        console.error('Error in disconnect:', error);
      }
    });

    // =============================================
    // ERROR HANDLING
    // =============================================

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};

/**
 * Get online status of users
 */
const isUserOnline = (userId) => {
  return activeUsers.has(userId) && activeUsers.get(userId).size > 0;
};

/**
 * Get active connections count for user
 */
const getUserConnectionCount = (userId) => {
  return activeUsers.has(userId) ? activeUsers.get(userId).size : 0;
};

/**
 * Broadcast to user via all their connections
 */
const sendToUser = (io, userId, event, data) => {
  const userSockets = activeUsers.get(userId);
  if (userSockets) {
    userSockets.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
  }
};

module.exports = {
  initializeSocket,
  isUserOnline,
  getUserConnectionCount,
  sendToUser,
  activeUsers,
  socketUsers
};
