import { Router } from "express";
import {
    getAllMembershipsHandler,
    getMembershipByIdHandler,
    getUserMembershipsHandler,
    getActiveMembershipsHandler,
    getExpiringMembershipsHandler,
    getUserActiveMembershipHandler,
    createMembershipHandler,
    updateMembershipHandler,
    cancelMembershipHandler,
    pauseMembershipHandler,
    resumeMembershipHandler,
    extendMembershipHandler,
    deleteMembershipHandler
} from "../controllers/membership.controller.js";

const router = Router();

// GET routes (no auth for now)
router.get("/", getAllMembershipsHandler);
router.get("/active", getActiveMembershipsHandler);
router.get("/expiring", getExpiringMembershipsHandler);
router.get("/:id", getMembershipByIdHandler);
router.get("/user/:userId", getUserMembershipsHandler);
router.get("/user/:userId/active", getUserActiveMembershipHandler);

// POST routes (no auth for now)
router.post("/", createMembershipHandler);

// PUT routes
router.put("/:id", updateMembershipHandler);
router.put("/:id/cancel", cancelMembershipHandler);
router.put("/:id/pause", pauseMembershipHandler);
router.put("/:id/resume", resumeMembershipHandler);
router.put("/:id/extend", extendMembershipHandler);

// DELETE routes
router.delete("/:id", deleteMembershipHandler);

export default router;