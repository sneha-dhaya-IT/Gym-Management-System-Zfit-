import env from "../config/env.js";
import UserModel from "../models/user.model.js";
import SessionModel from "../models/session.model.js";
import VerificationCodeModel from "../models/verficationCode.model.js";
import AppAssert from "../util/AppAssert.js";
import VerificationCodeType from "../constants/verificationCodeType.js";

import { fiveMinutesAgo, ONE_DAY_MS, oneHourFromNow, oneYearFromNow, thirtyDaysFromNow } from "../util/date.util.js";
import { sendMail } from "../util/sendMail.util.js";
import { getPasswordResetTemplate, getVerifyEmailTemplate } from "../util/emailTemplates.js";
import { refreshTokenSignOptions, signToken, verifyToken} from "../util/jwt.js";
import { hashValue } from "../util/bcrypt.util.js";
import { generateQR } from "../util/qrCode.util.js";
import { CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND, TOO_MANY_REQUESTS, UNAUTHORIZED } from "../constants/http.js";
import type { NextFunction } from "express";


type CreateAccountParams = {
    name: string;
    email: string;
    password: string;
    contactNo: string;
    profile?: {
        address?: string | undefined;
        emergencyContact?: string | undefined;
    } | undefined,
    consent: {
        gdpr: boolean;
        marketing: boolean;
    },
    role: string;
    userAgent?: string | undefined;
}

export const createAccount = async (data: CreateAccountParams) => {
    //check if the user already exists
    const existingUser = await UserModel.exists({
        email: data.email,
    });

    AppAssert(!existingUser, CONFLICT, "Email already in use");

    const user = await UserModel.create({
        name: data.name,
        email: data.email,
        password: data.password,
        contactNo: data.contactNo,
        profile: {
            address: data.profile?.address,
            emergencyContact: data.profile?.emergencyContact
        },
        consent: {
            gdpr: data.consent.gdpr,
            marketing: data.consent.marketing
        },
        role: data.role
    });

    const userId = user._id;

    // Generate and store QR code for the user
    const qrToken = generateQR(String(user._id), data.role as 'member' | 'staff' | 'manager');
    user.qrCode = qrToken;
    await user.save();

    const verificationCode = await VerificationCodeModel.create({
        userId,
        type: VerificationCodeType.EmailVerification,
        expiresAt: oneYearFromNow(),
    });

    const url = `${env.FRONTEND_APP_ORIGIN}/auth/verify-email/${verificationCode._id}`;

    //send verification email
    const { error } = await sendMail({
        to: user.email,
        ...getVerifyEmailTemplate(url),
    });

    if (error) console.error(error);

    //create session
    const session = await SessionModel.create({
        userId,
        userAgent: data.userAgent,
    });

    const refreshToken = signToken(
        {
        sessionId: session._id,
        },
        refreshTokenSignOptions
    );

    const accessToken = signToken({
        userId,
        sessionId: session._id,
        role: user.role,
    });

    return {
        user: user.omitPassword(),
        accessToken,
        refreshToken,
    };
}

type LoginParams = {
    email: string;
    password: string;
    userAgent?: string | undefined;
};

export const loginUser = async ({ email, password, userAgent }: LoginParams) => {

    const user = await UserModel.findOne({ email });
    AppAssert(user, UNAUTHORIZED , "Invalid email or password");

    const isValid = await user.comparePassword(password);
    AppAssert(isValid, UNAUTHORIZED, "Invalid email or password");

    const userId = user._id;
    
    const session = await SessionModel.create({
        userId,
        userAgent,
    });

   
    const refreshToken = signToken({ sessionId: session._id }, refreshTokenSignOptions );
    const accessToken = signToken({
        userId,
        sessionId: session._id,
        role: user.role,
    });

    return { 
        user: user.omitPassword(),
        accessToken,
        refreshToken
    };

};

export const logoutUser = async (accessToken: string | undefined) => {
    const { payload } = verifyToken(accessToken || "" );

    if (payload) {
        await SessionModel.findByIdAndDelete(payload.sessionId);
    }
};

export const verifyEmail = async (code: string) => {
    
    const validCode = await VerificationCodeModel.findOne({
        _id: code,
        type: VerificationCodeType.EmailVerification,
        expiresAt: { $gt: new Date() },
    });

    AppAssert(validCode, NOT_FOUND, "Invalid or expired verificaiton code");

    const updatedUser = await UserModel.findByIdAndUpdate(validCode.userId, { verified: true }, { new: true });

    AppAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to verify email");

    await validCode.deleteOne();

    return {
        user: updatedUser.omitPassword()
    }
    
};

