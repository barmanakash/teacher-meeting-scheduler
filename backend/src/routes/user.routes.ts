import { Router } from 'express';
import { authenticate, requireTeacher } from '../middleware/auth.middleware';
import { getAllCandidates, getUserById, updateProfile, getAllTeachers } from '../controllers/user.controller';

const router = Router();

router.get('/candidates', authenticate, requireTeacher, getAllCandidates);
router.get('/teachers', authenticate, getAllTeachers);
router.get('/:id', authenticate, getUserById);
router.put('/profile', authenticate, updateProfile);

export default router;
