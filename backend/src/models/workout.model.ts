import mongoose, { Document, Schema } from "mongoose";

export interface IWorkout {
  memberId: mongoose.Types.ObjectId;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  notes?: string;
  date: Date;
}

export interface WorkoutDocument extends IWorkout, Document {
  createdAt: Date;
  updatedAt: Date;
}

const workoutSchema = new Schema<WorkoutDocument>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    exercise: { type: String, required: true, trim: true },
    sets: { type: Number, required: true, min: 1 },
    reps: { type: Number, required: true, min: 1 },
    weight: { type: Number, required: true, min: 0 },
    notes: { type: String, default: "" },
    date: { type: Date, required: true }
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } }
);

// Useful compound index for member + date queries
workoutSchema.index({ memberId: 1, date: -1 });

export default mongoose.model<WorkoutDocument>("Workout", workoutSchema);


