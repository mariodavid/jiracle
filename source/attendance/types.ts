export type AttendanceType = 'WORK' | 'VACATION' | 'HOLIDAY' | 'SICK';

export type Attendance = {
	// NOTE: date remains string (not LocalDate) to avoid system-wide breaking changes
	// across CSV storage, existing components, and attendance tracking logic
	date: string; // "2025-07-12"
	type?: AttendanceType; // "WORK", "VACATION", "HOLIDAY", "SICK"
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
	today: Attendance | undefined;
	totalHours: number;
	shouldHours: number;
	difference: number;
	hasCheckedIn: boolean;
	hasCheckedOut: boolean;
};

export type WeeklyAttendance = Record<string, Attendance>;
