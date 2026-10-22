import mongoose from "mongoose";
import VerificationCodeType from "../constants/verificationCodeType.js";

export interface VerficationCodeDocument extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    type: VerificationCodeType;
    createdAt: Date;
    expiresAt: Date;
}

const verificationCodeSchema = new mongoose.Schema<VerficationCodeDocument> ({
    userId: {
        ref: "User",
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    type: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now(),
    },
    expiresAt: {
        type: Date,
        required: true,
    }
})

const VerificationCodeModel = mongoose.model<VerficationCodeDocument> (
    "VerficationCode",
    verificationCodeSchema,
    "verificatin_codes"
);

export default VerificationCodeModel;
