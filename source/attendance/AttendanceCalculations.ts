import type {Attendance, AttendanceStatus, WeeklyAttendance} from './types.js';

function calculateTotalHours(attendance: Attendance): number | undefined {
	if (!attendance.checkIn || !attendance.checkOut) {
		return undefined;
	}

	const checkInTime = parseTime(attendance.checkIn);
	const checkOutTime = parseTime(attendance.checkOut);

	if (!checkInTime || !checkOutTime) {
		return undefined;
	}

	// Calculate minutes worked
	const totalMinutes = checkOutTime.totalMinutes - checkInTime.totalMinutes;

	if (totalMinutes <= 0) {
		return 0;
	}

	// Subtract break time
	const workMinutes = totalMinutes - attendance.breakMinutes;

	if (workMinutes <= 0) {
		return 0;
	}

	// Convert to hours with 2 decimal precision
	return Math.round((workMinutes / 60) * 100) / 100;
}

function formatDuration(hours: number): string {
	const wholeHours = Math.floor(hours);
	const minutes = Math.round((hours - wholeHours) * 60);

	if (minutes === 0) {
		return `${wholeHours}h`;
	}

	return `${wholeHours}h ${minutes}m`;
}

function formatTime(time: string): string {
	// Try strict parsing first
	let parsed = parseTime(time);

	// If that fails, try with more lenient parsing for single-digit hours
	if (!parsed) {
		const laxRegex = /^(\d{1,2}):(\d{2})$/;
		const match = time.match(laxRegex);

		if (match) {
			const hours = Number.parseInt(match[1]!, 10);
			const minutes = Number.parseInt(match[2]!, 10);

			if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
				parsed = {
					hours,
					minutes,
					totalMinutes: hours * 60 + minutes,
				};
			}
		}
	}

	if (!parsed) {
		return time;
	}

	return `${parsed.hours.toString().padStart(2, '0')}:${parsed.minutes
		.toString()
		.padStart(2, '0')}`;
}

function parseTime(
	timeString: string,
): {hours: number; minutes: number; totalMinutes: number} | null {
	const timeRegex = /^(\d{2}):(\d{2})$/;
	const match = timeString.match(timeRegex);

	if (!match) {
		return null;
	}

	const hours = Number.parseInt(match[1]!, 10);
	const minutes = Number.parseInt(match[2]!, 10);

	if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
		return null;
	}

	return {
		hours,
		minutes,
		totalMinutes: hours * 60 + minutes,
	};
}

function calculateStatus(
	attendance: Attendance | null,
	shouldHours: number,
): AttendanceStatus {
	if (!attendance) {
		return {
			today: null,
			totalHours: 0,
			shouldHours,
			difference: -shouldHours,
			hasCheckedIn: false,
			hasCheckedOut: false,
		};
	}

	const totalHours =
		attendance.totalHours || calculateTotalHours(attendance) || 0;
	const difference = totalHours - shouldHours;

	return {
		today: attendance,
		totalHours,
		shouldHours,
		difference,
		hasCheckedIn: Boolean(attendance.checkIn),
		hasCheckedOut: Boolean(attendance.checkOut),
	};
}

function getWeekDates(startDate: Date): string[] {
	const dates: string[] = [];
	const current = new Date(startDate);

	// Get Monday of the week
	const day = current.getDay();
	const diff = current.getDate() - day + (day === 0 ? -6 : 1);
	current.setDate(diff);

	// Generate 5 weekdays (Mon-Fri)
	for (let i = 0; i < 5; i++) {
		dates.push(current.toISOString().split('T')[0]!);
		current.setDate(current.getDate() + 1);
	}

	return dates;
}

function calculateWeeklyTotals(
	weeklyAttendance: WeeklyAttendance,
	shouldHoursPerDay: number,
): {
	totalHours: number;
	shouldHours: number;
	difference: number;
	dailyHours: Record<string, number>;
} {
	let totalHours = 0;
	const dailyHours: Record<string, number> = {};

	for (const [date, attendance] of Object.entries(weeklyAttendance)) {
		const hours = attendance.totalHours || calculateTotalHours(attendance) || 0;
		dailyHours[date] = hours;
		totalHours += hours;
	}

	const shouldHours = Object.keys(weeklyAttendance).length * shouldHoursPerDay;
	const difference = totalHours - shouldHours;

	return {
		totalHours,
		shouldHours,
		difference,
		dailyHours,
	};
}

function calculateDailyDeltas(
	weeklyAttendance: WeeklyAttendance,
	dailyLoggedHours: Record<string, number>,
	weekDates: string[],
): Record<string, number | null> {
	const deltas: Record<string, number | null> = {};

	for (const date of weekDates) {
		const attendance = weeklyAttendance[date];
		const loggedHours = dailyLoggedHours[date] || 0;

		if (!attendance?.checkIn || !attendance.checkOut) {
			// No attendance data available or incomplete
			deltas[date] = null;
		} else {
			const attendanceHours =
				attendance.totalHours || calculateTotalHours(attendance) || 0;
			deltas[date] = loggedHours - attendanceHours;
		}
	}

	return deltas;
}

function isValidTimeString(time: string): boolean {
	return parseTime(time) !== null;
}

function addMinutes(time: string, minutes: number): string | null {
	const parsed = parseTime(time);
	if (!parsed) {
		return null;
	}

	const totalMinutes = parsed.totalMinutes + minutes;
	const hours = Math.floor(totalMinutes / 60) % 24;
	const mins = totalMinutes % 60;

	return `${hours.toString().padStart(2, '0')}:${mins
		.toString()
		.padStart(2, '0')}`;
}

function timeDifferenceInMinutes(
	startTime: string,
	endTime: string,
): number | null {
	const start = parseTime(startTime);
	const end = parseTime(endTime);

	if (!start || !end) {
		return null;
	}

	return end.totalMinutes - start.totalMinutes;
}

export const AttendanceCalculations = {
	calculateTotalHours,
	formatDuration,
	formatTime,
	parseTime,
	calculateStatus,
	getWeekDates,
	calculateWeeklyTotals,
	calculateDailyDeltas,
	isValidTimeString,
	addMinutes,
	timeDifferenceInMinutes,
} as const;
