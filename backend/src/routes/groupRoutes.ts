import { Router } from 'express';
import { authenticateJwt } from '../middleware/authMiddleware';
import { getGroups, createGroup } from '../controllers/groupController';

const router = Router();

router.use(authenticateJwt);
router.get('/', getGroups);
router.post('/', createGroup);

export default router;
