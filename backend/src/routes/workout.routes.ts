import { Router } from "express";
import * as WorkoutController from "../controllers/workout.controller.js";

const router = Router();

router.post("/", WorkoutController.createWorkout);
router.get("/", WorkoutController.getAllWorkouts);
router.get("/:id", WorkoutController.getWorkoutById);
router.put("/:id", WorkoutController.updateWorkout);
router.delete("/:id", WorkoutController.deleteWorkout);

export default router;





