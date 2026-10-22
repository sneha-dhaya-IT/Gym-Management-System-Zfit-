import type { Request, Response, NextFunction } from "express";
import * as ProgressService from "../services/progress.service.js";
import { z } from "zod";
import mongoose from "mongoose";
import type { IProgress } from "../models/progress.model.js";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const progressSchema = z.object({
  memberId: objectId.transform((v) => new mongoose.Types.ObjectId(v)),
  workoutsCompleted: z.number().int().min(0),
  attendance: z.number().min(0),
  goalsAchieved: z.number().int().min(0),
  date: z.coerce.date()
});

export const createProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = progressSchema.parse(req.body) as unknown as IProgress;
    const created = await ProgressService.createProgress(data);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
};

export const getAllProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.query;
    const list = memberId 
      ? await ProgressService.getProgressByMember(memberId as string)
      : await ProgressService.getAllProgress();
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

export const getProgressById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = z.string().parse(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid Progress ID" });
    const found = await ProgressService.getProgressById(id);
    if (!found) return res.status(404).json({ success: false, message: "Progress not found" });
    res.status(200).json({ success: true, data: found });
  } catch (err) {
    next(err);
  }
};

export const updateProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = z.string().parse(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid Progress ID" });
    const data = progressSchema.partial().parse(req.body) as unknown as Partial<IProgress>;
    const updated = await ProgressService.updateProgress(id, data);
    if (!updated) return res.status(404).json({ success: false, message: "Progress not found" });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = z.string().parse(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid Progress ID" });
    const deleted = await ProgressService.deleteProgress(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Progress not found" });
    res.status(200).json({ success: true, data: deleted });
  } catch (err) {
    next(err);
  }
};





