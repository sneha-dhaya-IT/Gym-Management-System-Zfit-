import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { 
    getAllMembershipPlans, 
    getMembershipPlanById, 
    getMembershipPlansByCategory, 
    createMembershipPlan,
    updateMembershipPlan,
    deleteMembershipPlan,
    getMembershipPlanCategories
} from "../services/membershipPlan.service.js";
import { CREATED, OK } from "../constants/http.js";

// Zod validation schemas
const createMembershipPlanSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters")
        .trim(),
    description: z.string()
        .max(1000, "Description must be at most 1000 characters")
        .optional(),
    price: z.number()
        .min(0.01, "Price must be greater than 0"),
    currency: z.enum(["LKR", "USD"]).default("LKR"),
    durationInDays: z.number()
        .int()
        .min(1, "Duration must be at least 1 day"),
    category: z.enum(["weights", "crossfit", "yoga", "mma", "other"])
});

const updateMembershipPlanSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters")
        .trim()
        .optional(),
    description: z.string()
        .max(1000, "Description must be at most 1000 characters")
        .optional(),
    price: z.number()
        .min(0.01, "Price must be greater than 0")
        .optional(),
    currency: z.enum(["LKR", "USD"]).optional(),
    durationInDays: z.number()
        .int()
        .min(1, "Duration must be at least 1 day")
        .optional(),
    category: z.enum(["weights", "crossfit", "yoga", "mma", "other"]).optional()
});

const membershipPlanIdSchema = z.string().min(1, "Membership plan ID is required");
const categorySchema = z.enum(["weights", "crossfit", "yoga", "mma", "other"]);

// Controller handlers
export const getAllMembershipPlansHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const membershipPlans = await getAllMembershipPlans();
        
        return res.status(OK).json({
            success: true,
            data: membershipPlans
        });
    } catch (error) {
        next(error);
    }
};

export const getMembershipPlanByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const membershipPlanId = membershipPlanIdSchema.parse(req.params.id);
        const membershipPlan = await getMembershipPlanById(membershipPlanId);
        
        return res.status(OK).json({
            success: true,
            data: membershipPlan
        });
    } catch (error) {
        next(error);
    }
};

export const getMembershipPlansByCategoryHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const category = categorySchema.parse(req.params.category);
        const membershipPlans = await getMembershipPlansByCategory(category);
        
        return res.status(OK).json({
            success: true,
            data: membershipPlans
        });
    } catch (error) {
        next(error);
    }
};

export const createMembershipPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const membershipPlanData = createMembershipPlanSchema.parse(req.body);
        const membershipPlan = await createMembershipPlan(membershipPlanData);
        
        return res.status(CREATED).json({
            success: true,
            message: "Membership plan created successfully",
            data: membershipPlan
        });
    } catch (error) {
        next(error);
    }
};

export const updateMembershipPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const membershipPlanId = membershipPlanIdSchema.parse(req.params.id);
        const updateData = updateMembershipPlanSchema.parse(req.body);
        
        const membershipPlan = await updateMembershipPlan(membershipPlanId, updateData);
        
        return res.status(OK).json({
            success: true,
            message: "Membership plan updated successfully",
            data: membershipPlan
        });
    } catch (error) {
        next(error);
    }
};

export const deleteMembershipPlanHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const membershipPlanId = membershipPlanIdSchema.parse(req.params.id);
        const result = await deleteMembershipPlan(membershipPlanId);
        
        return res.status(OK).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

export const getMembershipPlanCategoriesHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = getMembershipPlanCategories();
        
        return res.status(OK).json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};