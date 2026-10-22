import { Router } from 'express';
import {
    createRefundRequest,
    getRefundRequests,
    getRefundRequestById,
    getRefundRequestsByUser,
    updateRefundRequest,
    deleteRefundRequest,
    approveRefundRequest,
    declineRefundRequest,
    getPendingRequestsCount
} from '../controllers/refundRequest.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

// Public routes (will need authentication later)
router.post('/', createRefundRequest); // Users create refund requests
router.get('/user/:userId', getRefundRequestsByUser); // Users view their requests

// Admin routes (will need admin authentication)
router.get('/', getRefundRequests); // Admin view all requests
router.get('/count', getPendingRequestsCount); // Admin get pending count for badge
router.get('/:id', getRefundRequestById); // Admin view specific request
router.put('/:id', updateRefundRequest); // Admin update request
router.delete('/:id', deleteRefundRequest); // Admin delete request
router.put('/:id/approve', approveRefundRequest); // Admin approve request
router.put('/:id/decline', declineRefundRequest); // Admin decline request

export default router;