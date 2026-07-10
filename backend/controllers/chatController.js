const db = require('../config/database');
const { sendError, sendSuccess } = require('../utils/responseFormatter');

const getCurrentUserId = (req) => req.userId || req.user?.id;

const domainManagers = {
  dev: ['programmer'],
  mkt: ['marketer'],
  sec: ['cyber_security_expert']
};

function chatNameForProject(project) {
  return `مشروع #${project.id} - ${project.title || project.service_name || 'طلب خدمة'}`;
}

async function getProjectParticipants(project) {
  const managerRoles = domainManagers[project.domain] || domainManagers.dev;
  const roles = ['admin', ...managerRoles];
  const placeholders = roles.map(() => '?').join(',');
  const params = [...roles];

  const [managers] = await db.execute(
    `
    SELECT u.id, r.name AS role_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.is_active = 1 AND LOWER(r.name) IN (${placeholders})
    `,
    params
  );

  const participantMap = new Map();
  participantMap.set(Number(project.client_id), 'owner');

  for (const manager of managers) {
    const role = String(manager.role_name).toLowerCase() === 'admin' ? 'admin' : 'member';
    participantMap.set(Number(manager.id), role);
  }

  if (project.assigned_to) {
    participantMap.set(Number(project.assigned_to), 'member');
  }

  return [...participantMap.entries()].map(([userId, role]) => ({ userId, role }));
}

async function canAccessProjectChat(userId, project) {
  if (Number(project.client_id) === Number(userId) || Number(project.assigned_to) === Number(userId)) {
    return true;
  }

  const [rows] = await db.execute(
    `
    SELECT r.name AS role_name, u.department
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ? AND u.is_active = 1
    LIMIT 1
    `,
    [userId]
  );

  if (!rows.length) return false;
  const role = String(rows[0].role_name).toLowerCase();
  if (role === 'admin') return true;

  return (domainManagers[project.domain] || []).includes(role);
}

async function ensureProjectChat(project, createdBy = null, options = { reactivate: true }) {
  const [existing] = await db.execute(
    'SELECT id, deleted_at FROM chats WHERE project_id = ? LIMIT 1',
    [project.id]
  );

  let chatId = existing[0]?.id;
  if (!chatId) {
    const [result] = await db.execute(
      `
      INSERT INTO chats (project_id, type, name, description, created_by, last_message_at)
      VALUES (?, 'group', ?, ?, ?, NOW())
      `,
      [
        project.id,
        chatNameForProject(project),
        `محادثة مباشرة بين العميل، مدير الخدمة، والمدير الرئيسي. المجال: ${project.domain || 'dev'}`,
        createdBy || project.client_id
      ]
    );
    chatId = result.insertId;
  } else {
    if (existing[0].deleted_at && !options.reactivate) {
      return chatId;
    }

    await db.execute(
      'UPDATE chats SET name = ?, description = ?, deleted_at = NULL WHERE id = ?',
      [
        chatNameForProject(project),
        `محادثة مباشرة بين العميل، مدير الخدمة، والمدير الرئيسي. المجال: ${project.domain || 'dev'}`,
        chatId
      ]
    );
  }

  const participants = await getProjectParticipants(project);

  const [existingParticipants] = await db.execute(
    'SELECT user_id, is_active FROM chat_participants WHERE chat_id = ?',
    [chatId]
  );
  const existingMap = new Map(existingParticipants.map((row) => [Number(row.user_id), row.is_active]));

  for (const participant of participants) {
    const existingActive = existingMap.get(Number(participant.userId));
    const isCurrentUser = Number(participant.userId) === Number(createdBy);

    if (existingActive === undefined) {
      await db.execute(
        'INSERT INTO chat_participants (chat_id, user_id, role, is_active, left_at) VALUES (?, ?, ?, TRUE, NULL)',
        [chatId, participant.userId, participant.role]
      );
    } else if (existingActive === false && options.reactivate && isCurrentUser) {
      await db.execute(
        'UPDATE chat_participants SET role = ?, is_active = TRUE, left_at = NULL WHERE chat_id = ? AND user_id = ?',
        [participant.role, chatId, participant.userId]
      );
    } else {
      await db.execute(
        'UPDATE chat_participants SET role = ? WHERE chat_id = ? AND user_id = ?',
        [participant.role, chatId, participant.userId]
      );
    }
  }

  return chatId;
}

