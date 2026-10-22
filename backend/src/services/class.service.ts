import ClassModel, { type ClassDocument, type IClass } from "../models/class.model.js";
import mongoose from "mongoose";

// CREATE
export const createClass = async (data: IClass): Promise<ClassDocument> => {
  return ClassModel.create(data);
};

// GET ALL
export const getAllClasses = async (): Promise<ClassDocument[]> => {
  return ClassModel.find();
};

// GET BY ID
export const getClassById = async (id: string): Promise<ClassDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Class ID");
  return ClassModel.findById(id);
};

// UPDATE
export const updateClass = async (id: string, data: Partial<IClass>): Promise<ClassDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Class ID");
  return ClassModel.findByIdAndUpdate(id, data, { new: true });
};

// DELETE
export const deleteClass = async (id: string): Promise<ClassDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid Class ID");
  return ClassModel.findByIdAndDelete(id);
};
