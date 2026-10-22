import Progress, { type IProgress } from "../models/progress.model.js";

// CRUD
export const getAllProgress = async (): Promise<IProgress[]> => Progress.find();
export const getProgressById = async (id: string): Promise<IProgress | null> => Progress.findById(id);
export const createProgress = async (data: Partial<IProgress>): Promise<IProgress> => new Progress(data).save();
export const updateProgress = async (id: string, data: Partial<IProgress>): Promise<IProgress | null> =>
  Progress.findByIdAndUpdate(id, data, { new: true });
export const deleteProgress = async (id: string): Promise<IProgress | null> => Progress.findByIdAndDelete(id);

// Report
export const generateProgressReport = async (memberId: string) => Progress.find({ memberId }).sort({ date: -1 });
