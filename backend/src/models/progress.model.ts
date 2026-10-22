import mongoose, { Document, Schema } from "mongoose";

export interface IProgress {
  memberId: mongoose.Types.ObjectId;
  workoutsCompleted: number;
  attendance: number; // percentage or count; keeping as number for simplicity
  goalsAchieved: number;
  date: Date;
}

export interface ProgressDocument extends IProgress, Document {
  createdAt: Date;
  updatedAt: Date;
}

const progressSchema = new Schema<ProgressDocument>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    workoutsCompleted: { type: Number, required: true, min: 0 },
    attendance: { type: Number, required: true, min: 0 },
    goalsAchieved: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true }
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } }
);

progressSchema.index({ memberId: 1, date: -1 });

export default mongoose.model<ProgressDocument>("Progress", progressSchema);


