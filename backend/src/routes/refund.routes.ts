import { Router } from 'express';
import {
    createRefund, getRefunds, getRefundById, updateRefund, deleteRefund
} from '../controllers/refund.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getRefunds);
router.get('/:id', getRefundById);
router.post('/',  createRefund);
router.put('/:id', updateRefund);
router.delete('/:id', deleteRefund);

export default router;