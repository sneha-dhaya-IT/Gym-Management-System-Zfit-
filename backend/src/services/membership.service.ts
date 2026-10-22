import MembershipModel from "../models/membership.model.js";
import MembershipPlanModel from "../models/membershipPlan.model.js";
import UserModel from "../models/user.model.js";
import AppAssert from "../util/AppAssert.js";
import { CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND } from "../constants/http.js";

type CreateMembershipParams = {
    userId: string;
    membershipPlanId: string;
    startDate?: Date | undefined;
    transactionId?: string | undefined;
    autoRenew?: boolean | undefined;
    notes?: string | undefined;
};

type UpdateMembershipParams = {
    endDate?: Date | undefined;
    status?: 'active' | 'expired' | 'cancelled' | 'paused' | undefined;
    autoRenew?: boolean | undefined;
    transactionId?: string | undefined;
    notes?: string | undefined;
};

export const getAllMemberships = async () => {
    const memberships = await MembershipModel.find()
        .populate('userId', 'name email')
        .populate('membershipPlanId', 'name price currency durationInDays category');
    return memberships;
};

export const getMembershipById = async (membershipId: string) => {
    const membership = await MembershipModel.findById(membershipId)
        .populate('userId', 'name email')
        .populate('membershipPlanId', 'name price currency durationInDays category');
    AppAssert(membership, NOT_FOUND, "Membership not found");
    return membership;
};

export const getUserMemberships = async (userId: string) => {
    const memberships = await MembershipModel.find({ userId })
        .populate('membershipPlanId', 'name price currency durationInDays category')
        .sort({ createdAt: -1 });
    return memberships;
};

export const getActiveMemberships = async () => {
    const memberships = await MembershipModel.findActiveMemberships();
    return memberships;
};

export const getExpiringMemberships = async (days: number = 7) => {
    const memberships = await MembershipModel.findExpiringMemberships(days);
    return memberships;
};

export const getUserActiveMembership = async (userId: string) => {
    const membership = await MembershipModel.findOne({
        userId,
        status: 'active',
        endDate: { $gt: new Date() }
    }).populate('membershipPlanId', 'name price currency durationInDays category');
    
    return membership;
};

export const createMembership = async (data: CreateMembershipParams) => {
    // Verify user exists
    const user = await UserModel.findById(data.userId);
    AppAssert(user, NOT_FOUND, "User not found");

    // Verify membership plan exists
    const membershipPlan = await MembershipPlanModel.findById(data.membershipPlanId);
    AppAssert(membershipPlan, NOT_FOUND, "Membership plan not found");

    // Allow multiple memberships - remove the conflict check
    const existingMembership = await MembershipModel.findOne({
        userId: data.userId,
        status: 'active',
        endDate: { $gt: new Date() }
    });
    
    if (existingMembership) {
        console.log('User already has active membership, but creating new one as requested');
    }

    // Calculate end date
    const startDate = data.startDate || new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + membershipPlan.durationInDays);

    const membership = await MembershipModel.create({
        userId: data.userId,
        membershipPlanId: data.membershipPlanId,
        startDate,
        endDate,
        transactionId: data.transactionId,
        autoRenew: data.autoRenew || false,
        notes: data.notes
    });

    AppAssert(membership, INTERNAL_SERVER_ERROR, "Failed to create membership");

    // Return with populated data
    const populatedMembership = await MembershipModel.findById(membership._id)
        .populate('userId', 'name email')
        .populate('membershipPlanId', 'name price currency durationInDays category');

    return populatedMembership;
};

