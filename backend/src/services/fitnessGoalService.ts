import FitnessGoal, { type IFitnessGoal } from "../models/fitnessGoal.model.js";

// Get all goals
export const getAllGoals = async (): Promise<IFitnessGoal[]> => {
  return await FitnessGoal.find();
};

// Get by ID
export const getGoalById = async (id: string): Promise<IFitnessGoal | null> => {
  return await FitnessGoal.findById(id);
};

// Create goal
export const createGoal = async (data: Partial<IFitnessGoal>): Promise<IFitnessGoal> => {
  const newGoal = new FitnessGoal(data);
  return await newGoal.save();
};

// Update goal
export const updateGoal = async (
  id: string,
  data: Partial<IFitnessGoal>
): Promise<IFitnessGoal | null> => {
  return await FitnessGoal.findByIdAndUpdate(id, data, { new: true });
};

// Delete goal
export const deleteGoal = async (id: string): Promise<IFitnessGoal | null> => {
  return await FitnessGoal.findByIdAndDelete(id);
};
