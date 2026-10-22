import Nutrition, { type INutrition } from "../models/nutrition.model.js";

// CRUD
export const getAllNutritions = async (): Promise<INutrition[]> => Nutrition.find();
export const getNutritionById = async (id: string): Promise<INutrition | null> => Nutrition.findById(id);
export const createNutrition = async (data: Partial<INutrition>): Promise<INutrition> => new Nutrition(data).save();
export const updateNutrition = async (id: string, data: Partial<INutrition>): Promise<INutrition | null> =>
  Nutrition.findByIdAndUpdate(id, data, { new: true });
export const deleteNutrition = async (id: string): Promise<INutrition | null> => Nutrition.findByIdAndDelete(id);

// Report
export const generateNutritionReport = async (memberId: string) => {
  return Nutrition.find({ memberId }).sort({ date: -1 });
};
