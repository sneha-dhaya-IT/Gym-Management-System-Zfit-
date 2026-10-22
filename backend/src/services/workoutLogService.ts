import WorkoutLog, { type IWorkoutLog } from "../models/workoutLog.Model.js";

// CRUD
export const getAllWorkouts = async (): Promise<IWorkoutLog[]> => WorkoutLog.find();
export const getWorkoutById = async (id: string): Promise<IWorkoutLog | null> => WorkoutLog.findById(id);

export const createWorkout = async (data: Partial<IWorkoutLog>): Promise<IWorkoutLog> => {
  if (!data.memberId || !data.workout || !data.duration) {
    throw new Error("memberId, workout, and duration are required");
  }
  return new WorkoutLog(data).save();
};

export const updateWorkout = async (id: string, data: Partial<IWorkoutLog>): Promise<IWorkoutLog | null> => {
  return WorkoutLog.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const deleteWorkout = async (id: string): Promise<IWorkoutLog | null> => WorkoutLog.findByIdAndDelete(id);

// Report
export const generateWorkoutReport = async (memberId: string) => {
  const logs = await WorkoutLog.find({ memberId });
  const totalDuration = logs.reduce((sum, log) => sum + log.duration, 0);
  return {
    totalSessions: logs.length,
    totalDuration,
    avgDuration: logs.length ? totalDuration / logs.length : 0,
  };
};
