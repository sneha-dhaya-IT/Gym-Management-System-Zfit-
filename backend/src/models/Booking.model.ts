import mongoose, { Schema } from "mongoose";

export interface IBooking {
  _id?: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  trainerId: mongoose.Types.ObjectId;
  facilityId: mongoose.Types.ObjectId;
  classType: string;               // required field for class type
  scheduledDate: Date;
  cancellationDeadline?: Date;
  rescheduledDate?: Date;
  fee?: number;
  status?: "pending" | "confirmed" | "cancelled" | "completed" | "rescheduled";
  createdAt?: Date;
  updatedAt?: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    trainerId: { type: Schema.Types.ObjectId, ref: "Trainer", required: true },
    facilityId: { type: Schema.Types.ObjectId, ref: "Facility", required: true },
    classType: { type: String, required: true, trim: true }, // class type
    scheduledDate: { type: Date, required: true },
    cancellationDeadline: { type: Date, required: true },
    rescheduledDate: { type: Date },
    fee: { type: Number, min: 0 },
    status: { 
      type: String, 
      enum: ["pending", "confirmed", "cancelled", "completed", "rescheduled"], 
      default: "confirmed",
      index: true
    }
  },
  { timestamps: true }
);

// Optional indexes for filtering
BookingSchema.index({ memberId: 1, scheduledDate: 1 });
BookingSchema.index({ classId: 1, trainerId: 1 });

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);
