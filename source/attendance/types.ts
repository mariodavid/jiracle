export type Attendance = {
	date: string; // "2025-07-12"
	checkIn?: string; // "08:15"
	checkOut?: string; // "17:00"
	breakMinutes: number; // 30 (always 30min)
	totalHours?: number; // 8.25 (automatically calculated)
	notes?: string; // Optional notes
};

export type AttendanceConfig = {
	enabled: boolean;
	workingHours: number;
	breakMinutes: number;
	defaultCheckIn: string;
	defaultCheckOut: string;
	defaultBreakMinutes: number;
	csvPath?: string;
};

export type AttendanceStatus = {
	today: Attendance | null;
	totalHours: number;
	shouldHours: number;
	difference: number;
	hasCheckedIn: boolean;
	hasCheckedOut: boolean;
};

export type WeeklyAttendance = {
	[date: string]: Attendance;
};
