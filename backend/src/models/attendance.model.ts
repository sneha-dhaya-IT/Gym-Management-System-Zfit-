import mongoose from "mongoose";

export interface AttendanceDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  userRole: 'manager' | 'staff' | 'member';
  checkInTime: Date;
  checkOutTime?: Date;
  date: Date;
  duration?: number; // in minutes
  status: 'checked-in' | 'checked-out' | 'auto-checkout';
  notes?: string;
  isManualEntry: boolean;
  enteredBy?: mongoose.Types.ObjectId; // who entered if manual
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isCurrentlyCheckedIn(): boolean;
}

const attendanceSchema = new mongoose.Schema<AttendanceDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "User ID is required"],
      index: true,
    },
    userRole: {
      type: String,
      enum: {
        values: ['manager', 'staff', 'member'],
        message: 'User role must be one of: manager, staff, member'
      },
      required: [true, "User role is required"],
      index: true,
    },
    checkInTime: {
      type: Date,
      required: [true, "Check-in time is required"],
      index: true,
    },
    checkOutTime: {
      type: Date,
      validate: {
        validator: function(this: AttendanceDocument, v?: Date) {
          return !v || v > this.checkInTime;
        },
        message: 'Check-out time must be after check-in time'
      },
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },
    duration: {
      type: Number,
      min: [0, "Duration cannot be negative"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['checked-in', 'checked-out', 'auto-checkout'],
        message: 'Status must be one of: checked-in, checked-out, auto-checkout'
      },
      required: [true, "Status is required"],
      default: 'checked-in',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    isManualEntry: {
      type: Boolean,
      default: false,
      index: true,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
attendanceSchema.index({ userId: 1, date: -1 });
attendanceSchema.index({ userRole: 1, date: -1 });
attendanceSchema.index({ date: -1, status: 1 });
attendanceSchema.index({ userId: 1, status: 1 });
attendanceSchema.index({ checkInTime: 1, checkOutTime: 1 });

// Ensure only one active check-in per user per day
attendanceSchema.index(
  { userId: 1, date: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'checked-in' }
  }
);


attendanceSchema.methods.isCurrentlyCheckedIn = function(): boolean {
  return this.status === 'checked-in' && !this.checkOutTime;
};


attendanceSchema.pre('save', function(next) {
  // Set date from checkInTime if not provided
  if (!this.date) {
    this.date = new Date(this.checkInTime);
    this.date.setHours(0, 0, 0, 0);
  }
  
  if (this.checkOutTime) {
    const diffMs = this.checkOutTime.getTime() - this.checkInTime.getTime();
    this.duration = Math.round(diffMs / (1000 * 60)); // Convert to minutes
    if (this.status === 'checked-in') {
      this.status = 'checked-out';
    }
  }
  
  next();
});

const AttendanceModel = mongoose.model<AttendanceDocument>('Attendance', attendanceSchema);

export default AttendanceModel;