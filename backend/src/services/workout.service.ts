import mongoose from "mongoose";
import WorkoutModel, { type WorkoutDocument, type IWorkout } from "../models/workout.model.js";

export const createWorkout = async (data: IWorkout): Promise<WorkoutDocument> => {
  return WorkoutModel.create(data);
};

export const getAllWorkouts = async (): Promise<WorkoutDocument[]> => {
  return WorkoutModel.find();
};

export const getWorkoutsByMember = async (memberId: string): Promise<WorkoutDocument[]> => {
  if (!mongoose.Types.ObjectId.isValid(memberId)) throw new Error("Invalid Member ID");
  return WorkoutModel.find({ memberId }).sort({ date: -1 });
};

export const getWorkoutById = async (id: string): Promise<WorkoutDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Workout ID");
  return WorkoutModel.findById(id);
};

export const updateWorkout = async (id: string, data: Partial<IWorkout>): Promise<WorkoutDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Workout ID");
  return WorkoutModel.findByIdAndUpdate(id, data, { new: true });
};

export const deleteWorkout = async (id: string): Promise<WorkoutDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Workout ID");
  return WorkoutModel.findByIdAndDelete(id);
};


