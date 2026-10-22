import { Booking, type IBooking } from "../models/Booking.model.js";
import mongoose from "mongoose";

// Create Booking
export const createBooking = async (data: IBooking) => {
  // Ensure fee has a default value
  if (data.fee === undefined) data.fee = 0;

  // Calculate cancellation deadline (1 day before scheduled date)
  data.cancellationDeadline = new Date(data.scheduledDate);
  data.cancellationDeadline.setDate(data.scheduledDate.getDate() - 1);

  return await Booking.create(data);
};

// Get all bookings
export const getAllBookings = async () => {
  return await Booking.find()
    .populate("memberId")
    .populate("classId")
    .populate("trainerId")
    .populate("facilityId");
};

// Get booking by ID
export const getBookingById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  return await Booking.findById(id)
    .populate("memberId")
    .populate("classId")
    .populate("trainerId")
    .populate("facilityId");
};

// Update Booking
export const updateBooking = async (id: string, data: Partial<IBooking>) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  // Recalculate cancellationDeadline if scheduledDate changes
  if (data.scheduledDate) {
    const cd = new Date(data.scheduledDate);
    cd.setDate(cd.getDate() - 1);
    data.cancellationDeadline = cd;
  }

  // Ensure fee has a default value only if not provided
  if (data.fee === undefined) data.fee = 0;

  return await Booking.findByIdAndUpdate(id, data, { new: true })
    .populate("memberId")
    .populate("classId")
    .populate("trainerId")
    .populate("facilityId");
};

// Delete Booking
export const deleteBooking = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return await Booking.findByIdAndDelete(id);
};
