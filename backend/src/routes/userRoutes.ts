import { Router } from 'express';
import { authenticateJwt } from '../middleware/authMiddleware';
import { getAllUsers, getUserById, updateProfile } from '../controllers/userController';

const router = Router();

router.use(authenticateJwt);
router.get('/', getAllUsers);
router.put('/profile', updateProfile);
router.get('/:id', getUserById);

export default router;
