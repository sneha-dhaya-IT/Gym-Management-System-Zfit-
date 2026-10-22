import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Request } from 'express';

// Extend Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role?: string;
            };
        }
    }
}

// Ensure upload directories exist
const createUploadDirs = () => {
    const dirs = [
        'uploads',
        'uploads/bank-receipts'
    ];

    dirs.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    });
};

// Call this when the service is loaded
createUploadDirs();

// Storage configuration for bank receipt images
const bankReceiptStorage = (multer as any).diskStorage({
    destination: (req: Request, file: any, cb: (error: Error | null, destination: string) => void) => {
        const uploadPath = path.join(process.cwd(), 'uploads', 'bank-receipts');
        cb(null, uploadPath);
    },
    filename: (req: Request, file: any, cb: (error: Error | null, filename: string) => void) => {
        // Generate unique filename: userId_timestamp_random.ext
        const userId = req.user?.id || 'anonymous';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = path.extname(file.originalname).toLowerCase();
        const filename = `${userId}_${timestamp}_${random}${extension}`;
        cb(null, filename);
    }
});

// File filter for images only
const imageFileFilter = (req: Request, file: any, cb: any) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
    }
};

// Multer configuration for bank receipt uploads
export const uploadReceiptImage = (multer as any)({
    storage: bankReceiptStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only one file at a time
    }
});

// Error handling middleware for multer
export const handleMulterError = (error: any, req: Request, res: any, next: any) => {
    if (error && error.code) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 5MB.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files uploaded.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field.'
            });
        }
    }

    if (error && error.message && error.message.includes('Only image files')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    // Pass other errors to next middleware
    next(error);
};

// Utility function to delete uploaded file (for cleanup on errors)
export const deleteUploadedFile = (filename: string) => {
    try {
        const filePath = path.join(process.cwd(), 'uploads', 'bank-receipts', filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('Error deleting uploaded file:', error);
    }
};

// Utility function to get file info
export const getFileInfo = (filename: string) => {
    try {
        const filePath = path.join(process.cwd(), 'uploads', 'bank-receipts', filename);
        const stats = fs.statSync(filePath);
        return {
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
        };
    } catch (error) {
        console.error('Error getting file info:', error);
        return null;
    }
};