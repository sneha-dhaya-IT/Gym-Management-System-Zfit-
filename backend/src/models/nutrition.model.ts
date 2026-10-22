import mongoose, { Document, Schema } from "mongoose";

export interface INutrition {
  memberId: mongoose.Types.ObjectId;
  mealType: string; // breakfast, lunch, dinner, snack
  calories: number;
  macros?: {
    protein?: number;
    carbs?: number;
    fats?: number;
  };
  notes?: string;
  date: Date;
}

export interface NutritionDocument extends INutrition, Document {
  createdAt: Date;
  updatedAt: Date;
}

const nutritionSchema = new Schema<NutritionDocument>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mealType: { type: String, required: true, trim: true },
    calories: { type: Number, required: true, min: 0 },
    macros: {
      protein: { type: Number, min: 0, default: 0 },
      carbs: { type: Number, min: 0, default: 0 },
      fats: { type: Number, min: 0, default: 0 }
    },
    notes: { type: String, default: "" },
    date: { type: Date, required: true }
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } }
);

nutritionSchema.index({ memberId: 1, date: -1 });

export default mongoose.model<NutritionDocument>("Nutrition", nutritionSchema);


