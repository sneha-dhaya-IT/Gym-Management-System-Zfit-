import { Router } from "express";
import {
    loginHandler,
    logoutHandler,
    refreshTokenHandler,
    registerHandler,
    resetPasswordHandler,
    sendPasswordResetHandler,
    sendEmailVerificationHandler,
    verifyEmailHandler,
    validateResetCodeHandler,
} from "../controllers/auth.controller.js";
import authenticate from "../middleware/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.get("/refresh", refreshTokenHandler);
authRouter.get("/logout", logoutHandler);
authRouter.get("/email/verify/:code", verifyEmailHandler);
authRouter.post("/email/verification", sendEmailVerificationHandler);
authRouter.get("/password/validate/:code", validateResetCodeHandler);
authRouter.post("/password/forgot", sendPasswordResetHandler);
authRouter.post("/password/reset", resetPasswordHandler);

export default authRouter;