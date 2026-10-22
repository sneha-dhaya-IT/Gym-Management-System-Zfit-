import {type Request, type Response, type NextFunction } from "express";
import { z } from "zod"

import { CREATED, OK, UNAUTHORIZED, NOT_FOUND } from "../constants/http.js";
import { createAccount, loginUser, logoutUser, refreshAccessToken, resetPassword, sendPasswordResetEmail, verifyEmail, sendEmailVerification } from "../services/auth.service.js";
import { clearAuthcookies, getAccessTokenCookieOptions, getRefreshCookieOptions, setAuthCookies } from "../util/cookies.js"
import AppAssert from "../util/AppAssert.js";
import VerificationCodeModel from "../models/verficationCode.model.js";
import VerificationCodeType from "../constants/verificationCodeType.js";

export const emailSchema = z.email().min(1).max(255);

export const passwordSchema = z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" });
 
export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    userAgent: z.string().optional(),
});

export const registerSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
    contactNo: z.string()
        .min(1, { message: "Phone number is required" })
        .regex(/^(?:\+94|0)[1-9]\d{8}$/, { message: "Enter a valid Sri Lankan Phone number" }),
    dob: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid date" }),
    profile: z.object({
        address: z.string().optional(),
        emergencyContact: z.string().optional()
    }).optional(),
    consent: z.object({
        gdpr: z.boolean(),
        marketing: z.boolean(),
    }),
    role: z.string(),
    userAgent: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"]});

export const verificationCodeSchema = z.string().min(1).max(24);

export const resetPasswordSchema = z.object({
    password: passwordSchema,
    verificationCode: verificationCodeSchema,
});


export const registerHandler = async (req: Request , res: Response, next: NextFunction) => {
    try {
        const request = registerSchema.parse({
            ...req.body,
            userAgent: req.headers["user-agent"],
        });

        const { user, accessToken, refreshToken } = await createAccount(request);
        return setAuthCookies({ res, accessToken, refreshToken })
        .status(CREATED)
        .json(user);
    } catch (error) {
        next(error);
    }
};


export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = loginSchema.parse({
            ...req.body,
            userAgen: req.headers["user-agent"],
        });

        const { user, accessToken, refreshToken } = await loginUser(request);

        return setAuthCookies({ res, accessToken, refreshToken })
            .status(OK)
            .json({ message: "login was successful ", user: user});

    } catch (error) {
        next(error);
    }
};

export const logoutHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.cookies.accessToken as string | undefined;

        await logoutUser(accessToken);

        return clearAuthcookies(res).status(OK).json({ message: "Logout successful" });
    } catch (error) {
        next(error)
    }
}

export const verifyEmailHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const verificationCode = verificationCodeSchema.parse(req.params.code);

        await verifyEmail(verificationCode);

        return res.status(OK).json( {message: "Email was successfully verified"});
    } catch (error) {
        next(error);
    }
};

export const refreshTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.cookies.refreshToken as string | undefined;

        AppAssert(refreshToken, UNAUTHORIZED, "Missing refresh token");

        const { accessToken, newRefreshToken } = await refreshAccessToken(refreshToken);

        if (newRefreshToken){
            res.cookie("refreshToken", newRefreshToken, getRefreshCookieOptions());
        }

        return res
            .status(OK)
            .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
            .json({ message: "Acess token refreshed" });


    } catch (error) {
        next(error);
    }
};

export const sendPasswordResetHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = emailSchema.parse(req.body.email);

        await sendPasswordResetEmail(email, next);

        return res.status(OK).json({ message: "Password reset email sent" });
    } catch (error) {
        next(error);
    }
};

export const sendEmailVerificationHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = emailSchema.parse(req.body.email);

        await sendEmailVerification(email, next);

        return res.status(OK).json({ message: "Email verification sent" });
    } catch (error) {
        next(error);
    }
};


export const validateResetCodeHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { code } = req.params;

        const validVerificationCode = await VerificationCodeModel.findOne({
            _id: code,
            type: VerificationCodeType.PasswordReset,
            expiresAt: { $gt: new Date() },
        });

        if (validVerificationCode) {
            return res.status(OK).json({ valid: true, message: "Reset code is valid" });
        } else {
            return res.status(NOT_FOUND).json({ valid: false, error: "Invalid or expired verification code" });
        }
    } catch (error) {
        next(error);
    }
};

export const resetPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = resetPasswordSchema.parse(req.body);

        await resetPassword(request);

        return clearAuthcookies(res).status(OK).json({ message: "Password reset was successful" });
    } catch (error) {
        next(error);
    }
};


