import mongoose, { Document, Schema } from "mongoose";

export interface IGoal {
  memberId: mongoose.Types.ObjectId;
  goalType: string;
  target: string;
  deadline?: Date;
  assignedBy?: mongoose.Types.ObjectId; // staff/trainer id
}

export interface GoalDocument extends IGoal, Document {
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<GoalDocument>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    goalType: { type: String, required: true, trim: true },
    target: { type: String, required: true, trim: true },
    deadline: { type: Date },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } }
);

goalSchema.index({ memberId: 1, deadline: 1 });

export default mongoose.model<GoalDocument>("Goal", goalSchema);


