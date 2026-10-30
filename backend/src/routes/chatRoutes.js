const express = require('express');
const { chat, healthCheck } = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, chat);
router.get('/health', healthCheck);

module.exports = router; 