import { Router } from 'express';
import { authenticate, requireTeacher } from '../middleware/auth.middleware';
import { getMyAvailability, updateAvailability, addBlockedSlot, addHoliday } from '../controllers/availability.controller';

const router = Router();

router.get('/', authenticate, requireTeacher, getMyAvailability);
router.put('/', authenticate, requireTeacher, updateAvailability);
router.post('/block', authenticate, requireTeacher, addBlockedSlot);
router.post('/holiday', authenticate, requireTeacher, addHoliday);

export default router;
