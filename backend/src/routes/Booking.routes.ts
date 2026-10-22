import { Router } from "express";
import * as BookingController from "../controllers/Booking.controller.js";


import classRoutes from "./class.routes.js";      
import facilityRoutes from "./facility.routes.js"; 
import trainerRoutes from "./trainer.routes.js";   

const router = Router();

// Nested routes must come before /:id routes to avoid conflicts
router.use("/classes", classRoutes);
router.use("/facilities", facilityRoutes);
router.use("/trainers", trainerRoutes);

// Booking routes
router.post("/", BookingController.createBooking);
router.get("/", BookingController.getAllBookings);
router.get("/:id", BookingController.getBookingById);
router.patch("/:id", BookingController.updateBooking);
router.delete("/:id", BookingController.deleteBooking);

router.put("/:id/cancel", BookingController.cancelBooking);
router.put("/:id/reschedule", BookingController.rescheduleBooking);

export default router;
