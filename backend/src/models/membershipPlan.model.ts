import mongoose from "mongoose";

export interface MembershipPlanDocument extends mongoose.Document {
  name: string;            
  description?: string;    
  price: number;           
  currency: string;        
  durationInDays: number;  
  category: string;        
  createdAt: Date;
  updatedAt: Date;
}

const membershipPlanSchema = new mongoose.Schema<MembershipPlanDocument>(
  {
    name: {
      type: String,
      required: [true, "Membership plan name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
      unique: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be greater than 0"],
    },
    currency: {
      type: String,
      enum: ["LKR", "USD"],
      default: "LKR",
    },
    durationInDays: {
      type: Number,
      required: [true, "Duration in days is required"],
      min: [1, "Duration must be at least 1 day"],
    },
    category: {
      type: String,
      enum: ["weights", "crossfit", "yoga", "mma", "other"],
      required: [true, "Category is required"],
      default: "weights",
    },
  },
  {
    timestamps: true,
  }
);

// Only keep compound indexes, name index is already created by unique: true
membershipPlanSchema.index({ category: 1, price: 1 });

const MembershipPlanModel = mongoose.model<MembershipPlanDocument>(
  "MembershipPlan",
  membershipPlanSchema
);

export default MembershipPlanModel;