export const createOrExtendMembership = async (data: CreateMembershipParams) => {
    // Verify user exists
    const user = await UserModel.findById(data.userId);
    AppAssert(user, NOT_FOUND, "User not found");

    // Verify membership plan exists
    const membershipPlan = await MembershipPlanModel.findById(data.membershipPlanId);
    AppAssert(membershipPlan, NOT_FOUND, "Membership plan not found");

    // Check if user already has an active membership for the same plan
    const existingMembership = await MembershipModel.findOne({
        userId: data.userId,
        membershipPlanId: data.membershipPlanId,
        status: 'active',
        endDate: { $gt: new Date() }
    });

    if (existingMembership) {
        // Extend existing membership
        console.log('Found existing active membership for the same plan, extending duration...');
        
        const newEndDate = new Date(existingMembership.endDate);
        newEndDate.setDate(newEndDate.getDate() + membershipPlan.durationInDays);
        
        const extendedMembership = await MembershipModel.findByIdAndUpdate(
            existingMembership._id,
            { 
                endDate: newEndDate,
                notes: `Extended by ${membershipPlan.durationInDays} days from payment ${data.transactionId || 'N/A'}. Previous note: ${existingMembership.notes || 'None'}`
            },
            { new: true }
        ).populate('userId', 'name email').populate('membershipPlanId', 'name price currency durationInDays category');

        console.log('Membership extended successfully:', {
            membershipId: extendedMembership?._id,
            previousEndDate: existingMembership.endDate,
            newEndDate: newEndDate,
            addedDays: membershipPlan.durationInDays
        });

        AppAssert(extendedMembership, INTERNAL_SERVER_ERROR, "Failed to extend membership");
        return extendedMembership;
    } else {
        // Create new membership
        console.log('No existing active membership found for this plan, creating new membership...');
        
        const startDate = data.startDate || new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + membershipPlan.durationInDays);

        const membership = await MembershipModel.create({
            userId: data.userId,
            membershipPlanId: data.membershipPlanId,
            startDate,
            endDate,
            transactionId: data.transactionId,
            autoRenew: data.autoRenew || false,
            notes: data.notes || `Created from payment ${data.transactionId || 'N/A'}`
        });

        AppAssert(membership, INTERNAL_SERVER_ERROR, "Failed to create membership");

        // Return with populated data
        const populatedMembership = await MembershipModel.findById(membership._id)
            .populate('userId', 'name email')
            .populate('membershipPlanId', 'name price currency durationInDays category');

        console.log('New membership created successfully:', populatedMembership);
        return populatedMembership;
    }
};

export const updateMembership = async (membershipId: string, updateData: UpdateMembershipParams) => {
    const membership = await MembershipModel.findById(membershipId);
    AppAssert(membership, NOT_FOUND, "Membership not found");

    const updatedMembership = await MembershipModel.findByIdAndUpdate(
        membershipId,
        updateData,
        { new: true }
    )
    .populate('userId', 'name email')
    .populate('membershipPlanId', 'name price currency durationInDays category');

    AppAssert(updatedMembership, INTERNAL_SERVER_ERROR, "Failed to update membership");
    return updatedMembership;
};

export const cancelMembership = async (membershipId: string, reason?: string) => {
    const membership = await MembershipModel.findById(membershipId);
    AppAssert(membership, NOT_FOUND, "Membership not found");
    AppAssert(membership.status === 'active', CONFLICT, "Only active memberships can be cancelled");

    const updatedMembership = await MembershipModel.findByIdAndUpdate(
        membershipId,
        {
            status: 'cancelled',
            cancellationDate: new Date(),
            cancellationReason: reason
        },
        { new: true }
    )
    .populate('userId', 'name email')
    .populate('membershipPlanId', 'name price currency durationInDays category');

    return updatedMembership;
};

export const pauseMembership = async (membershipId: string, reason?: string) => {
    const membership = await MembershipModel.findById(membershipId);
    AppAssert(membership, NOT_FOUND, "Membership not found");
    AppAssert(membership.status === 'active', CONFLICT, "Only active memberships can be paused");

    const updatedMembership = await MembershipModel.findByIdAndUpdate(
        membershipId,
        {
            status: 'paused',
            notes: reason ? `Paused: ${reason}` : 'Paused'
        },
        { new: true }
    )
    .populate('userId', 'name email')
    .populate('membershipPlanId', 'name price currency durationInDays category');

    return updatedMembership;
};

export const resumeMembership = async (membershipId: string) => {
    const membership = await MembershipModel.findById(membershipId);
    AppAssert(membership, NOT_FOUND, "Membership not found");
    AppAssert(membership.status === 'paused', CONFLICT, "Only paused memberships can be resumed");

    const updatedMembership = await MembershipModel.findByIdAndUpdate(
        membershipId,
        {
            status: 'active',
            notes: 'Resumed'
        },
        { new: true }
    )
    .populate('userId', 'name email')
    .populate('membershipPlanId', 'name price currency durationInDays category');

    return updatedMembership;
};

export const extendMembership = async (membershipId: string, additionalDays: number) => {
    const membership = await MembershipModel.findById(membershipId);
    AppAssert(membership, NOT_FOUND, "Membership not found");

    const newEndDate = new Date(membership.endDate);
    newEndDate.setDate(newEndDate.getDate() + additionalDays);

    const updatedMembership = await MembershipModel.findByIdAndUpdate(
        membershipId,
        { endDate: newEndDate },
        { new: true }
    )
    .populate('userId', 'name email')
    .populate('membershipPlanId', 'name price currency durationInDays category');

    return updatedMembership;
};

export const deleteMembership = async (membershipId: string) => {
    const membership = await MembershipModel.findById(membershipId);
    AppAssert(membership, NOT_FOUND, "Membership not found");

    await MembershipModel.findByIdAndDelete(membershipId);
    return { message: "Membership deleted successfully" };
};