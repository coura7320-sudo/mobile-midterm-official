import { Router } from 'express';
import { authenticateJwt } from '../middleware/authMiddleware';
import {
  getConversationMessages,
  sendMessageRest,
  toggleStarMessage,
  getStarredMessages,
} from '../controllers/messageController';

const router = Router();

router.use(authenticateJwt);
router.get('/starred', getStarredMessages);
router.get('/:conversationId', getConversationMessages);
router.post('/', sendMessageRest);
router.patch('/:id/star', toggleStarMessage);

export default router;
