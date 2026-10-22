import AttendanceModel from "../models/attendance.model.js";
import UserModel from "../models/user.model.js";
import { verifyQR } from "../util/qrCode.util.js";
import { getUserActiveMembership } from "./membership.service.js";
import AppAssert from "../util/AppAssert.js";
import { BAD_REQUEST, NOT_FOUND, FORBIDDEN } from "../constants/http.js";

export interface CheckInParams {
  qrToken: string;
  location?: string | undefined;
  notes?: string | undefined;
}

export interface ForceCheckInParams {
  memberQrToken: string;
  staffQrToken: string;
  location?: string | undefined;
  notes?: string | undefined;
}

export interface CheckOutParams {
  userId: string;
  notes?: string | undefined;
}

export interface ManualEntryParams {
  userId: string;
  userRole: 'manager' | 'staff' | 'member';
  checkInTime: Date;
  checkOutTime?: Date;
  location?: string;
  notes?: string;
  enteredBy?: string;
}

/**
 * Check if user is already checked in today
 */
export const isUserCheckedIn = async (userId: string): Promise<boolean> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existingCheckIn = await AttendanceModel.findOne({
    userId,
    date: { $gte: today },
    status: 'checked-in'
  });
  
  return !!existingCheckIn;
};

/**
 * QR Code Check-In/Check-Out with membership validation
 * Automatically handles checkout if user is already checked in
 */
export const checkIn = async (params: CheckInParams) => {
  // Verify QR token
  const payload = verifyQR(params.qrToken);
  
  // Check if user exists
  const user = await UserModel.findById(payload.userId);
  AppAssert(user, NOT_FOUND, "User not found");
  
  // Check if already checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existingAttendance = await AttendanceModel.findOne({
    userId: payload.userId,
    date: { $gte: today },
    status: 'checked-in'
  });
  
  // If already checked in, perform checkout
  if (existingAttendance) {
    existingAttendance.checkOutTime = new Date();
    existingAttendance.status = 'checked-out';
    if (params.notes) {
      existingAttendance.notes = existingAttendance.notes 
        ? `${existingAttendance.notes}. Checkout: ${params.notes}`
        : `Checkout: ${params.notes}`;
    }
    await existingAttendance.save();
    
    const result = await AttendanceModel.findById(existingAttendance._id).populate('userId', 'name email');
    return { ...result?.toObject(), action: 'checked-out' };
  }
  
  // For members, check if they have an active subscription
  if (payload.userRole === 'member') {
    const activeSubscription = await getUserActiveMembership(payload.userId);
    AppAssert(activeSubscription, FORBIDDEN, "No active membership found. Access denied.");
  }
  
  // Create new check-in record
  const attendance = await AttendanceModel.create({
    userId: payload.userId,
    userRole: payload.userRole,
    checkInTime: new Date(),
    date: new Date(),
    status: 'checked-in',
    notes: params.notes,
    isManualEntry: false
  });
  
  const result = await AttendanceModel.findById(attendance._id).populate('userId', 'name email');
  return { ...result?.toObject(), action: 'checked-in' };
};

/**
 * Force Check-In (Staff/Manager override for members without valid membership)
 * Also handles checkout if member is already checked in
 */
export const forceCheckIn = async (params: ForceCheckInParams) => {
  // Verify member QR token
  const memberPayload = verifyQR(params.memberQrToken);
  AppAssert(memberPayload.userRole === 'member', BAD_REQUEST, "Invalid member QR code");
  
  // Verify staff QR token
  const staffPayload = verifyQR(params.staffQrToken);
  AppAssert(
    staffPayload.userRole === 'staff' || staffPayload.userRole === 'manager',
    FORBIDDEN, 
    "Only staff or managers can force check-in"
  );
  
  // Check if member exists
  const member = await UserModel.findById(memberPayload.userId);
  AppAssert(member, NOT_FOUND, "Member not found");
  
  // Check if staff exists
  const staff = await UserModel.findById(staffPayload.userId);
  AppAssert(staff, NOT_FOUND, "Staff member not found");
  
  // Check if member is already checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existingAttendance = await AttendanceModel.findOne({
    userId: memberPayload.userId,
    date: { $gte: today },
    status: 'checked-in'
  });
  
  // If already checked in, perform checkout
  if (existingAttendance) {
    existingAttendance.checkOutTime = new Date();
    existingAttendance.status = 'checked-out';
    const checkoutNote = `Force checkout by ${staff.name} (${staffPayload.userRole}). ${params.notes || ''}`.trim();
    existingAttendance.notes = existingAttendance.notes 
      ? `${existingAttendance.notes}. ${checkoutNote}`
      : checkoutNote;
    await existingAttendance.save();
    
    const result = await AttendanceModel.findById(existingAttendance._id)
      .populate('userId', 'name email')
      .populate('enteredBy', 'name email');
    return { ...result?.toObject(), action: 'checked-out' };
  }
  
  // Create attendance record with force entry flag
  const attendance = await AttendanceModel.create({
    userId: memberPayload.userId,
    userRole: memberPayload.userRole,
    checkInTime: new Date(),
    date: new Date(),
    status: 'checked-in',
    notes: `Force check-in by ${staff.name} (${staffPayload.userRole}). ${params.notes || ''}`.trim(),
    isManualEntry: true,
    enteredBy: staffPayload.userId
  });
  
  const result = await AttendanceModel.findById(attendance._id)
    .populate('userId', 'name email')
    .populate('enteredBy', 'name email');
  return { ...result?.toObject(), action: 'checked-in' };
};

