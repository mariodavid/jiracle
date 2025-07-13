export interface Attendance {
	date: string; // "2025-07-12"
	checkIn?: string; // "08:15"
	checkOut?: string; // "17:00"
	breakMinutes: number; // 30 (always 30min)
	totalHours?: number; // 8.25 (automatically calculated)
	notes?: string; // Optional notes
}

export interface AttendanceConfig {
	enabled: boolean;
	workingHours: number;
	breakMinutes: number;
	defaultCheckIn: string;
	defaultCheckOut: string;
	defaultBreakMinutes: number;
}

export interface AttendanceStatus {
	today: Attendance | null;
	totalHours: number;
	shouldHours: number;
	difference: number;
	hasCheckedIn: boolean;
	hasCheckedOut: boolean;
}

export interface WeeklyAttendance {
	[date: string]: Attendance;
}
