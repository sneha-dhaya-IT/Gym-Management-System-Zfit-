import { Router } from "express";
import {
    getAllUsersHandler,
    getAllMembersHandler,
    getActiveMembersHandler,
    getInactiveMembersHandler,
    getAllStaffHandler,
    getAllManagersHandler,
    getUserByIdHandler,
    getUserByEmailHandler,
    createUserHandler,
    updateUserHandler,
    deleteUserHandler,
    updateUserStatusHandler
} from "../controllers/user.controller.js";
import authenticate from "../middleware/auth.middleware.js";

const userRouter = Router();

// Apply authentication to all routes (commented out for testing)
// userRouter.use(authenticate());


userRouter.get("/", getAllUsersHandler);
userRouter.get("/members", getAllMembersHandler);
userRouter.get("/members/active", getActiveMembersHandler);
userRouter.get("/members/inactive", getInactiveMembersHandler);
userRouter.get("/staff", getAllStaffHandler);
userRouter.get("/managers", getAllManagersHandler);
userRouter.get("/email/:email", getUserByEmailHandler);
userRouter.get("/:id", getUserByIdHandler);


userRouter.post("/", createUserHandler);
userRouter.put("/:id", updateUserHandler);
userRouter.patch("/:id/status", updateUserStatusHandler);
userRouter.delete("/:id", deleteUserHandler);

export default userRouter;