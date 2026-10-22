import type{ Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as FacilityService from "../services/facility.service.js";
import mongoose from "mongoose";
import type { IFacility } from "../models/facility.model.js";

// Zod schema
const facilitySchema = z.object({
  name: z.string().min(1),
  capacity: z.number().min(1),
  status: z.enum(["active", "inactive"]).optional(),
  equipments: z.array(z.string()).optional(),
});

type FacilityInput = z.infer<typeof facilitySchema>;

// ---------------- CRUD ----------------

// Create
export const createFacility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = facilitySchema.parse(req.body) as IFacility;
    const facility = await FacilityService.createFacility(data);
    res.status(201).json({ success: true, data: facility });
  } catch (err) {
    next(err);
  }
};

// Get all
export const getAllFacilities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const facilities = await FacilityService.getAllFacilities();
    res.status(200).json({ success: true, data: facilities });
  } catch (err) {
    next(err);
  }
};

// Get by ID
export const getFacilityById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // 1️⃣ Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Facility ID" });
    }

    // 2️⃣ Call service
    const facility = await FacilityService.getFacilityById(id);

    // 3️⃣ Check not found
    if (!facility) {
      return res.status(404).json({ success: false, message: "Facility not found" });
    }

    res.status(200).json({ success: true, data: facility });
  } catch (err) {
    next(err);
  }
};

// Update
export const updateFacility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Facility ID" });
    }

    // Validate input
    const data = facilitySchema.parse(req.body) as IFacility;       

    const updatedFacility = await FacilityService.updateFacility(id, data);

    if (!updatedFacility) {
      return res.status(404).json({ success: false, message: "Facility not found" });
    }

    res.status(200).json({ success: true, data: updatedFacility });
  } catch (err) {
    next(err);
  }
};

// Delete
export const deleteFacility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Facility ID" });
    }

    const deletedFacility = await FacilityService.deleteFacility(id);

    if (!deletedFacility) {
      return res.status(404).json({ success: false, message: "Facility not found" });
    }

    res.status(200).json({ success: true, data: deletedFacility });
  } catch (err) {
    next(err);
  }
};