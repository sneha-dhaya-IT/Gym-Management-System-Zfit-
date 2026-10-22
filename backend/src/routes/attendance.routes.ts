import { Router } from "express";
import {
    generateCheckInQR,
    checkIn,
    forceCheckIn,
    checkOut,
    createManualEntry,
    getUserAttendance,
    getTodayAttendance,
    getCurrentlyCheckedIn,
    getAttendanceStats,
    checkUserStatus,
    getAllAttendance,
    deleteAttendance
} from "../controllers/attendance.controller.js";

const router = Router();

// QR Code generation
router.post("/generate-qr", generateCheckInQR);

// Check-in/Check-out
router.post("/check-in", checkIn);
router.post("/force-check-in", forceCheckIn);
router.put("/check-out/:userId", checkOut);

// Manual entry (for staff/managers)
router.post("/manual-entry", createManualEntry);

// Get attendance data
router.get("/", getAllAttendance);
router.get("/user/:userId", getUserAttendance);
router.get("/today", getTodayAttendance);
router.get("/currently-checked-in", getCurrentlyCheckedIn);
router.get("/stats", getAttendanceStats);
router.get("/status/:userId", checkUserStatus);

// Delete attendance record
router.delete("/:id", deleteAttendance);

export default router;