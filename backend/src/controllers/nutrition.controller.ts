import type { Request, Response, NextFunction } from "express";
import * as NutritionService from "../services/nutrition.service.js";
import { z } from "zod";
import mongoose from "mongoose";
import type { INutrition } from "../models/nutrition.model.js";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const nutritionSchema = z.object({
  memberId: objectId.transform((v) => new mongoose.Types.ObjectId(v)),
  mealType: z.string().min(1),
  calories: z.number().min(0),
  macros: z
    .object({
      protein: z.number().min(0).optional(),
      carbs: z.number().min(0).optional(),
      fats: z.number().min(0).optional()
    })
    .optional(),
  notes: z.string().optional(),
  date: z.coerce.date()
});

export const createNutrition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = nutritionSchema.parse(req.body) as unknown as INutrition;
    const created = await NutritionService.createNutrition(data);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
};

export const getAllNutrition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.query;
    const list = memberId 
      ? await NutritionService.getNutritionByMember(memberId as string)
      : await NutritionService.getAllNutrition();
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

export const getNutritionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = z.string().parse(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid Nutrition ID" });
    const found = await NutritionService.getNutritionById(id);
    if (!found) return res.status(404).json({ success: false, message: "Nutrition not found" });
    res.status(200).json({ success: true, data: found });
  } catch (err) {
    next(err);
  }
};

export const updateNutrition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = z.string().parse(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid Nutrition ID" });
    const data = nutritionSchema.partial().parse(req.body) as unknown as Partial<INutrition>;
    const updated = await NutritionService.updateNutrition(id, data);
    if (!updated) return res.status(404).json({ success: false, message: "Nutrition not found" });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteNutrition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = z.string().parse(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid Nutrition ID" });
    const deleted = await NutritionService.deleteNutrition(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Nutrition not found" });
    res.status(200).json({ success: true, data: deleted });
  } catch (err) {
    next(err);
  }
};





