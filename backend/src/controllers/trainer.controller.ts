import type { Request, Response, NextFunction } from "express";
import * as TrainerService from "../services/trainer.service.js";
import { z } from "zod";
import mongoose from "mongoose";
import type { ITrainer } from "../models/trainer.model.js";

// Zod schema for validation
const trainerSchema = z.object({
  name: z.string().min(1),
  specialization: z.string().min(1),
   experience: z.number().min(0, "Experience must be a positive number").optional(), 
  status: z.enum(["active", "inactive"]).optional(),
});

// CREATE TRAINER
export const createTrainer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = trainerSchema.parse(req.body) as ITrainer; 
    const trainer = await TrainerService.createTrainer(data);
    res.status(201).json({ success: true, data: trainer });
  } catch (err: any) {
    next(err);
  }
};

// GET ALL TRAINERS
export const getAllTrainers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const trainers = await TrainerService.getAllTrainers();
    res.status(200).json({ success: true, data: trainers });
  } catch (err: any) {
    next(err);
  }
};

// GET TRAINER BY ID
export const getTrainerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Trainer ID" });
    }

    const trainer = await TrainerService.getTrainerById(id);
    if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found" });

    res.status(200).json({ success: true, data: trainer });
  } catch (err: any) {
    next(err);
  }
};

// UPDATE TRAINER
export const updateTrainer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Trainer ID" });
    }

    const data = trainerSchema.partial().parse(req.body) as Partial<ITrainer>;
    const trainer = await TrainerService.updateTrainer(id, data);
    if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found" });

    res.status(200).json({ success: true, data: trainer });
  } catch (err: any) {
    next(err);
  }
};

// DELETE TRAINER
export const deleteTrainer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Trainer ID" });
    }

    const trainer = await TrainerService.deleteTrainer(id);
    if (!trainer) return res.status(404).json({ success: false, message: "Trainer not found" });

    res.status(200).json({ success: true, data: trainer });
  } catch (err: any) {
    next(err);
  }
};
