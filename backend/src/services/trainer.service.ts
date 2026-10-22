import TrainerModel, { type TrainerDocument, type ITrainer } from "../models/trainer.model.js";
import mongoose from "mongoose";

// ✅ CREATE TRAINER
export const createTrainer = async (data: ITrainer): Promise<TrainerDocument> => {
  return await TrainerModel.create({
    name: data.name,
    specialization: data.specialization,
    experience: data.experience ?? 0, // ensure default 0 if missing
    status: data.status ?? "active",
  });
};

// ✅ GET ALL TRAINERS
export const getAllTrainers = async (): Promise<TrainerDocument[]> => {
  return await TrainerModel.find();
};

// ✅ GET TRAINER BY ID
export const getTrainerById = async (id: string): Promise<TrainerDocument | null> => {
  if (!mongoose.isValidObjectId(id)) return null;
  return await TrainerModel.findById(id);
};

// ✅ UPDATE TRAINER
export const updateTrainer = async (
  id: string,
  data: Partial<ITrainer>
): Promise<TrainerDocument | null> => {
  if (!mongoose.isValidObjectId(id)) return null;
  return await TrainerModel.findByIdAndUpdate(id, data, { new: true });
};

// ✅ DELETE TRAINER
export const deleteTrainer = async (id: string): Promise<TrainerDocument | null> => {
  if (!mongoose.isValidObjectId(id)) return null;
  return await TrainerModel.findByIdAndDelete(id);
};
