import type { Request, Response, NextFunction, RequestHandler } from "express";
import AppAssert from "../util/AppAssert.js";
import { FORBIDDEN, UNAUTHORIZED } from "../constants/http.js";
import { verifyToken } from "../util/jwt.js";
import AppErrorCode from "../constants/appErrorCode.js";

export interface AuthenticationRequest extends Request {
    userId: string;
    sessionId: string;
};

type AccessTokenPayload = {
    userId: string;
    sessionId: string;
    role: string;
};

const authenticate = (allowedRoles?: string[]): RequestHandler => (req: Request , res: Response, next: NextFunction) => {

    try {
        const accessToken = req.cookies.accessToken as string | undefined;

        AppAssert(accessToken, UNAUTHORIZED, "Unauthorized");

        const { error, payload } = verifyToken<AccessTokenPayload>(accessToken);

        AppAssert(payload, UNAUTHORIZED, error === "jwt expired" ? "Token expired" : "Invalid token", AppErrorCode.InvalidAccessToken);

        if (allowedRoles) {
            AppAssert(allowedRoles.includes(payload.role), FORBIDDEN, "Insufficient permissions");
        }

        const authReq = req as AuthenticationRequest;

    authReq.userId = payload.userId;
    authReq.sessionId = payload.sessionId;
    next();
    } catch (error) {
        next(error);
    }

};

export default authenticate;