// ══════════════════════════════════════════════════════
// Socket.IO Real-time Communication & Updates
// ══════════════════════════════════════════════════════

const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Store active user connections
const activeUsers = new Map();

const setupSocket = (io) => {
  // Middleware to verify token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error('No token provided');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const [rows] = await db.query(
        `SELECT u.id, u.department, LOWER(r.name) AS role_name
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = ? AND u.is_active = 1
         LIMIT 1`,
        [decoded.id]
      );

      if (!rows.length) throw new Error('User not found');

      socket.userId = rows[0].id;
      socket.userRole = rows[0].role_name;
      socket.userDept = rows[0].department;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  /**
   * Broadcast stats update (called from server when stats change)
   */
  const broadcastStatsUpdate = (role) => {
    io.to(`dashboard:${role}`).emit('stats:updated', {
      timestamp: new Date()
    });
    io.to(`dashboard:${role}`).emit('stats:update', {
      timestamp: new Date()
    });
  };

  /**
   * Send notification to specific user
   * (typically called from backend)
   */
  const notifyUser = (userId, notification) => {
    const socketId = activeUsers.get(userId)?.socketId;
    if (socketId) {
      io.to(socketId).emit('notification:received', notification);
    }
  };

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected:`, socket.id);
    
    // Store user connection
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      role: socket.userRole,
      department: socket.userDept,
      connectedAt: new Date()
    });

    // Broadcast user online status
    io.emit('user:online', {
      userId: socket.userId,
      timestamp: new Date()
    });

    // ════════════════════════════════════════
    // CHAT EVENTS
    // ════════════════════════════════════════

    /**
     * User joins a chat/order room
     */
    socket.on('join:order', async (orderId) => {
      const room = `order:${orderId}`;
      socket.join(room);
      
      // Notify others user is viewing
      socket.to(room).emit('user:viewing', {
        userId: socket.userId,
        orderId,
        timestamp: new Date()
      });
    });

    /**
     * User sends a message
     */
    socket.on('message:send', async (data) => {
      try {
        const { orderId, content, files = [] } = data;

        // Validate input
        if (!content.trim() || content.length > 5000) {
          return socket.emit('message:error', {
            message: 'Message must be between 1 and 5000 characters'
          });
        }

        // Save message to database
        const [result] = await db.query(
          `INSERT INTO messages (conversation_id, sender_id, content, created_at)
           SELECT id, ?, ?, NOW() FROM conversations WHERE order_id = ?
           LIMIT 1`,
          [socket.userId, content, orderId]
        );

        const messageId = result.insertId;

        // Save files if any
        if (files && files.length > 0) {
          for (const file of files) {
            await db.query(
              `INSERT INTO message_files (message_id, file_url, file_type, file_name, file_size)
               VALUES (?, ?, ?, ?, ?)`,
              [messageId, file.url, file.type, file.name, file.size]
            );
          }
        }

        // Fetch the saved message with files
        const [message] = await db.query(
          `SELECT m.*, u.first_name, u.last_name, u.avatar,
                  JSON_ARRAYAGG(JSON_OBJECT('url', mf.file_url, 'name', mf.file_name, 'type', mf.file_type)) as files
           FROM messages m
           LEFT JOIN users u ON m.sender_id = u.id
           LEFT JOIN message_files mf ON m.id = mf.message_id
           WHERE m.id = ?
           GROUP BY m.id`,
          [messageId]
        );

        const room = `order:${orderId}`;
        
        // Broadcast to room
        io.to(room).emit('message:new', {
          id: message[0].id,
          orderId,
          sender: {
            id: socket.userId,
            name: `${message[0].first_name} ${message[0].last_name}`,
            avatar: message[0].avatar
          },
          content: message[0].content,
          files: message[0].files,
          timestamp: message[0].created_at
        });

        // Notify all clients of unread messages
        const [conversation] = await db.query(
          'SELECT client_id FROM conversations WHERE order_id = ?',
          [orderId]
        );

        if (conversation[0].client_id !== socket.userId) {
          // Manager sent message to client
          const clientSocketId = activeUsers.get(conversation[0].client_id)?.socketId;
          if (clientSocketId) {
            io.to(clientSocketId).emit('notification:message', {
              orderId,
              senderName: `${message[0].first_name} ${message[0].last_name}`,
              preview: content.substring(0, 50),
              timestamp: new Date()
            });
          }
        }
      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('message:error', {
          message: 'Failed to send message'
        });
      }
    });

    /**
     * User is typing indicator
     */
    socket.on('typing:start', (orderId) => {
      const room = `order:${orderId}`;
      socket.to(room).emit('user:typing', {
        userId: socket.userId,
        orderId
      });
    });

    socket.on('typing:stop', (orderId) => {
      const room = `order:${orderId}`;
      socket.to(room).emit('user:stoppedTyping', {
        userId: socket.userId,
        orderId
      });
    });

    /**
     * Mark message as read
     */
    socket.on('message:markAsRead', async (messageId) => {
      try {
        await db.query(
          'UPDATE messages SET is_read = 1, read_at = NOW() WHERE id = ?',
          [messageId]
        );

        socket.emit('message:readConfirmed', { messageId });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // ════════════════════════════════════════
    // ORDER STATUS UPDATE EVENTS
    // ════════════════════════════════════════

    /**
     * Order status changed
     */
    socket.on('order:statusUpdate', async (data) => {
      try {
        const { orderId, newStatus, notes } = data;

        // Get order details
        const [order] = await db.query(
          'SELECT client_id, assigned_to FROM projects WHERE id = ?',
          [orderId]
        );

        if (!order.length) {
          return socket.emit('error', { message: 'Order not found' });
        }

        // Check authorization (manager or super admin only)
        if (socket.userRole === 'client') {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        // Update order status
        await db.query(
          'UPDATE projects SET status = ?, updated_at = NOW() WHERE id = ?',
          [newStatus, orderId]
        );

        // Log timeline
        await db.query(
          `INSERT INTO order_timeline (order_id, changed_by, to_status, changed_at)
           VALUES (?, ?, ?, NOW())`,
          [orderId, socket.userId, newStatus]
        );

        // Notify client
        const clientSocketId = activeUsers.get(order[0].client_id)?.socketId;
        if (clientSocketId) {
          io.to(clientSocketId).emit('order:statusChanged', {
            orderId,
            newStatus,
            notes,
            timestamp: new Date()
          });
        }

        // Broadcast to all admins/managers
        io.emit('admin:orderUpdated', {
          orderId,
          newStatus,
          updatedBy: socket.userId,
          timestamp: new Date()
        });

        ['admin', 'programmer', 'marketer', 'cyber_security_expert', 'client'].forEach((role) => {
          io.to(`dashboard:${role}`).emit('stats:updated', { timestamp: new Date() });
          io.to(`dashboard:${role}`).emit('stats:update', { timestamp: new Date() });
        });

        // Create notification
        await db.query(
          `INSERT INTO notifications (user_id, type, title, body, related_order_id, created_at)
           VALUES (?, 'order_updated', ?, ?, ?, NOW())`,
          [order[0].client_id, `Order #${orderId} Updated`, `Status: ${newStatus}`, orderId]
        );
      } catch (error) {
        console.error('Order status update error:', error);
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // ════════════════════════════════════════
    // DASHBOARD STATS UPDATES
    // ════════════════════════════════════════

    /**
     * Subscribe to dashboard updates
     */
    socket.on('dashboard:subscribe', () => {
      socket.join(`dashboard:${socket.userRole}`);
      socket.emit('dashboard:ready');
    });

    socket.on('join:dashboard', () => {
      socket.join(`dashboard:${socket.userRole}`);
      socket.emit('dashboard:ready');
    });

    socket.on('dashboard:unsubscribe', () => {
      socket.leave(`dashboard:${socket.userRole}`);
    });

    // ════════════════════════════════════════
    // NOTIFICATION EVENTS
    // ════════════════════════════════════════

    /**
     * Subscribe to notifications
     */
    socket.on('notifications:subscribe', () => {
      socket.join(`notifications:${socket.userId}`);
    });

    /**
     * Get unread notifications count
     */
    socket.on('notifications:getCount', async () => {
      try {
        const [result] = await db.query(
          'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
          [socket.userId]
        );

        socket.emit('notifications:count', {
          count: result[0].count
        });
      } catch (error) {
        console.error('Error getting notification count:', error);
      }
    });

    /**
     * Mark notification as read
     */
    socket.on('notification:markAsRead', async (notificationId) => {
      try {
        await db.query(
          'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?',
          [notificationId]
        );

        socket.emit('notification:readConfirmed', { notificationId });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    });

    // ════════════════════════════════════════
    // DISCONNECTION
    // ════════════════════════════════════════

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected:`, socket.id);
      
      activeUsers.delete(socket.userId);

      // Notify others user is offline
      io.emit('user:offline', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // ════════════════════════════════════════
    // ERROR HANDLING
    // ════════════════════════════════════════

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return {
    io,
    broadcastStatsUpdate,
    notifyUser,
    activeUsers
  };
};

// ════════════════════════════════════════════════════════
// SERVER-SIDE EVENT EMITTERS
// These functions are called from controllers/services
// ════════════════════════════════════════════════════════

/**
 * Emit order created event
 */
const emitOrderCreated = (io, order) => {
  io.to(`dashboard:super_admin`).emit('order:created', {
    id: order.id,
    title: order.title,
    department: order.department,
    clientName: order.clientName,
    timestamp: new Date()
  });

  // Notify assigned manager
  const managerSocket = activeUsers.get(order.assigned_to)?.socketId;
  if (managerSocket) {
    io.to(managerSocket).emit('order:assignedToMe', {
      id: order.id,
      title: order.title,
      timestamp: new Date()
    });
  }
};

/**
 * Emit invoice created event
 */
const emitInvoiceCreated = (io, invoice) => {
  // Notify client
  const clientSocket = activeUsers.get(invoice.client_id)?.socketId;
  if (clientSocket) {
    io.to(clientSocket).emit('invoice:created', {
      id: invoice.id,
      amount: invoice.amount,
      status: invoice.status,
      timestamp: new Date()
    });
  }
};

/**
 * Emit payment received event
 */
const emitPaymentReceived = (io, invoice) => {
  io.to(`dashboard:super_admin`).emit('payment:received', {
    invoiceId: invoice.id,
    amount: invoice.amount,
    timestamp: new Date()
  });
};

module.exports = {
  setupSocket,
  emitOrderCreated,
  emitInvoiceCreated,
  emitPaymentReceived
};