async function ensureProjectChatsForUser(userId) {
  const [userRows] = await db.execute(
    `
    SELECT r.name AS role_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ? AND u.is_active = 1
    LIMIT 1
    `,
    [userId]
  );

  if (!userRows.length) return;
  const role = String(userRows[0].role_name).toLowerCase();

  let where = 'p.client_id = ? OR p.assigned_to = ?';
  const params = [userId, userId];

  if (role === 'admin') {
    where = '1=1';
    params.length = 0;
  } else if (role === 'programmer') {
    where = `${where} OR p.domain = 'dev'`;
  } else if (role === 'marketer') {
    where = `${where} OR p.domain = 'mkt'`;
  } else if (role === 'cyber_security_expert') {
    where = `${where} OR p.domain = 'sec'`;
  }

  const [projects] = await db.execute(
    `
    SELECT p.id, p.client_id, p.assigned_to, p.domain, p.title, s.name AS service_name
    FROM projects p
    LEFT JOIN services s ON p.service_id = s.id
    WHERE ${where}
    ORDER BY p.created_at DESC
    LIMIT 100
    `,
    params
  );

  for (const project of projects) {
    await ensureProjectChat(project, userId, { reactivate: false });
  }
}

// =============================================
// CHATS MANAGEMENT
// =============================================

/**
 * Get all chats for the current user
 * GET /api/chats
 */
