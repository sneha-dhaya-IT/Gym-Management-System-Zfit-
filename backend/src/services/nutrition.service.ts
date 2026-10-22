import mongoose from "mongoose";
import NutritionModel, { type NutritionDocument, type INutrition } from "../models/nutrition.model.js";

export const createNutrition = async (data: INutrition): Promise<NutritionDocument> => {
  return NutritionModel.create(data);
};

export const getAllNutrition = async (): Promise<NutritionDocument[]> => {
  return NutritionModel.find();
};

export const getNutritionByMember = async (memberId: string): Promise<NutritionDocument[]> => {
  if (!mongoose.Types.ObjectId.isValid(memberId)) throw new Error("Invalid Member ID");
  return NutritionModel.find({ memberId }).sort({ date: -1 });
};

export const getNutritionById = async (id: string): Promise<NutritionDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Nutrition ID");
  return NutritionModel.findById(id);
};

export const updateNutrition = async (id: string, data: Partial<INutrition>): Promise<NutritionDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Nutrition ID");
  return NutritionModel.findByIdAndUpdate(id, data, { new: true });
};

export const deleteNutrition = async (id: string): Promise<NutritionDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Nutrition ID");
  return NutritionModel.findByIdAndDelete(id);
};


