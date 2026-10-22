import { Router } from "express";
import * as ClassController from "../controllers/class.controller.js";

const router = Router();

router.post("/", ClassController.createClass);
router.get("/", ClassController.getAllClasses);
router.get("/:id", ClassController.getClassById);
router.put("/:id", ClassController.updateClass);
router.delete("/:id", ClassController.deleteClass);

export default router;
