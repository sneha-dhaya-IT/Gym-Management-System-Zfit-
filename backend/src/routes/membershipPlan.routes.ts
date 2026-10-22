import { Router } from "express";
import {
    getAllMembershipPlansHandler,
    getMembershipPlanByIdHandler,
    getMembershipPlansByCategoryHandler,
    createMembershipPlanHandler,
    updateMembershipPlanHandler,
    deleteMembershipPlanHandler,
    getMembershipPlanCategoriesHandler
} from "../controllers/membershipPlan.controller.js";

const membershipPlanRouter = Router();


membershipPlanRouter.get("/", getAllMembershipPlansHandler);
membershipPlanRouter.get("/categories", getMembershipPlanCategoriesHandler);
membershipPlanRouter.get("/category/:category", getMembershipPlansByCategoryHandler);
membershipPlanRouter.get("/:id", getMembershipPlanByIdHandler);

membershipPlanRouter.post("/", createMembershipPlanHandler);


membershipPlanRouter.put("/:id", updateMembershipPlanHandler);

membershipPlanRouter.delete("/:id", deleteMembershipPlanHandler);

export default membershipPlanRouter;