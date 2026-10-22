import mongoose, { Document } from "mongoose";

export interface ICategory extends Document {
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const categorySchema = new mongoose.Schema<ICategory>({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
        maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Add index for better performance
categorySchema.index({ isActive: 1 });

const Category = mongoose.model<ICategory>("Category", categorySchema);

export default Category;
