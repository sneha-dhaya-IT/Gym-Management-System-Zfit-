import jwt, { type VerifyOptions, type SignOptions } from "jsonwebtoken";
import env from "../config/env.js";
import { type UserDocument } from "../models/user.model.js";
import { type SessionDocument } from "../models/session.model.js";

export type RefreshTokenPayload = {
    sessionId: SessionDocument["_id"];
};

export type AccessTokenPayload = {
    userId: UserDocument["_id"];
    sessionId: SessionDocument["_id"];
    role: UserDocument["role"];
};

type SignOptionsAndSecret = SignOptions & {
    secret: string;
};

const accessTokenSignOptions: SignOptionsAndSecret = {
    expiresIn: "15m",
    secret: env.JWT_SECRET,
};

export const refreshTokenSignOptions: SignOptionsAndSecret = {
    expiresIn: "30d",
    secret: env.JWT_REFRESH_SECRET,
};

export const signToken = (
    payload: AccessTokenPayload | RefreshTokenPayload,
    options?: SignOptionsAndSecret 
) => {
    const { secret, ...signOpts } = options || accessTokenSignOptions;
    return jwt.sign(payload, secret, {
        ...signOpts,
    });
};

export const verifyToken = <TPayload extends object = AccessTokenPayload>(
  token: string,
  options?: VerifyOptions & {
    secret?: string;
  }
) => {
  const { secret = env.JWT_SECRET, ...verifyOpts } = options || {};
  try {
    const payload = jwt.verify(token, secret, {
      ...verifyOpts,
    }) as TPayload;
    return {
      payload,
    };
  } catch (error: any) {
    return {
      error: error.message,
    };
  }
};