const getChats = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    await ensureProjectChatsForUser(userId);

    await db.execute(
      `UPDATE chats c
       SET deleted_at = NULL
       WHERE deleted_at IS NOT NULL
         AND EXISTS (
           SELECT 1 FROM chat_participants cp
           WHERE cp.chat_id = c.id AND cp.is_active = TRUE
         )`
    );

    const participantId = Number(req.query.participantId || req.query.userId || req.query.clientId);
    const projectId = Number(req.query.projectId || req.query.project);
    const filterParts = [];
    const params = [userId, userId, userId];

    if (Number.isInteger(participantId) && participantId > 0) {
      filterParts.push(
        `EXISTS (
           SELECT 1 FROM chat_participants cp2
           WHERE cp2.chat_id = c.id AND cp2.user_id = ? AND cp2.is_active = TRUE
         )`
      );
      params.push(participantId);
    }

    if (Number.isInteger(projectId) && projectId > 0) {
      filterParts.push('c.project_id = ?');
      params.push(projectId);
    }

    const filters = filterParts.length ? ` AND ${filterParts.join(' AND ')}` : '';
    const query = `
      SELECT 
        c.id,
        c.project_id,
        c.type,
        c.name,
        c.description,
        c.avatar,
        c.created_by,
        c.is_archived,
        c.is_pinned,
        c.last_message_at,
        c.created_at,
        u.first_name as created_by_name,
        (SELECT COUNT(*) FROM chat_participants WHERE chat_id = c.id AND is_active = TRUE) as member_count,
        (SELECT content FROM chat_messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM chat_messages m 
         LEFT JOIN chat_read_receipts r ON m.id = r.message_id AND r.user_id = ?
         WHERE m.chat_id = c.id AND r.id IS NULL AND m.sender_id != ?) as unread_count
      FROM chats c
      JOIN users u ON c.created_by = u.id
      JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE cp.user_id = ? AND cp.is_active = TRUE${filters}
      ORDER BY c.is_pinned DESC, c.last_message_at DESC
      LIMIT 100
    `;

    const [chats] = await db.execute(query, params);
    return sendSuccess(res, chats, 'تم جلب المحادثات بنجاح');
  } catch (error) {
    console.error('Error fetching chats:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * Create a new chat
 * POST /api/chats
 */
const createChat = async (req, res) => {
  try {
    const { type, name, description, participantIds } = req.body;
    const userId = getCurrentUserId(req);

    if (!['direct', 'group', 'channel'].includes(type)) {
      return sendError(res, 'نوع المحادثة غير صالح', 400);
    }

    // Validate participants
    if (type === 'direct' && (!participantIds || participantIds.length !== 1)) {
      return sendError(res, 'المحادثة المباشرة يجب أن تكون بين شخصين فقط', 400);
    }

    if ((type === 'group' || type === 'channel') && (!participantIds || participantIds.length < 1)) {
      return sendError(res, 'يجب تحديد مشاركين على الأقل', 400);
    }

    // Create chat
    const insertQuery = 'INSERT INTO chats (type, name, description, created_by) VALUES (?, ?, ?, ?)';
    const [result] = await db.execute(insertQuery, [type, name || null, description || null, userId]);
    const chatId = result.insertId;

    // Add creator as owner
    await db.execute(
      'INSERT INTO chat_participants (chat_id, user_id, role) VALUES (?, ?, ?)',
      [chatId, userId, 'owner']
    );

    // Add other participants
    for (const participantId of participantIds) {
      await db.execute(
        'INSERT INTO chat_participants (chat_id, user_id, role) VALUES (?, ?, ?)',
        [chatId, participantId, 'member']
      );
    }

    // Create notification for participants
    for (const participantId of participantIds) {
      await db.execute(
        'INSERT INTO chat_notifications (user_id, chat_id, type) VALUES (?, ?, ?)',
        [participantId, chatId, 'member_joined']
      );
    }

    return sendSuccess(res, { id: chatId }, 'تم إنشاء المحادثة بنجاح', 201);
  } catch (error) {
    console.error('Error creating chat:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * Start or open the project service chat.
 * POST /api/chats/projects/:projectId/start
 */
const startProjectChat = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { projectId } = req.params;

    const [projects] = await db.execute(
      `
      SELECT p.id, p.client_id, p.assigned_to, p.domain, p.title, s.name AS service_name
      FROM projects p
      LEFT JOIN services s ON p.service_id = s.id
      WHERE p.id = ?
      LIMIT 1
      `,
      [projectId]
    );

    if (!projects.length) {
      return sendError(res, 'المشروع غير موجود', 404);
    }

    const project = projects[0];
    if (!(await canAccessProjectChat(userId, project))) {
      return sendError(res, 'ليس لديك صلاحية الوصول إلى محادثة هذا المشروع', 403);
    }

    const chatId = await ensureProjectChat(project, userId, { reactivate: true });
    return sendSuccess(res, { chatId, projectId: Number(projectId) }, 'تم فتح محادثة المشروع');
  } catch (error) {
    console.error('Error starting project chat:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * Get chat details
 * GET /api/chats/:id
 */
const getChatDetails = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const userId = getCurrentUserId(req);

    // Check if user is participant
    const [participant] = await db.execute(
      'SELECT * FROM chat_participants WHERE chat_id = ? AND user_id = ? AND is_active = TRUE',
      [chatId, userId]
    );

    if (participant.length === 0) {
      return sendError(res, 'ليس لديك صلاحية الوصول إلى هذه المحادثة', 403);
    }

    const query = `
      SELECT 
        c.*,
        u.first_name as created_by_name,
        u.profile_image as created_by_avatar
      FROM chats c
      JOIN users u ON c.created_by = u.id
      WHERE c.id = ?
    `;

    const [chats] = await db.execute(query, [chatId]);
    if (chats.length === 0) {
      return sendError(res, 'المحادثة غير موجودة', 404);
    }

    return sendSuccess(res, chats[0], 'تم جلب تفاصيل المحادثة');
  } catch (error) {
    console.error('Error fetching chat details:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * Join or restore a chat for the current user
 * POST /api/chats/:id/join
 */
const joinChat = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const userId = getCurrentUserId(req);

    const [participants] = await db.execute(
      'SELECT * FROM chat_participants WHERE chat_id = ? AND user_id = ?',
      [chatId, userId]
    );

    if (participants.length === 0) {
      return sendError(res, 'ليس لديك صلاحية الانضمام إلى هذه المحادثة', 403);
    }

    await db.execute(
      'UPDATE chat_participants SET is_active = TRUE, left_at = NULL WHERE chat_id = ? AND user_id = ?',
      [chatId, userId]
    );

    return sendSuccess(res, { chatId: Number(chatId) }, 'تم إعادة تفعيل المحادثة بنجاح');
  } catch (error) {
    console.error('Error joining chat:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * Update chat
 * PUT /api/chats/:id
 */
const updateChat = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const { name, description, avatar } = req.body;
    const userId = getCurrentUserId(req);

    // Check if user is admin/owner
    const [participant] = await db.execute(
      'SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?',
      [chatId, userId]
    );

    if (participant.length === 0 || !['admin', 'owner'].includes(participant[0].role)) {
      return sendError(res, 'ليس لديك صلاحية تعديل هذه المحادثة', 403);
    }

    const updateQuery = 'UPDATE chats SET name = ?, description = ?, avatar = ? WHERE id = ?';
    await db.execute(updateQuery, [name, description, avatar, chatId]);

    return sendSuccess(res, {}, 'تم تحديث المحادثة بنجاح');
  } catch (error) {
    console.error('Error updating chat:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * Delete chat
 * DELETE /api/chats/:id
 */
const deleteChat = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const userId = getCurrentUserId(req);

    // Check if user is participant
    const [participant] = await db.execute(
      'SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?',
      [chatId, userId]
    );

    if (participant.length === 0) {
      return sendError(res, 'ليس لديك صلاحية حذف هذه المحادثة', 403);
    }

    // Hide the chat for the current user only
    await db.execute(
      'UPDATE chat_participants SET is_active = FALSE, left_at = NOW() WHERE chat_id = ? AND user_id = ?',
      [chatId, userId]
    );

    return sendSuccess(res, {}, 'تم حذف المحادثة من جهتك بنجاح');
  } catch (error) {
    console.error('Error deleting chat:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * Delete all chats for the current user
 * DELETE /api/chats/delete-all
 */
const deleteAllChats = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);

    // Hide all chats for current user only
    await db.execute(
      `UPDATE chat_participants
       SET is_active = FALSE, left_at = NOW()
       WHERE user_id = ? AND is_active = TRUE`,
      [userId]
    );

    return sendSuccess(res, {}, 'تم حذف جميع المحادثات من جهتك بنجاح');
  } catch (error) {
    console.error('Error deleting all chats:', error);
    return sendError(res, error.message, 500);
  }
};

// =============================================
// MESSAGES MANAGEMENT
// =============================================

/**
 * Get messages from a chat
 * GET /api/chats/:id/messages?page=1&limit=20
 */
const getMessages = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = getCurrentUserId(req);

    // Check if user is participant
    const [participant] = await db.execute(
      'SELECT * FROM chat_participants WHERE chat_id = ? AND user_id = ? AND is_active = TRUE',
      [chatId, userId]
    );

    if (participant.length === 0) {
      return sendError(res, 'ليس لديك صلاحية الوصول إلى هذه المحادثة', 403);
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    const query = `
      SELECT 
        m.id,
        m.chat_id,
        m.sender_id,
        m.content,
        m.edited_at,
        m.deleted_at,
        m.reply_to_id,
        m.created_at,
        u.first_name,
        u.last_name,
        u.profile_image,
        (SELECT COUNT(*) FROM chat_reactions WHERE message_id = m.id) as reaction_count,
        (SELECT COUNT(*) FROM chat_read_receipts WHERE message_id = m.id) as read_count
      FROM chat_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ? AND m.deleted_at IS NULL
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [messages] = await db.execute(query, [chatId, limitNum, offset]);
    const messageIds = messages.map((message) => message.id).filter(Boolean);
    let attachmentsByMessage = {};

    if (messageIds.length > 0) {
      const placeholders = messageIds.map(() => '?').join(',');
      const [attachments] = await db.execute(
        `SELECT message_id, id, file_url, file_name, file_type, file_size, mime_type
         FROM chat_attachments
         WHERE message_id IN (${placeholders})
         ORDER BY id ASC`,
        messageIds
      );

      attachmentsByMessage = attachments.reduce((acc, attachment) => {
        const messageId = attachment.message_id;
        if (!acc[messageId]) acc[messageId] = [];
        acc[messageId].push({
          id: attachment.id,
          url: attachment.file_url,
          name: attachment.file_name,
          type: attachment.file_type,
          mimeType: attachment.mime_type,
          size: attachment.file_size
        });
        return acc;
      }, {});
    }

    const parsedMessages = messages.map((message) => ({
      ...message,
      attachments: attachmentsByMessage[message.id] || []
    }));

    return sendSuccess(res, {
      messages: parsedMessages.reverse(),
      page: pageNum,
      limit: limitNum,
      total: messages.length
    }, 'تم جلب الرسائل بنجاح');
  } catch (error) {
    console.error('Error fetching messages:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * Send a message
 * POST /api/chats/:id/messages
 */
const sendMessage = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const { content, replyToId } = req.body;
    const userId = getCurrentUserId(req);
      const files = Array.isArray(req.files) ? req.files : [];

      if ((!content || content.trim().length === 0) && files.length === 0) {
        return sendError(res, 'محتوى الرسالة أو ملف واحد على الأقل مطلوب', 400);
      }

      // Check if user is participant
      const [participant] = await db.execute(
        'SELECT * FROM chat_participants WHERE chat_id = ? AND user_id = ? AND is_active = TRUE',
        [chatId, userId]
      );

      if (participant.length === 0) {
        return sendError(res, 'ليس لديك صلاحية الوصول إلى هذه المحادثة', 403);
      }

      const insertQuery = `
        INSERT INTO chat_messages (chat_id, sender_id, content, reply_to_id)
        VALUES (?, ?, ?, ?)
      `;

      const [result] = await db.execute(insertQuery, [
        chatId,
        userId,
        content || '',
        replyToId || null
      ]);

      const attachments = [];
      if (files.length > 0) {
        for (const file of files) {
          const fileType = file.mimetype ? file.mimetype.split('/')[0] : 'file';
          const fileUrl = `/uploads/${file.filename}`;
          const [attachmentResult] = await db.execute(
            `INSERT INTO chat_attachments (message_id, file_url, file_name, file_type, file_size, mime_type)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [result.insertId, fileUrl, file.originalname, fileType, file.size, file.mimetype]
          );

          attachments.push({
            id: attachmentResult.insertId,
            url: fileUrl,
            name: file.originalname,
            type: fileType,
            mimeType: file.mimetype,
            size: file.size
          });
        }
      }

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
      }

      const [senderInfo] = await db.execute(
        'SELECT id, first_name, last_name, profile_image FROM users WHERE id = ?',
        [userId]
      );

      const message = {
        id: result.insertId,
        chat_id: Number(chatId),
        sender_id: userId,
        sender_name: `${senderInfo[0]?.first_name || ''} ${senderInfo[0]?.last_name || ''}`.trim(),
        sender_avatar: senderInfo[0]?.profile_image || null,
        first_name: senderInfo[0]?.first_name || '',
        last_name: senderInfo[0]?.last_name || '',
        content: content || '',
        attachments,
        created_at: new Date()
      };

      if (req.app?.io) {
        req.app.io.to(`chat_${chatId}`).emit('message_received', message);
        for (const p of participants) {
          req.app.io.to(`user_${p.user_id}`).emit('notification', {
            type: 'message',
            chatId: Number(chatId),
            messageId: result.insertId,
            senderName: message.sender_name
          });
        }
      }

      return sendSuccess(res, message, 'تم إرسال الرسالة بنجاح', 201);
    } catch (error) {
      console.error('Error sending message:', error);
      return sendError(res, error.message, 500);
    }
  };

/**
 * Edit a message
 * PUT /api/messages/:id
 */
const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { content } = req.body;
    const userId = getCurrentUserId(req);

    if (!content || content.trim().length === 0) {
      return sendError(res, 'محتوى الرسالة مطلوب', 400);
    }

    // Check if user is the sender
    const [message] = await db.execute(
      'SELECT * FROM chat_messages WHERE id = ?',
      [messageId]
    );

    if (message.length === 0) {
      return sendError(res, 'الرسالة غير موجودة', 404);
    }

    if (message[0].sender_id !== userId) {
      return sendError(res, 'لا يمكنك تعديل رسالة شخص آخر', 403);
    }

    await db.execute(
      'UPDATE chat_messages SET content = ?, edited_at = NOW() WHERE id = ?',
      [content, messageId]
    );

    return sendSuccess(res, {}, 'تم تعديل الرسالة بنجاح');
  } catch (error) {
    console.error('Error editing message:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * Delete a message
 * DELETE /api/messages/:id
 */
const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = getCurrentUserId(req);

    // Check if user is the sender
    const [message] = await db.execute(
      'SELECT * FROM chat_messages WHERE id = ?',
      [messageId]
    );

    if (message.length === 0) {
      return sendError(res, 'الرسالة غير موجودة', 404);
    }

    if (message[0].sender_id !== userId) {
      return sendError(res, 'لا يمكنك حذف رسالة شخص آخر', 403);
    }

    await db.execute(
      'UPDATE chat_messages SET deleted_at = NOW() WHERE id = ?',
      [messageId]
    );

    return sendSuccess(res, {}, 'تم حذف الرسالة بنجاح');
  } catch (error) {
    console.error('Error deleting message:', error);
    return sendError(res, error.message, 500);
  }
};

// =============================================
// REACTIONS
// =============================================

/**
 * Add reaction to a message
 * POST /api/messages/:id/reactions
 */
const addReaction = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = getCurrentUserId(req);

    if (!emoji) {
      return sendError(res, 'emoji مطلوب', 400);
    }

    // Check if message exists
    const [message] = await db.execute(
      'SELECT * FROM chat_messages WHERE id = ? AND deleted_at IS NULL',
      [messageId]
    );

    if (message.length === 0) {
      return sendError(res, 'الرسالة غير موجودة', 404);
    }

    // Insert or ignore duplicate
    await db.execute(
      'INSERT IGNORE INTO chat_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)',
      [messageId, userId, emoji]
    );

    return sendSuccess(res, { emoji }, 'تم إضافة التفاعل بنجاح', 201);
  } catch (error) {
    console.error('Error adding reaction:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * Remove reaction from a message
 * DELETE /api/messages/:id/reactions/:emoji
 */
const removeReaction = async (req, res) => {
  try {
    const { id: messageId, emoji } = req.params;
    const userId = getCurrentUserId(req);

    await db.execute(
      'DELETE FROM chat_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
      [messageId, userId, emoji]
    );

    return sendSuccess(res, {}, 'تم إزالة التفاعل بنجاح');
  } catch (error) {
    console.error('Error removing reaction:', error);
    return sendError(res, error.message, 500);
  }
};

// =============================================
// READ RECEIPTS
// =============================================

/**
 * Mark message as read
 * POST /api/messages/:id/read
 */
const markMessageAsRead = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = getCurrentUserId(req);

    const insertQuery = `
      INSERT INTO chat_read_receipts (message_id, user_id, read_at)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE read_at = NOW()
    `;

    await db.execute(insertQuery, [messageId, userId]);

    return sendSuccess(res, {}, 'تم وضع علامة القراءة');
  } catch (error) {
    console.error('Error marking message as read:', error);
    return sendError(res, error.message, 500);
  }
};

