import type { Request, Response, NextFunction } from "express";
import * as WorkoutService from "../services/workout.service.js";
import { z } from "zod";
import mongoose from "mongoose";
import type { IWorkout } from "../models/workout.model.js";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const workoutSchema = z.object({
  memberId: objectId.transform((v) => new mongoose.Types.ObjectId(v)),
  exercise: z.string().min(1),
  sets: z.number().int().min(1),
  reps: z.number().int().min(1),
  weight: z.number().min(0),
  notes: z.string().optional(),
  date: z.coerce.date()
});

export const createWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = workoutSchema.parse(req.body) as unknown as IWorkout;
    const created = await WorkoutService.createWorkout(data);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
};

export const getAllWorkouts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.query;
    const list = memberId 
      ? await WorkoutService.getWorkoutsByMember(memberId as string)
      : await WorkoutService.getAllWorkouts();
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

export const getWorkoutById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = z.string().parse(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid Workout ID" });
    const found = await WorkoutService.getWorkoutById(id);
    if (!found) return res.status(404).json({ success: false, message: "Workout not found" });
    res.status(200).json({ success: true, data: found });
  } catch (err) {
    next(err);
  }
};

export const updateWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = z.string().parse(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid Workout ID" });
    const data = workoutSchema.partial().parse(req.body) as Partial<IWorkout>;
    const updated = await WorkoutService.updateWorkout(id, data);
    if (!updated) return res.status(404).json({ success: false, message: "Workout not found" });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteWorkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = z.string().parse(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid Workout ID" });
    const deleted = await WorkoutService.deleteWorkout(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Workout not found" });
    res.status(200).json({ success: true, data: deleted });
  } catch (err) {
    next(err);
  }
};


