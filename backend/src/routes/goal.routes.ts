import { Router } from "express";
import * as GoalController from "../controllers/goal.controller.js";

const router = Router();

router.post("/", GoalController.createGoal);
router.get("/", GoalController.getAllGoals);
router.get("/:id", GoalController.getGoalById);
router.put("/:id", GoalController.updateGoal);
router.delete("/:id", GoalController.deleteGoal);

export default router;





