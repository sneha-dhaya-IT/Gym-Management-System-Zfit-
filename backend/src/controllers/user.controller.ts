import { type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { passwordSchema } from "./auth.controller.js";
import { 
    getAllUsers, 
    getAllMembers, 
    getActiveMembers, 
    getInactiveMembers,
    getAllStaff, 
    getAllManagers, 
    getUserById, 
    getUserByEmail, 
    createUser, 
    updateUser, 
    deleteUser, 
    updateUserStatus 
} from "../services/user.service.js";
import { CREATED, OK } from "../constants/http.js";

// Validation schemas
const createUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    password: passwordSchema,
    contactNo: z.string()
        .min(1, "Phone number is required")
        .regex(/^(?:\+94|0)[1-9]\d{8}$/, "Enter a valid Sri Lankan Phone number"),
    dob: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date"),
    profile: z.object({
        address: z.string().optional(),
        emergencyContact: z.string().optional()
    }).optional(),
    consent: z.object({
        gdpr: z.boolean(),
        marketing: z.boolean(),
    }),
    role: z.enum(['member', 'staff', 'manager']),
    status: z.enum(['active', 'inactive', 'expired']).default('active'),
});

const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: passwordSchema.optional(),
    contactNo: z.string()
        .regex(/^(?:\+94|0)[1-9]\d{8}$/)
        .optional(),
    dob: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date"),
    profile: z.object({
        address: z.string().optional(),
        emergencyContact: z.string().optional()
    }).optional(),
    role: z.enum(['member', 'staff', 'manager']).optional(),
    status: z.enum(['active', 'inactive', 'expired']).optional(),
});

const userIdSchema = z.string().min(1, "User ID is required");
const emailSchema = z.string().email("Invalid email format");
const statusSchema = z.object({
    status: z.enum(['active', 'inactive', 'expired'])
});


export const getAllUsersHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await getAllUsers();
        
        return res.status(OK).json({
            success: true,
            data: users,
            message: "Users retrieved successfully"
        });
    } catch (error) {
        next(error);
    }
};


export const getAllMembersHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const members = await getAllMembers();
        
        return res.status(OK).json({
            success: true,
            data: members,
            message: "Members retrieved successfully"
        });
    } catch (error) {
        next(error);
    }
};


export const getActiveMembersHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const members = await getActiveMembers();
        
        return res.status(OK).json({
            success: true,
            data: members,
            message: "Active members retrieved successfully"
        });
    } catch (error) {
        next(error);
    }
};


export const getInactiveMembersHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const members = await getInactiveMembers();
        
        return res.status(OK).json({
            success: true,
            data: members,
            message: "Inactive members retrieved successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const getAllStaffHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const staff = await getAllStaff();
        
        return res.status(OK).json({
            success: true,
            data: staff,
            message: "Staff retrieved successfully"
        });
    } catch (error) {
        next(error);
    }
};


export const getAllManagersHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const managers = await getAllManagers();
        
        return res.status(OK).json({
            success: true,
            data: managers,
            message: "Managers retrieved successfully"
        });
    } catch (error) {
        next(error);
    }
};


export const getUserByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = userIdSchema.parse(req.params.id);
        const user = await getUserById(userId);
        
        return res.status(OK).json({
            success: true,
            data: user,
            message: "User retrieved successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const getUserByEmailHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = emailSchema.parse(req.params.email);
        const user = await getUserByEmail(email);
        
        return res.status(OK).json({
            success: true,
            data: user,
            message: "User retrieved successfully"
        });
    } catch (error) {
        next(error);
    }
};


export const createUserHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userData = createUserSchema.parse(req.body);
        const user = await createUser(userData);
        
        return res.status(CREATED).json({
            success: true,
            data: user,
            message: "User created successfully"
        });
    } catch (error) {
        next(error);
    }
};


export const updateUserHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = userIdSchema.parse(req.params.id);
        const updateData = updateUserSchema.parse(req.body);
        
        const user = await updateUser(userId, updateData);
        
        return res.status(OK).json({
            success: true,
            data: user,
            message: "User updated successfully"
        });
    } catch (error) {
        next(error);
    }
};


export const deleteUserHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = userIdSchema.parse(req.params.id);
        const result = await deleteUser(userId);
        
        return res.status(OK).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};


export const updateUserStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = userIdSchema.parse(req.params.id);
        const { status } = statusSchema.parse(req.body);
        
        const user = await updateUserStatus(userId, status);
        
        return res.status(OK).json({
            success: true,
            data: user,
            message: "User status updated successfully"
        });
    } catch (error) {
        next(error);
    }
};