import Workout, { type IWorkout } from "../models/workoutModel.js";

// Create workout
export const createWorkout = async (data: Partial<IWorkout>): Promise<IWorkout> => {
  const workout = new Workout(data);
  return await workout.save();
};

// Get all workouts
export const getAllWorkouts = async (): Promise<IWorkout[]> => {
  return await Workout.find();
};

// Get workout by ID
export const getWorkoutById = async (id: string): Promise<IWorkout | null> => {
  return await Workout.findById(id);
};

// Update workout
export const updateWorkout = async (id: string, data: Partial<IWorkout>): Promise<IWorkout | null> => {
  return await Workout.findByIdAndUpdate(id, data, { new: true });
};

// Delete workout
export const deleteWorkout = async (id: string): Promise<IWorkout | null> => {
  return await Workout.findByIdAndDelete(id);
};
