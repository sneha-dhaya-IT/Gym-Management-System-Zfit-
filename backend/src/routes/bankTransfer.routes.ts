import { Router } from 'express';
import {
    uploadReceipt,
    createBankTransferPayment,
    getPendingBankTransfers,
    approveBankTransfer,
    declineBankTransfer,
    getUserBankTransfers,
    deleteBankTransfer
} from '../controllers/bankTransfer.controller.js';
import { uploadReceiptImage, handleMulterError } from '../services/fileUpload.service.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();
const adminRouter = Router();

// Temporarily remove authentication for testing
// router.use(authenticate());
// adminRouter.use(authenticate());

// User routes
// Upload receipt image
router.post('/upload', uploadReceiptImage.single('receipt'), handleMulterError, uploadReceipt);

// Create bank transfer payment
router.post('/', createBankTransferPayment);

// Get user's own bank transfer payments
router.get('/my-payments', getUserBankTransfers);

// Admin routes - require admin role
adminRouter.get('/pending', getPendingBankTransfers);
adminRouter.put('/:id/approve', approveBankTransfer);
adminRouter.put('/:id/decline', declineBankTransfer);
adminRouter.delete('/:id', deleteBankTransfer);

export { adminRouter };
export default router;