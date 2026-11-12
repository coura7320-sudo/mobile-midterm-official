import { Router } from 'express';
import { authenticateJwt } from '../middleware/authMiddleware';
import {
  getConversations,
  getOrCreateDirectConversation,
  toggleArchiveConversation,
} from '../controllers/conversationController';

const router = Router();

router.use(authenticateJwt);
router.get('/', getConversations);
router.post('/direct', getOrCreateDirectConversation);
router.patch('/:id/archive', toggleArchiveConversation);

export default router;
