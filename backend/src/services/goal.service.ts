import mongoose from "mongoose";
import GoalModel, { type GoalDocument, type IGoal } from "../models/goal.model.js";

export const createGoal = async (data: IGoal): Promise<GoalDocument> => {
  return GoalModel.create(data);
};

export const getAllGoals = async (): Promise<GoalDocument[]> => {
  return GoalModel.find();
};

export const getGoalsByMember = async (memberId: string): Promise<GoalDocument[]> => {
  if (!mongoose.Types.ObjectId.isValid(memberId)) throw new Error("Invalid Member ID");
  return GoalModel.find({ memberId }).sort({ createdAt: -1 });
};

export const getGoalById = async (id: string): Promise<GoalDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Goal ID");
  return GoalModel.findById(id);
};

export const updateGoal = async (id: string, data: Partial<IGoal>): Promise<GoalDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Goal ID");
  return GoalModel.findByIdAndUpdate(id, data, { new: true });
};

export const deleteGoal = async (id: string): Promise<GoalDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Goal ID");
  return GoalModel.findByIdAndDelete(id);
};


