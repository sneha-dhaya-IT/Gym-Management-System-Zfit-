import  { Facility, type IFacility } from "../models/facility.model.js";

// Create
export const createFacility = async (data: IFacility) => {
  return await Facility.create(data);
};

// Get all
export const getAllFacilities = async () => {
  return await Facility.find();
};

// Get by ID
export const getFacilityById = async (id: string) => {
  return await Facility.findById(id);
};

// Update
export const updateFacility = async (id: string, data: Partial<IFacility>) => {
  return await Facility.findByIdAndUpdate(id, data, { new: true });
};

// Delete
export const deleteFacility = async (id: string) => {
  return await Facility.findByIdAndDelete(id);
};
