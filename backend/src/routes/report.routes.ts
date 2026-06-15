import { Router } from 'express';
import { authenticate, requireTeacher } from '../middleware/auth.middleware';
import { getAnalytics, exportExcel, exportPDF } from '../controllers/report.controller';

const router = Router();

router.get('/analytics', authenticate, requireTeacher, getAnalytics);
router.get('/export/excel', authenticate, requireTeacher, exportExcel);
router.get('/export/pdf', authenticate, requireTeacher, exportPDF);

export default router;
