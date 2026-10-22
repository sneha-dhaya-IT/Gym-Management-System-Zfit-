import mongoose from "mongoose";
import ProgressModel, { type ProgressDocument, type IProgress } from "../models/progress.model.js";

export const createProgress = async (data: IProgress): Promise<ProgressDocument> => {
  return ProgressModel.create(data);
};

export const getAllProgress = async (): Promise<ProgressDocument[]> => {
  return ProgressModel.find();
};

export const getProgressByMember = async (memberId: string): Promise<ProgressDocument[]> => {
  if (!mongoose.Types.ObjectId.isValid(memberId)) throw new Error("Invalid Member ID");
  return ProgressModel.find({ memberId }).sort({ date: -1 });
};

export const getProgressById = async (id: string): Promise<ProgressDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Progress ID");
  return ProgressModel.findById(id);
};

export const updateProgress = async (id: string, data: Partial<IProgress>): Promise<ProgressDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Progress ID");
  return ProgressModel.findByIdAndUpdate(id, data, { new: true });
};

export const deleteProgress = async (id: string): Promise<ProgressDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Progress ID");
  return ProgressModel.findByIdAndDelete(id);
};


