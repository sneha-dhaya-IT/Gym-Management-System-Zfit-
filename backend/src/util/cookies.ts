import type { CookieOptions, Response } from "express";
import { fifteenMinutesFromNow, thirtyDaysFromNow } from "./date.util.js";
import env from "../config/env.js";

export const REFRESH_PATH = "api/v1/auth/refresh";
const secure = env.NODE_ENV !== "development";

const defaults: CookieOptions = {
    sameSite: "strict",
    httpOnly: true,
    secure,
};

export const getAccessTokenCookieOptions = (): CookieOptions => ({
    ...defaults,
    expires: fifteenMinutesFromNow(),
});

export const getRefreshCookieOptions = (): CookieOptions => ({
    ...defaults,
    expires: thirtyDaysFromNow(),
    path: REFRESH_PATH,
});

type Params = {
    res: Response;
    accessToken: string;
    refreshToken: string;
};

export const setAuthCookies = ({res, accessToken, refreshToken }: Params) => 
    res
        .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
        .cookie("refreshToken", refreshToken, getRefreshCookieOptions());

export const clearAuthcookies = (res: Response) => 
    res
        .clearCookie("accessToken")
        .clearCookie("refreshToken", { path: REFRESH_PATH });