// =============================================
// PARTICIPANTS MANAGEMENT
// =============================================

/**
 * Get chat participants
 * GET /api/chats/:id/participants
 */
const getParticipants = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const userId = getCurrentUserId(req);

    // Check if user is participant
    const [participant] = await db.execute(
      'SELECT * FROM chat_participants WHERE chat_id = ? AND user_id = ? AND is_active = TRUE',
      [chatId, userId]
    );

    if (participant.length === 0) {
      return sendError(res, 'ليس لديك صلاحية الوصول إلى هذه المحادثة', 403);
    }

    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.profile_image,
        u.is_active,
        cp.role,
        cp.joined_at
      FROM chat_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.chat_id = ? AND cp.is_active = TRUE
      ORDER BY cp.role DESC, u.first_name ASC
    `;

    const [participants] = await db.execute(query, [chatId]);
    return sendSuccess(res, participants, 'تم جلب المشاركين بنجاح');
  } catch (error) {
    console.error('Error fetching participants:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * Add participant to chat
 * POST /api/chats/:id/participants
 */
const addParticipant = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const { userId } = req.body;
    const currentUserId = getCurrentUserId(req);

    if (!userId) {
      return sendError(res, 'معرف المستخدم مطلوب', 400);
    }

    // Check if current user is admin/owner
    const [participant] = await db.execute(
      'SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?',
      [chatId, currentUserId]
    );

    if (participant.length === 0 || !['admin', 'owner'].includes(participant[0].role)) {
      return sendError(res, 'ليس لديك صلاحية إضافة أعضاء', 403);
    }

    // Check if user already exists
    const [existing] = await db.execute(
      'SELECT * FROM chat_participants WHERE chat_id = ? AND user_id = ?',
      [chatId, userId]
    );

    if (existing.length > 0) {
      if (existing[0].is_active) {
        return sendError(res, 'هذا المستخدم بالفعل عضو في المحادثة', 400);
      } else {
        // Reactivate
        await db.execute(
          'UPDATE chat_participants SET is_active = TRUE, left_at = NULL WHERE chat_id = ? AND user_id = ?',
          [chatId, userId]
        );
      }
    } else {
      // Add new participant
      await db.execute(
        'INSERT INTO chat_participants (chat_id, user_id, role) VALUES (?, ?, ?)',
        [chatId, userId, 'member']
      );
    }

    // Create notification
    await db.execute(
      'INSERT INTO chat_notifications (user_id, chat_id, type) VALUES (?, ?, ?)',
      [userId, chatId, 'member_joined']
    );

    return sendSuccess(res, {}, 'تم إضافة المشارك بنجاح', 201);
  } catch (error) {
    console.error('Error adding participant:', error);
    return sendError(res, error.message, 500);
  }
};

/**
 * Remove participant from chat
 * DELETE /api/chats/:id/participants/:userId
 */
const removeParticipant = async (req, res) => {
  try {
    const { id: chatId, userId } = req.params;
    const currentUserId = getCurrentUserId(req);

    // Check if current user is admin/owner
    const [participant] = await db.execute(
      'SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?',
      [chatId, currentUserId]
    );

    if (participant.length === 0 || !['admin', 'owner'].includes(participant[0].role)) {
      return sendError(res, 'ليس لديك صلاحية إزالة الأعضاء', 403);
    }

    await db.execute(
      'UPDATE chat_participants SET is_active = FALSE, left_at = NOW() WHERE chat_id = ? AND user_id = ?',
      [chatId, userId]
    );

    // Create notification
    await db.execute(
      'INSERT INTO chat_notifications (user_id, chat_id, type) VALUES (?, ?, ?)',
      [userId, chatId, 'member_left']
    );

    return sendSuccess(res, {}, 'تم إزالة المشارك بنجاح');
  } catch (error) {
    console.error('Error removing participant:', error);
    return sendError(res, error.message, 500);
  }
};

// =============================================
// SEARCH
// =============================================

/**
 * Search chats and messages
 * GET /api/chats/search?q=keyword
 */
const searchChats = async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    const userId = getCurrentUserId(req);

    if (!q || q.trim().length < 2) {
      return sendError(res, 'البحث يجب أن يكون على الأقل 2 أحرف', 400);
    }

    const searchTerm = `%${q}%`;

    let query = `
      SELECT 
        'chat' as result_type,
        c.id,
        c.name,
        c.type,
        null as message_id,
        null as message_content,
        null as sender_name
      FROM chats c
      JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE cp.user_id = ? AND cp.is_active = TRUE 
        AND (c.name LIKE ? OR c.description LIKE ?)
    `;

    const params = [userId, searchTerm, searchTerm];

    if (type === 'all' || type === 'messages') {
      query += `
        UNION ALL
        SELECT 
          'message' as result_type,
          m.chat_id as id,
          null as name,
          null as type,
          m.id as message_id,
          m.content as message_content,
          u.first_name as sender_name
        FROM chat_messages m
        JOIN users u ON m.sender_id = u.id
        JOIN chat_participants cp ON m.chat_id = cp.chat_id
        WHERE cp.user_id = ? AND m.content LIKE ? AND m.deleted_at IS NULL
        LIMIT 50
      `;
      params.push(userId, searchTerm);
    }

    const [results] = await db.execute(query, params);

    return sendSuccess(res, results, 'تم البحث بنجاح');
  } catch (error) {
    console.error('Error searching:', error);
    return sendError(res, error.message, 500);
  }
};

module.exports = {
  // Chats
  getChats,
  createChat,
  startProjectChat,
  getChatDetails,
  updateChat,
  deleteChat,
  deleteAllChats,
  // Messages
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  // Reactions
  addReaction,
  removeReaction,
  // Read Receipts
  markMessageAsRead,
  // Participants
  getParticipants,
  addParticipant,
  removeParticipant,
  joinChat,
  // Search
  searchChats
};
