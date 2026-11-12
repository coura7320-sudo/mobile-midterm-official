import { Router } from 'express';
import { authenticateJwt } from '../middleware/authMiddleware';
import {
  getStatuses,
  createStatus,
  markStatusViewed,
} from '../controllers/statusController';

const router = Router();

router.use(authenticateJwt);
router.get('/', getStatuses);
router.post('/', createStatus);
router.patch('/:id/view', markStatusViewed);

export default router;
