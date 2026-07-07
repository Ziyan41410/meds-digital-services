const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('../middlewares/auth');
const chatController = require('../controllers/chatController');

const uploadsDir = path.join(__dirname, '../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safeName = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

const router = express.Router();

// =============================================
// CHATS ROUTES
// =============================================

// Get all chats
router.get('/', verifyToken, chatController.getChats);

// Create new chat
router.post('/', verifyToken, chatController.createChat);

// Search chats and messages
router.get('/search/all', verifyToken, chatController.searchChats);

// Start or open the project service chat
router.post('/projects/:projectId/start', verifyToken, chatController.startProjectChat);

// Get chat details
router.get('/:id', verifyToken, chatController.getChatDetails);

// Join or restore chat for the current user
router.post('/:id/join', verifyToken, chatController.joinChat);

// Update chat
router.put('/:id', verifyToken, chatController.updateChat);

// Delete all chats for current user
router.delete('/delete-all', verifyToken, chatController.deleteAllChats);
// Delete chat
router.delete('/:id', verifyToken, chatController.deleteChat);

// =============================================
// MESSAGES ROUTES
// =============================================

// Get messages from a chat
router.get('/:id/messages', verifyToken, chatController.getMessages);

// Send message
router.post('/:id/messages', verifyToken, upload.array('files', 6), chatController.sendMessage);

// Edit message
router.put('/messages/:id', verifyToken, chatController.editMessage);

// Delete message
router.delete('/messages/:id', verifyToken, chatController.deleteMessage);

// =============================================
// REACTIONS ROUTES
// =============================================

// Add reaction
router.post('/messages/:id/reactions', verifyToken, chatController.addReaction);

// Remove reaction
router.delete('/messages/:id/reactions/:emoji', verifyToken, chatController.removeReaction);

// =============================================
// READ RECEIPTS ROUTES
// =============================================

// Mark message as read
router.post('/messages/:id/read', verifyToken, chatController.markMessageAsRead);

// =============================================
// PARTICIPANTS ROUTES
// =============================================

// Get chat participants
router.get('/:id/participants', verifyToken, chatController.getParticipants);

// Add participant
router.post('/:id/participants', verifyToken, chatController.addParticipant);

// Remove participant
router.delete('/:id/participants/:userId', verifyToken, chatController.removeParticipant);

module.exports = router;
