import MembershipPlanModel from "../models/membershipPlan.model.js";
import AppAssert from "../util/AppAssert.js";
import { CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND } from "../constants/http.js";

type CreateMembershipPlanParams = {
    name: string;
    description?: string | undefined;
    price: number;
    currency: string;
    durationInDays: number;
    category: string;
};

type UpdateMembershipPlanParams = {
    name?: string | undefined;
    description?: string | undefined;
    price?: number | undefined;
    currency?: string | undefined;
    durationInDays?: number | undefined;
    category?: string | undefined;
};


export const getAllMembershipPlans = async () => {
    const membershipPlans = await MembershipPlanModel.find();
    return membershipPlans;
};


export const getMembershipPlanById = async (membershipPlanId: string) => {
    const membershipPlan = await MembershipPlanModel.findById(membershipPlanId);
    AppAssert(membershipPlan, NOT_FOUND, "Membership plan not found");
    return membershipPlan;
};


export const getMembershipPlansByCategory = async (category: string) => {
    const membershipPlans = await MembershipPlanModel.find({ category });
    return membershipPlans;
};


export const createMembershipPlan = async (data: CreateMembershipPlanParams) => {

    
    const existingMembershipPlan = await MembershipPlanModel.findOne({ name: data.name });

    AppAssert(!existingMembershipPlan, CONFLICT, "Membership plan with this name already exists");

    const membershipPlan = await MembershipPlanModel.create(data);
    AppAssert(membershipPlan, INTERNAL_SERVER_ERROR, "Failed to create membership plan");
    
    return membershipPlan;
};


export const updateMembershipPlan = async (membershipPlanId: string, updateData: UpdateMembershipPlanParams) => {
    
    const existingMembershipPlan = await MembershipPlanModel.findById(membershipPlanId);
    AppAssert(existingMembershipPlan, NOT_FOUND, "Membership plan not found");

    if (updateData.name) {
        const duplicateName = await MembershipPlanModel.findOne({ 
            name: updateData.name, 
            _id: { $ne: membershipPlanId } 
        });
        AppAssert(!duplicateName, CONFLICT, "Membership plan with this name already exists");
    }

    const updatedMembershipPlan = await MembershipPlanModel.findByIdAndUpdate(
        membershipPlanId, 
        updateData, 
        { new: true }
    );
    
    AppAssert(updatedMembershipPlan, INTERNAL_SERVER_ERROR, "Failed to update membership plan");
    return updatedMembershipPlan;
};


export const deleteMembershipPlan = async (membershipPlanId: string) => {

    const membershipPlan = await MembershipPlanModel.findById(membershipPlanId);

    AppAssert(membershipPlan, NOT_FOUND, "Membership plan not found");

    await MembershipPlanModel.findByIdAndDelete(membershipPlanId);
    
    return { message: "Membership plan deleted successfully" };
};


export const getMembershipPlanCategories = () => {
    return ["weights", "crossfit", "yoga", "mma", "other"];
};