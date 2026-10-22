import { apiRequest } from './userApi';

export interface AttendanceRecord {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  userRole: 'manager' | 'staff' | 'member';
  checkInTime: string;
  checkOutTime?: string;
  date: string;
  duration?: number;
  status: 'checked-in' | 'checked-out' | 'auto-checkout';
  notes?: string;
  isManualEntry: boolean;
  enteredBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  totalCheckIns: number;
  totalCheckOuts: number;
  averageDuration: number;
  totalUsers: number;
  todayCheckIns: number;
}

export interface CreateManualEntryData {
  userId: string;
  userRole: 'manager' | 'staff' | 'member';
  checkInTime: string;
  checkOutTime?: string;
  location?: string;
  notes?: string;
}

export interface UpdateAttendanceData {
  checkOutTime?: string;
  notes?: string;
}

class AttendanceApi {
  private baseUrl = '/attendance';

  // Get all attendance records with pagination and filters
  async getAllAttendance(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    userRole?: 'manager' | 'staff' | 'member';
    startDate?: string;
    endDate?: string;
    status?: 'checked-in' | 'checked-out' | 'auto-checkout';
    isManualEntry?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString()
      ? `${this.baseUrl}?${queryParams.toString()}`
      : this.baseUrl;

    return apiRequest<AttendanceRecord[]>(url);
  }

  // Get user attendance
  async getUserAttendance(userId: string, startDate?: string, endDate?: string) {
    const queryParams = new URLSearchParams({ userId });
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    return apiRequest<AttendanceRecord[]>(`${this.baseUrl}/user/${userId}?${queryParams.toString()}`);
  }

  // Get today's attendance
  async getTodayAttendance(userRole?: 'manager' | 'staff' | 'member') {
    const queryParams = new URLSearchParams();
    if (userRole) queryParams.append('userRole', userRole);

    const url = queryParams.toString()
      ? `${this.baseUrl}/today?${queryParams.toString()}`
      : `${this.baseUrl}/today`;

    return apiRequest<AttendanceRecord[]>(url);
  }

  // Get currently checked in users
  async getCurrentlyCheckedIn(userRole?: 'manager' | 'staff' | 'member') {
    const queryParams = new URLSearchParams();
    if (userRole) queryParams.append('userRole', userRole);

    const url = queryParams.toString()
      ? `${this.baseUrl}/currently-checked-in?${queryParams.toString()}`
      : `${this.baseUrl}/currently-checked-in`;

    return apiRequest<AttendanceRecord[]>(url);
  }

  // Get attendance statistics
  async getAttendanceStats(startDate: string, endDate: string, userRole?: 'manager' | 'staff' | 'member') {
    const queryParams = new URLSearchParams({ startDate, endDate });
    if (userRole) queryParams.append('userRole', userRole);

    return apiRequest<AttendanceStats>(`${this.baseUrl}/stats?${queryParams.toString()}`);
  }

  // Create manual attendance entry
  async createManualEntry(data: CreateManualEntryData) {
    return apiRequest<AttendanceRecord>(`${this.baseUrl}/manual-entry`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update attendance record (mainly for check-out)
  async updateAttendance(id: string, data: UpdateAttendanceData) {
    return apiRequest<AttendanceRecord>(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete attendance record
  async deleteAttendance(id: string) {
    return apiRequest(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
  }

  // Check user status
  async checkUserStatus(userId: string) {
    return apiRequest<{ userId: string; isCheckedIn: boolean; attendance?: AttendanceRecord }>(
      `${this.baseUrl}/status/${userId}`
    );
  }

  // Check in user with QR token
  async checkIn(data: { qrToken: string; location?: string; notes?: string }) {
    return apiRequest<AttendanceRecord & { action: string }>(`${this.baseUrl}/check-in`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Force check-in (staff assisted)
  async forceCheckIn(data: { memberQrToken: string; staffQrToken: string; location?: string; notes?: string }) {
    return apiRequest<AttendanceRecord>(`${this.baseUrl}/force-check-in`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Check out user
  async checkOut(userId: string, data?: { notes?: string }) {
    return apiRequest<AttendanceRecord>(`${this.baseUrl}/check-out/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data || {}),
    });
  }
}

export const attendanceApi = new AttendanceApi();