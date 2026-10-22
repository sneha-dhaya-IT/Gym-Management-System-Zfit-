import UserModel from "../models/user.model.js";
import AppAssert from "../util/AppAssert.js";
import { NOT_FOUND, CONFLICT } from "../constants/http.js";
import { hashValue } from "../util/bcrypt.util.js";
import { generateQR } from "../util/qrCode.util.js";
import { sendMail } from "../util/sendMail.util.js";
import { getWelcomeEmailTemplate } from "../util/emailTemplates.js";
import VerificationCodeModel from "../models/verficationCode.model.js";
import VerificationCodeType from "../constants/verificationCodeType.js";
import env from "../config/env.js";
import { oneHourFromNow } from "../util/date.util.js";



type CreateUserParams = {
    name: string;
    email: string;
    password: string;
    contactNo: string;
    dob?: string | undefined;
    profile?: {
        address?: string | undefined;
        emergencyContact?: string | undefined;
    } | undefined;
    consent: {
        gdpr: boolean;
        marketing: boolean;
    };
    role: 'member' | 'staff' | 'manager';
    status?: 'active' | 'inactive' | 'expired' | undefined;
};

type UpdateUserParams = {
    name?: string | undefined;
    email?: string | undefined;
    password?: string | undefined;
    contactNo?: string | undefined;
    dob?: string | undefined;
    profile?: {
        address?: string | undefined;
        emergencyContact?: string | undefined;
    } | undefined;
    role?: 'member' | 'staff' | 'manager' | undefined;
    status?: 'active' | 'inactive' | 'expired' | undefined;
};



export const getAllUsers = async () => {
    return await UserModel.find({})
        .select('-password')
        .sort({ createdAt: -1 });
};



export const getAllMembers = async () => {
    return await UserModel.find({ role: 'member' })
        .select('-password')
        .sort({ createdAt: -1 });
};



export const getActiveMembers = async () => {
    return await UserModel.find({ 
        role: 'member',
        status: 'active'
    })
        .select('-password')
        .sort({ createdAt: -1 });
};



export const getInactiveMembers = async () => {
    return await UserModel.find({ 
        role: 'member',
        status: { $in: ['inactive', 'expired'] }
    })
        .select('-password')
        .sort({ createdAt: -1 });
};



export const getAllStaff = async () => {
    return await UserModel.find({ role: 'staff' })
        .select('-password')
        .sort({ createdAt: -1 });
};



export const getAllManagers = async () => {
    return await UserModel.find({ role: 'manager' })
        .select('-password')
        .sort({ createdAt: -1 });
};



export const getUserById = async (userId: string) => {
    const user = await UserModel.findById(userId).select('-password');
    AppAssert(user, NOT_FOUND, "User not found");
    return user;
};



export const getUserByEmail = async (email: string) => {
    const user = await UserModel.findOne({ email }).select('-password');
    AppAssert(user, NOT_FOUND, "User not found");
    return user;
};



export const createUser = async (data: CreateUserParams) => {
    
    const existingUser = await UserModel.exists({ email: data.email });
    AppAssert(!existingUser, CONFLICT, "Email already in use");

    
    const user = await UserModel.create({
        name: data.name,
        email: data.email,
        password: data.password, 
        contactNo: data.contactNo,
        dob: data.dob ? new Date(data.dob) : undefined,
        profile: data.profile || {},
        consent: data.consent,
        role: data.role,
        status: data.status || 'active',
        verified: true, 
    });

    // Generate and store QR code for the user
    const qrToken = generateQR(String(user._id), data.role as 'member' | 'staff' | 'manager');
    user.qrCode = qrToken;
    await user.save();

    // Create password reset verification code for welcome email
    const verificationCode = await VerificationCodeModel.create({
        userId: user._id,
        type: VerificationCodeType.PasswordReset,
        expiresAt: oneHourFromNow(),
    });

    // Generate password reset URL
    const resetPasswordUrl = `${env.FRONTEND_APP_ORIGIN}/auth/reset-password/reset?code=${verificationCode._id}&exp=${verificationCode.expiresAt.getTime()}`;

    // Send welcome email
    const { error } = await sendMail({
        to: user.email,
        ...getWelcomeEmailTemplate(resetPasswordUrl, user.name),
    });

    if (error) {
        console.error("Error sending welcome email:", error);
        // Don't fail the user creation if email fails
    }

    return await UserModel.findById(user._id).select('-password');
};


export const updateUser = async (userId: string, data: UpdateUserParams) => {
    const user = await UserModel.findById(userId);
    AppAssert(user, NOT_FOUND, "User not found");

    
    if (data.email && data.email !== user.email) {
        const existingUser = await UserModel.exists({ 
            email: data.email, 
            _id: { $ne: userId } 
        });
        AppAssert(!existingUser, CONFLICT, "Email already in use");
    }

    
    if (data.password) {
        data.password = await hashValue(data.password);
    }

    
    const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        {
            ...data,
            dob: data.dob ? new Date(data.dob) : user.dob,
            profile: data.profile ? { ...user.profile, ...data.profile } : user.profile
        },
        { new: true, runValidators: true }
    ).select('-password');

    AppAssert(updatedUser, NOT_FOUND, "User not found");
    return updatedUser;
};


export const deleteUser = async (userId: string) => {
    const user = await UserModel.findByIdAndDelete(userId);
    AppAssert(user, NOT_FOUND, "User not found");
    
    return { message: "User deleted successfully" };
};


export const updateUserStatus = async (userId: string, status: 'active' | 'inactive' | 'expired') => {
    const user = await UserModel.findByIdAndUpdate(
        userId,
        { status },
        { new: true, runValidators: true }
    ).select('-password');

    AppAssert(user, NOT_FOUND, "User not found");
    return user;
};