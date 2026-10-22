import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
    getAllMemberships,
    getMembershipById,
    getUserMemberships,
    getActiveMemberships,
    getExpiringMemberships,
    getUserActiveMembership,
    createMembership,
    updateMembership,
    cancelMembership,
    pauseMembership,
    resumeMembership,
    extendMembership,
    deleteMembership
} from "../services/membership.service.js";
import { CREATED, OK } from "../constants/http.js";

// Zod validation schemas
const createMembershipSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    membershipPlanId: z.string().min(1, "Membership plan ID is required"),
    startDate: z.string().datetime().optional(),
    transactionId: z.string().optional(),
    autoRenew: z.boolean().default(false),
    notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional()
});

const updateMembershipSchema = z.object({
    endDate: z.string().datetime().optional(),
    status: z.enum(['active', 'expired', 'cancelled', 'paused']).optional(),
    autoRenew: z.boolean().optional(),
    transactionId: z.string().optional(),
    notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional()
});

const membershipIdSchema = z.string().min(1, "Membership ID is required");
const userIdSchema = z.string().min(1, "User ID is required");

const cancelMembershipSchema = z.object({
    reason: z.string().max(500, "Reason cannot exceed 500 characters").optional()
});

const pauseMembershipSchema = z.object({
    reason: z.string().max(500, "Reason cannot exceed 500 characters").optional()
});

const extendMembershipSchema = z.object({
    additionalDays: z.number().int().min(1, "Additional days must be at least 1")
});

const expiringDaysSchema = z.object({
    days: z.number().int().min(1).max(365).default(7)
});

// Controller handlers
export const getAllMembershipsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const memberships = await getAllMemberships();
        
        return res.status(OK).json({
            success: true,
            data: memberships
        });
    } catch (error) {
        next(error);
    }
};

export const getMembershipByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const membershipId = membershipIdSchema.parse(req.params.id);
        const membership = await getMembershipById(membershipId);
        
        return res.status(OK).json({
            success: true,
            data: membership
        });
    } catch (error) {
        next(error);
    }
};

export const getUserMembershipsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = userIdSchema.parse(req.params.userId);
        const memberships = await getUserMemberships(userId);
        
        return res.status(OK).json({
            success: true,
            data: memberships
        });
    } catch (error) {
        next(error);
    }
};

export const getActiveMembershipsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const memberships = await getActiveMemberships();
        
        return res.status(OK).json({
            success: true,
            data: memberships
        });
    } catch (error) {
        next(error);
    }
};

export const getExpiringMembershipsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { days } = expiringDaysSchema.parse(req.query);
        const memberships = await getExpiringMemberships(days);
        
        return res.status(OK).json({
            success: true,
            data: memberships
        });
    } catch (error) {
        next(error);
    }
};

export const getUserActiveMembershipHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = userIdSchema.parse(req.params.userId);
        const membership = await getUserActiveMembership(userId);
        
        return res.status(OK).json({
            success: true,
            data: membership
        });
    } catch (error) {
        next(error);
    }
};

export const createMembershipHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const membershipData = createMembershipSchema.parse(req.body);
        
        // Convert startDate string to Date if provided
        const processedData = {
            ...membershipData,
            startDate: membershipData.startDate ? new Date(membershipData.startDate) : undefined
        };
        
        const membership = await createMembership(processedData);
        
        return res.status(CREATED).json({
            success: true,
            message: "Membership created successfully",
            data: membership
        });
    } catch (error) {
        next(error);
    }
};

export const updateMembershipHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const membershipId = membershipIdSchema.parse(req.params.id);
        const updateData = updateMembershipSchema.parse(req.body);
        
        // Convert endDate string to Date if provided
        const processedData = {
            ...updateData,
            endDate: updateData.endDate ? new Date(updateData.endDate) : undefined
        };
        
        const membership = await updateMembership(membershipId, processedData);
        
        return res.status(OK).json({
            success: true,
            message: "Membership updated successfully",
            data: membership
        });
    } catch (error) {
        next(error);
    }
};

export const cancelMembershipHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const membershipId = membershipIdSchema.parse(req.params.id);
        const { reason } = cancelMembershipSchema.parse(req.body);
        
        const membership = await cancelMembership(membershipId, reason);
        
        return res.status(OK).json({
            success: true,
            message: "Membership cancelled successfully",
            data: membership
        });
    } catch (error) {
        next(error);
    }
};

export const pauseMembershipHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const membershipId = membershipIdSchema.parse(req.params.id);
        const { reason } = pauseMembershipSchema.parse(req.body);
        
        const membership = await pauseMembership(membershipId, reason);
        
        return res.status(OK).json({
            success: true,
            message: "Membership paused successfully",
            data: membership
        });
    } catch (error) {
        next(error);
    }
};

export const resumeMembershipHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const membershipId = membershipIdSchema.parse(req.params.id);
        const membership = await resumeMembership(membershipId);
        
        return res.status(OK).json({
            success: true,
            message: "Membership resumed successfully",
            data: membership
        });
    } catch (error) {
        next(error);
    }
};

export const extendMembershipHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const membershipId = membershipIdSchema.parse(req.params.id);
        const { additionalDays } = extendMembershipSchema.parse(req.body);
        
        const membership = await extendMembership(membershipId, additionalDays);
        
        return res.status(OK).json({
            success: true,
            message: "Membership extended successfully",
            data: membership
        });
    } catch (error) {
        next(error);
    }
};

export const deleteMembershipHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const membershipId = membershipIdSchema.parse(req.params.id);
        const result = await deleteMembership(membershipId);
        
        return res.status(OK).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};