import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as attendanceService from "../services/attendance.service.js";
import { generateQR } from "../util/qrCode.util.js";
import { CREATED, OK } from "../constants/http.js";

// Zod Validation Schemas
const checkInSchema = z.object({
  qrToken: z.string().min(1, "QR token is required"),
  location: z.string().optional(),
  notes: z.string().optional()
});

const forceCheckInSchema = z.object({
  memberQrToken: z.string().min(1, "Member QR token is required"),
  staffQrToken: z.string().min(1, "Staff QR token is required"),
  location: z.string().optional(),
  notes: z.string().optional()
});

const checkOutSchema = z.object({
  notes: z.string().optional()
});

const manualEntrySchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  userRole: z.enum(["manager", "staff", "member"]),
  checkInTime: z.string().datetime(),
  checkOutTime: z.string().datetime().optional(),
  location: z.string().optional(),
  notes: z.string().optional()
});

const getUserAttendanceSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

const getTodayAttendanceSchema = z.object({
  userRole: z.enum(["manager", "staff", "member"]).optional()
});

const getStatsSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  userRole: z.enum(["manager", "staff", "member"]).optional()
});

const getAllAttendanceSchema = z.object({
  page: z.string().transform(val => parseInt(val)).optional(),
  limit: z.string().transform(val => parseInt(val)).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userRole: z.enum(["manager", "staff", "member"]).optional(),
  status: z.enum(["checked-in", "checked-out", "auto-checkout"]).optional()
});

/**
 * Generate QR code for user check-in
 */
export const generateCheckInQR = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, userRole } = req.body;
    
    // Generate QR token
    const qrToken = generateQR(userId, userRole);
    
    res.status(OK).json({
      success: true,
      data: { qrToken },
      message: "QR code generated successfully"
    });
  } catch (error) {
    next(error);
  }
};


export const checkIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = checkInSchema.parse(req.body);
    
    const result = await attendanceService.checkIn({
      qrToken: validatedData.qrToken,
      ...(validatedData.location && { location: validatedData.location }),
      ...(validatedData.notes && { notes: validatedData.notes })
    });
    
    const action = result.action || 'checked-in';
    const message = action === 'checked-out' 
      ? "Checked out successfully" 
      : "Checked in successfully";
    
    res.status(action === 'checked-out' ? OK : CREATED).json({
      success: true,
      data: result,
      message,
      action
    });
  } catch (error) {
    next(error);
  }
};

export const forceCheckIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = forceCheckInSchema.parse(req.body);
    
    const result = await attendanceService.forceCheckIn({
      memberQrToken: validatedData.memberQrToken,
      staffQrToken: validatedData.staffQrToken,
      ...(validatedData.location && { location: validatedData.location }),
      ...(validatedData.notes && { notes: validatedData.notes })
    });
    
    const action = result.action || 'checked-in';
    const message = action === 'checked-out' 
      ? "Member force checked out successfully" 
      : "Member force checked in successfully";
    
    res.status(action === 'checked-out' ? OK : CREATED).json({
      success: true,
      data: result,
      message,
      action
    });
  } catch (error) {
    next(error);
  }
};


export const checkOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }
    
    const validatedData = checkOutSchema.parse(req.body);
    
    const attendance = await attendanceService.checkOut({
      userId,
      ...(validatedData.notes && { notes: validatedData.notes })
    });
    
    res.status(OK).json({
      success: true,
      data: attendance,
      message: "Checked out successfully"
    });
  } catch (error) {
    next(error);
  }
};


export const createManualEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = manualEntrySchema.parse(req.body);
    
    const attendance = await attendanceService.createManualEntry({
      userId: validatedData.userId,
      userRole: validatedData.userRole,
      checkInTime: new Date(validatedData.checkInTime),
      ...(validatedData.checkOutTime && { checkOutTime: new Date(validatedData.checkOutTime) }),
      ...(validatedData.location && { location: validatedData.location }),
      ...(validatedData.notes && { notes: validatedData.notes }),
      enteredBy: "staff-user-id" // TODO: Get from auth middleware
    });
    
    res.status(CREATED).json({
      success: true,
      data: attendance,
      message: "Manual attendance entry created successfully"
    });
  } catch (error) {
    next(error);
  }
};


export const getUserAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, startDate, endDate } = getUserAttendanceSchema.parse(req.query);
    
    const attendance = await attendanceService.getUserAttendance(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    
    res.status(OK).json({
      success: true,
      data: attendance,
      message: "User attendance retrieved successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const getTodayAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userRole } = getTodayAttendanceSchema.parse(req.query);
    
    const attendance = await attendanceService.getTodayAttendance(userRole);
    
    res.status(OK).json({
      success: true,
      data: attendance,
      message: "Today's attendance retrieved successfully"
    });
  } catch (error) {
    next(error);
  }
};


export const getCurrentlyCheckedIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userRole } = getTodayAttendanceSchema.parse(req.query);
    
    const users = await attendanceService.getCurrentlyCheckedIn(userRole);
    
    res.status(OK).json({
      success: true,
      data: users,
      message: "Currently checked in users retrieved successfully"
    });
  } catch (error) {
    next(error);
  }
};


export const getAttendanceStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, userRole } = getStatsSchema.parse(req.query);
    
    const stats = await attendanceService.getAttendanceStats(
      new Date(startDate),
      new Date(endDate),
      userRole
    );
    
    res.status(OK).json({
      success: true,
      data: stats,
      message: "Attendance statistics retrieved successfully"
    });
  } catch (error) {
    next(error);
  }
};


export const checkUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }
    
    const isCheckedIn = await attendanceService.isUserCheckedIn(userId);
    
    res.status(OK).json({
      success: true,
      data: { 
        userId,
        isCheckedIn: !!isCheckedIn,
        attendance: isCheckedIn
      },
      message: "User status retrieved successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = getAllAttendanceSchema.parse(req.query);
    
    const result = await attendanceService.getAllAttendance({
      page: validatedData.page || 1,
      limit: validatedData.limit || 20,
      ...(validatedData.startDate && { startDate: new Date(validatedData.startDate) }),
      ...(validatedData.endDate && { endDate: new Date(validatedData.endDate) }),
      ...(validatedData.userRole && { userRole: validatedData.userRole }),
      ...(validatedData.status && { status: validatedData.status })
    });
    
    res.status(OK).json({
      success: true,
      data: result.records,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      },
      message: "Attendance records retrieved successfully"
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete attendance record
 */
export const deleteAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, message: "Attendance ID is required" });
    }

    const result = await attendanceService.deleteAttendance(id);

    res.status(OK).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};