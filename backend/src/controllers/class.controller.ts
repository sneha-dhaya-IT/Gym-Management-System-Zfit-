import type { Request, Response, NextFunction } from "express";
import * as ClassService from "../services/class.service.js";
import { z } from "zod";
import mongoose from "mongoose";
import type { IClass } from "../models/class.model.js";

// Zod schema for validation
const classSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["yoga","pilates","zumba","spinning","crossfit","strength","cardio","other"]),
  duration: z.number().min(40).max(180),
  maxCapacity: z.number().min(1).max(30),
  price: z.number().min(0),
  status: z.enum(["active","inactive"]).optional()
});


// CREATE CLASS
export const createClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = classSchema.parse(req.body) as IClass;
    const newClass = await ClassService.createClass(data);
    res.status(201).json({ success: true, data: newClass });
  } catch (err: any) {
    next(err);
  }
};

// GET ALL CLASSES
export const getAllClasses = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const classes = await ClassService.getAllClasses();
    res.status(200).json({ success: true, data: classes });
  } catch (err: any) {
    next(err);
  }
};

// GET CLASS BY ID
export const getClassById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Class ID" });
    }

    const classObj = await ClassService.getClassById(id);
    if (!classObj) return res.status(404).json({ success: false, message: "Class not found" });

    res.status(200).json({ success: true, data: classObj });
  } catch (err: any) {
    next(err);
  }
};

// UPDATE CLASS
export const updateClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Class ID" });
    }

    const data = classSchema.partial().parse(req.body) as Partial<IClass>;
    const updatedClass = await ClassService.updateClass(id, data);
    if (!updatedClass) return res.status(404).json({ success: false, message: "Class not found" });

    res.status(200).json({ success: true, data: updatedClass });
  } catch (err: any) {
    next(err);
  }
};

// DELETE CLASS
export const deleteClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Class ID" });
    }

    const deletedClass = await ClassService.deleteClass(id);
    if (!deletedClass) return res.status(404).json({ success: false, message: "Class not found" });

    res.status(200).json({ success: true, data: deletedClass });
  } catch (err: any) {
    next(err);
  }
};
