import type { Request, Response, NextFunction } from "express";
import * as GoalService from "../services/goal.service.js";
import { z } from "zod";
import mongoose from "mongoose";
import type { IGoal } from "../models/goal.model.js";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const goalSchema = z.object({
  memberId: objectId.transform((v) => new mongoose.Types.ObjectId(v)),
  goalType: z.string().min(1),
  target: z.string().min(1),
  deadline: z.coerce.date().optional(),
  assignedBy: objectId.transform((v) => new mongoose.Types.ObjectId(v)).optional()
});

export const createGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = goalSchema.parse(req.body) as unknown as IGoal;
    const created = await GoalService.createGoal(data);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
};

export const getAllGoals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.query;
    const list = memberId 
      ? await GoalService.getGoalsByMember(memberId as string)
      : await GoalService.getAllGoals();
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

export const getGoalById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = z.string().parse(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid Goal ID" });
    const found = await GoalService.getGoalById(id);
    if (!found) return res.status(404).json({ success: false, message: "Goal not found" });
    res.status(200).json({ success: true, data: found });
  } catch (err) {
    next(err);
  }
};

export const updateGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = z.string().parse(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid Goal ID" });
    const data = goalSchema.partial().parse(req.body) as Partial<IGoal>;
    const updated = await GoalService.updateGoal(id, data);
    if (!updated) return res.status(404).json({ success: false, message: "Goal not found" });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = z.string().parse(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid Goal ID" });
    const deleted = await GoalService.deleteGoal(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Goal not found" });
    res.status(200).json({ success: true, data: deleted });
  } catch (err) {
    next(err);
  }
};