/**
 * User Check-Out
 */
export const checkOut = async (params: CheckOutParams) => {
  // Find active check-in for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const attendance = await AttendanceModel.findOne({
    userId: params.userId,
    date: { $gte: today },
    status: 'checked-in'
  });
  
  if (!attendance) {
    AppAssert(false, BAD_REQUEST, "No active check-in found for today");
  }
  
  // Update with check-out time
  attendance.checkOutTime = new Date();
  attendance.status = 'checked-out';
  if (params.notes) {
    attendance.notes = params.notes;
  }
  
  await attendance.save();
  
  return await AttendanceModel.findById(attendance._id).populate('userId', 'name email');
};

/**
 * Manual attendance entry (for staff/managers)
 */
export const createManualEntry = async (params: ManualEntryParams) => {
  // Verify user exists
  const user = await UserModel.findById(params.userId);
  AppAssert(user, NOT_FOUND, "User not found");
  
  // Create attendance record
  const attendance = await AttendanceModel.create({
    userId: params.userId,
    userRole: params.userRole,
    checkInTime: params.checkInTime,
    date: params.checkInTime,
    checkOutTime: params.checkOutTime,
    status: params.checkOutTime ? 'checked-out' : 'checked-in',
    notes: params.notes,
    isManualEntry: true,
    enteredBy: params.enteredBy
  });
  
  return await AttendanceModel.findById(attendance._id)
    .populate('userId', 'name email')
    .populate('enteredBy', 'name email');
};

/**
 * Get user's attendance history
 */
export const getUserAttendance = async (userId: string, startDate?: Date, endDate?: Date) => {
  const filter: Record<string, unknown> = { userId };
  
  if (startDate && endDate) {
    filter.date = { $gte: startDate, $lte: endDate };
  }
  
  return await AttendanceModel.find(filter)
    .populate('userId', 'name email')
    .populate('enteredBy', 'name email')
    .sort({ date: -1, checkInTime: -1 });
};

/**
 * Get today's attendance
 */
export const getTodayAttendance = async (userRole?: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const filter: Record<string, unknown> = {
    date: { $gte: today, $lt: tomorrow }
  };
  
  if (userRole) {
    filter.userRole = userRole;
  }
  
  return await AttendanceModel.find(filter)
    .populate('userId', 'name email')
    .sort({ checkInTime: -1 });
};

/**
 * Get currently checked in users
 */
export const getCurrentlyCheckedIn = async (userRole?: string) => {
  const filter: Record<string, unknown> = { 
    status: 'checked-in',
    checkOutTime: { $exists: false }
  };
  
  if (userRole) {
    filter.userRole = userRole;
  }
  
  return await AttendanceModel.find(filter)
    .populate('userId', 'name email')
    .sort({ checkInTime: -1 });
};

/**
 * Get attendance stats for date range
 */
export const getAttendanceStats = async (startDate: Date, endDate: Date, userRole?: string) => {
  const matchFilter: Record<string, unknown> = {
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (userRole) {
    matchFilter.userRole = userRole;
  }
  
  return await AttendanceModel.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          userRole: "$userRole"
        },
        totalAttendance: { $sum: 1 },
        uniqueUsers: { $addToSet: "$userId" },
        totalDuration: { $sum: "$duration" },
        avgDuration: { $avg: "$duration" }
      }
    },
    {
      $project: {
        _id: 0,
        date: "$_id.date",
        userRole: "$_id.userRole",
        totalAttendance: 1,
        uniqueUsersCount: { $size: "$uniqueUsers" },
        totalDuration: 1,
        avgDuration: { $round: ["$avgDuration", 2] }
      }
    },
    { $sort: { date: -1, userRole: 1 } }
  ]);
};

/**
 * Get all attendance records with pagination and optional filters
 */
export const getAllAttendance = async (params: {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  userRole?: string;
  status?: string;
}) => {
  const { page = 1, limit = 20, startDate, endDate, userRole, status } = params;

  const filter: Record<string, unknown> = {};

  // Date range filter
  if (startDate && endDate) {
    filter.date = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    filter.date = { $gte: startDate };
  } else if (endDate) {
    filter.date = { $lte: endDate };
  }

  // User role filter
  if (userRole) {
    filter.userRole = userRole;
  }

  // Status filter
  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    AttendanceModel.find(filter)
      .populate('userId', 'name email')
      .populate('enteredBy', 'name email')
      .sort({ date: -1, checkInTime: -1 })
      .skip(skip)
      .limit(limit),
    AttendanceModel.countDocuments(filter)
  ]);

  return {
    records,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Delete attendance record
 */
export const deleteAttendance = async (id: string) => {
  const attendance = await AttendanceModel.findById(id);
  AppAssert(attendance, NOT_FOUND, "Attendance record not found");

  await AttendanceModel.findByIdAndDelete(id);
  return { success: true, message: "Attendance record deleted successfully" };
};