export const refreshAccessToken = async (refreshToken: string) => {
    
    const { payload } = verifyToken(refreshToken, {
        secret: refreshTokenSignOptions.secret,
    });

    const session = await SessionModel.findById(payload?.sessionId);
    const today = Date.now();

    AppAssert(session && session.expiresAt.getTime() > today, UNAUTHORIZED, "Session Expired");

    //refresh the token if it expires in the next 24 hours
    const sessionNeedsRefresh = session.expiresAt.getTime() - today <= ONE_DAY_MS;
    
    if(sessionNeedsRefresh) {
        session.expiresAt = thirtyDaysFromNow();
        await session.save();
    }

    const newRefreshToken = sessionNeedsRefresh ? signToken({ sessionId: session._id, }, refreshTokenSignOptions): undefined;

    const accessToken = signToken({ userId: session.userId, sessionId: session._id });

    return {
        accessToken,
        newRefreshToken,
    };
;
};

export const sendPasswordResetEmail = async (email: string, next: NextFunction) => {
    try {
        
        const user = await UserModel.findOne({ email });

        AppAssert(user, NOT_FOUND, "User not found");

        //password reset request limiting (2 emails per 5 mins)
        const fiveMinAgo = fiveMinutesAgo();
        const count = await VerificationCodeModel.countDocuments({
            userId: user._id,
            type: VerificationCodeType.PasswordReset,
            createdAt: { $gt: fiveMinAgo },
        });

        AppAssert(count <=1, TOO_MANY_REQUESTS, "Too many requests, please try again later");

        const expiresAt = oneHourFromNow();
        const verficationCode = await VerificationCodeModel.create({
            userId: user._id,
            type: VerificationCodeType.PasswordReset,
            expiresAt,
        });

        const url = `${env.FRONTEND_APP_ORIGIN}/auth/reset-password/reset?code=${verficationCode._id}&exp=${expiresAt.getTime()}`;

        const { data, error } = await sendMail({
            to: email,
            ...getPasswordResetTemplate(url),
        });

        AppAssert(data?.id, INTERNAL_SERVER_ERROR, `${error?.name} - ${error?.message}`);

        return { url, emailId: data.id };
    } catch (error: any) {
        next(error)
    };
};

export const sendEmailVerification = async (email: string, next: NextFunction) => {
    try {
        const user = await UserModel.findOne({ email });

        AppAssert(user, NOT_FOUND, "User not found");

        // Check if user is already verified
        AppAssert(!user.verified, CONFLICT, "Email is already verified");

        // Email verification request limiting (2 emails per 5 mins)
        const fiveMinAgo = fiveMinutesAgo();
        const count = await VerificationCodeModel.countDocuments({
            userId: user._id,
            type: VerificationCodeType.EmailVerification,
            createdAt: { $gt: fiveMinAgo },
        });

        AppAssert(count <= 1, TOO_MANY_REQUESTS, "Too many requests, please try again later");

        const expiresAt = oneYearFromNow();
        const verificationCode = await VerificationCodeModel.create({
            userId: user._id,
            type: VerificationCodeType.EmailVerification,
            expiresAt,
        });

        const url = `${env.FRONTEND_APP_ORIGIN}/auth/verify-email/${verificationCode._id}`;

        const { data, error } = await sendMail({
            to: email,
            ...getVerifyEmailTemplate(url),
        });

        AppAssert(data?.id, INTERNAL_SERVER_ERROR, `${error?.name} - ${error?.message}`);

        return { url, emailId: data.id };
    } catch (error: any) {
        next(error);
    }
};


type ResetPasswordParams = {
    password: string;
    verificationCode: string;
};

export const resetPassword = async ({ verificationCode, password }: ResetPasswordParams) => {
    const validVerificationCode = await VerificationCodeModel.findOne({
        _id: verificationCode,
        type: VerificationCodeType.PasswordReset,
        expiresAt: { $gt: new Date() },
    });

    AppAssert(validVerificationCode, NOT_FOUND, "Invalid or expired verification code");

    const updatedUser = await UserModel.findByIdAndUpdate(validVerificationCode.userId, {
        password: await hashValue(password),
    });

    AppAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to reset password");

    await validVerificationCode.deleteOne();

    //delete all the sessions
    await SessionModel.deleteMany({ userId: validVerificationCode.userId });

    return { user: updatedUser.omitPassword() };
};