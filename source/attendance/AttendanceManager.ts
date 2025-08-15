import process from 'node:process';
import {LocalDate} from '../domain/LocalDate.js';
import {uiLogger} from '../utils/logger.js';
import {AttendanceCSVStorage} from './AttendanceCSVStorage.js';
import {AttendanceCalculations} from './AttendanceCalculations.js';
import type {
	Attendance,
	AttendanceConfig,
	AttendanceStatus,
	WeeklyAttendance,
} from './types.js';

export class AttendanceManager {
	private readonly storage: AttendanceCSVStorage;

	constructor(private config: AttendanceConfig, csvPath?: string) {
		const finalCsvPath =
			csvPath ?? config.csvPath ?? process.env['JIRACLE_ATTENDANCE_CSV_PATH'];
		this.storage = new AttendanceCSVStorage(finalCsvPath);
	}

	async checkIn(date?: LocalDate, time?: string): Promise<Attendance> {
		const targetDate = date ?? LocalDate.today();
		const checkInTime = time ?? this.getCurrentTime();

		if (!AttendanceCalculations.isValidTimeString(checkInTime)) {
			throw new Error(`Invalid check-in time format: ${checkInTime}`);
		}

		let attendance = await this.storage.getByDate(targetDate);

		if (!attendance) {
			attendance = {
				date: targetDate.toISOString(),
				breakMinutes: this.config.defaultBreakMinutes,
			};
		}

		attendance.checkIn = checkInTime;

		// Recalculate total hours if both checkIn and checkOut are present
		if (attendance.checkOut) {
			const calculatedHours =
				AttendanceCalculations.calculateTotalHours(attendance);
			if (calculatedHours !== undefined) {
				attendance.totalHours = calculatedHours;
			}
		}

		await this.storage.upsert(attendance);
		return attendance;
	}

	async checkOut(date?: LocalDate, time?: string): Promise<Attendance> {
		const targetDate = date ?? LocalDate.today();
		const checkOutTime = time ?? this.getCurrentTime();

		if (!AttendanceCalculations.isValidTimeString(checkOutTime)) {
			throw new Error(`Invalid check-out time format: ${checkOutTime}`);
		}

		let attendance = await this.storage.getByDate(targetDate);

		if (!attendance) {
			attendance = {
				date: targetDate.toISOString(),
				breakMinutes: this.config.defaultBreakMinutes,
			};
		}

		attendance.checkOut = checkOutTime;

		// Recalculate total hours if both checkIn and checkOut are present
		if (attendance.checkIn) {
			const calculatedHours =
				AttendanceCalculations.calculateTotalHours(attendance);
			if (calculatedHours !== undefined) {
				attendance.totalHours = calculatedHours;
			}
		}

		await this.storage.upsert(attendance);
		return attendance;
	}

	async getStatus(date?: LocalDate): Promise<AttendanceStatus> {
		const targetDate = date ?? LocalDate.today();
		const attendance = await this.storage.getByDate(targetDate);

		return AttendanceCalculations.calculateStatus(
			attendance,
			this.config.workingHours,
		);
	}

	async updateAttendance(attendance: Attendance): Promise<Attendance> {
		// Validate times
		if (
			attendance.checkIn &&
			!AttendanceCalculations.isValidTimeString(attendance.checkIn)
		) {
			throw new Error(`Invalid check-in time format: ${attendance.checkIn}`);
		}

		if (
			attendance.checkOut &&
			!AttendanceCalculations.isValidTimeString(attendance.checkOut)
		) {
			throw new Error(`Invalid check-out time format: ${attendance.checkOut}`);
		}

		// Recalculate total hours
		const calculatedHours =
			AttendanceCalculations.calculateTotalHours(attendance);
		if (calculatedHours !== undefined) {
			attendance.totalHours = calculatedHours;
		}

		await this.storage.upsert(attendance);
		return attendance;
	}

	async hasAttendanceForDate(date: string): Promise<boolean> {
		const localDate = LocalDate.fromString(date);
		const attendance = await this.storage.getByDate(localDate);
		return attendance !== undefined;
	}

	async getWeeklyAttendance(startDate?: Date): Promise<WeeklyAttendance> {
		const baseDate = startDate ?? new Date();
		const weekDates = AttendanceCalculations.getWeekDates(baseDate);

		uiLogger.debug('AttendanceManager: Getting weekly attendance', {
			baseDate: baseDate.toISOString(),
			weekDates: weekDates.map(d => d.toISOString()),
		});

		const weeklyAttendance: WeeklyAttendance = {};

		const attendances = await Promise.all(
			weekDates.map(async date => ({
				date: date.toISOString(),
				attendance: await this.storage.getByDate(date),
			})),
		);

		uiLogger.debug('AttendanceManager: Fetched attendances', {
			attendances: attendances.map(a => ({
				date: a.date,
				hasAttendance: Boolean(a.attendance),
				attendance: a.attendance,
			})),
		});

		for (const {date, attendance} of attendances) {
			if (attendance) {
				weeklyAttendance[date] = attendance;
			}
		}

		uiLogger.debug('AttendanceManager: Final weekly attendance', {
			weeklyAttendance,
			keys: Object.keys(weeklyAttendance),
		});

		return weeklyAttendance;
	}

	async getWeeklyTotals(startDate?: Date): Promise<{
		totalHours: number;
		shouldHours: number;
		difference: number;
		dailyHours: Record<string, number>;
		weeklyAttendance: WeeklyAttendance;
	}> {
		const weeklyAttendance = await this.getWeeklyAttendance(startDate);
		const totals = AttendanceCalculations.calculateWeeklyTotals(
			weeklyAttendance,
			this.config.workingHours,
		);

		return {
			...totals,
			weeklyAttendance,
		};
	}

	async getAttendanceRange(
		startDate: LocalDate,
		endDate: LocalDate,
	): Promise<Attendance[]> {
		return this.storage.getByDateRange(startDate, endDate);
	}

	async getAllAttendance(): Promise<Attendance[]> {
		return this.storage.readAll();
	}

	async correctTime(
		date: LocalDate,
		checkIn?: string,
		checkOut?: string,
		breakMinutes?: number,
	): Promise<Attendance> {
		const targetDate = date;
		let attendance = await this.storage.getByDate(targetDate);

		if (!attendance) {
			attendance = {
				date: targetDate.toISOString(),
				breakMinutes: breakMinutes ?? this.config.defaultBreakMinutes,
			};
		}

		if (checkIn !== undefined) {
			if (checkIn && !AttendanceCalculations.isValidTimeString(checkIn)) {
				throw new Error(`Invalid check-in time format: ${checkIn}`);
			}

			if (checkIn) {
				attendance.checkIn = checkIn;
			} else {
				delete attendance.checkIn;
			}
		}

		if (checkOut !== undefined) {
			if (checkOut && !AttendanceCalculations.isValidTimeString(checkOut)) {
				throw new Error(`Invalid check-out time format: ${checkOut}`);
			}

			if (checkOut) {
				attendance.checkOut = checkOut;
			} else {
				delete attendance.checkOut;
			}
		}

		if (breakMinutes !== undefined) {
			attendance.breakMinutes = breakMinutes;
		}

		// Recalculate total hours
		const calculatedHours =
			AttendanceCalculations.calculateTotalHours(attendance);
		if (calculatedHours === undefined) {
			delete attendance.totalHours;
		} else {
			attendance.totalHours = calculatedHours;
		}

		await this.storage.upsert(attendance);
		return attendance;
	}

	getConfig(): AttendanceConfig {
		return {...this.config};
	}

	updateConfig(newConfig: Partial<AttendanceConfig>): void {
		this.config = {...this.config, ...newConfig};
	}

	async deleteAttendance(date: LocalDate): Promise<boolean> {
		const targetDate = date;
		const attendance = await this.storage.getByDate(targetDate);
		if (!attendance) {
			return false; // No attendance record found for this date
		}

		// Remove the attendance record from storage
		await this.storage.deleteByDate(targetDate);
		return true;
	}

	// Utility methods for UI
	async hasCheckedInToday(): Promise<boolean> {
		const today = LocalDate.today();
		const attendance = await this.storage.getByDate(today);
		return Boolean(attendance?.checkIn);
	}

	async hasCheckedOutToday(): Promise<boolean> {
		const today = LocalDate.today();
		const attendance = await this.storage.getByDate(today);
		return Boolean(attendance?.checkOut);
	}

	async getTodaysWorkTime(): Promise<number> {
		const today = LocalDate.today();
		const attendance = await this.storage.getByDate(today);

		if (!attendance) {
			return 0;
		}

		return (
			attendance.totalHours ??
			AttendanceCalculations.calculateTotalHours(attendance) ??
			0
		);
	}

	formatStatusMessage(status: AttendanceStatus): string {
		if (!status.today) {
			return `No attendance recorded. Expected: ${AttendanceCalculations.formatDuration(
				status.shouldHours,
			)}`;
		}

		const parts: string[] = [];

		if (status.hasCheckedIn && status.hasCheckedOut) {
			const checkIn = status.today.checkIn!;
			const checkOut = status.today.checkOut!;
			const totalTime = AttendanceCalculations.formatDuration(
				status.totalHours,
			);
			const shouldTime = AttendanceCalculations.formatDuration(
				status.shouldHours,
			);

			parts.push(
				`${checkIn}-${checkOut} (${totalTime}, Target: ${shouldTime})`,
			);

			if (status.difference > 0) {
				parts.push(
					`+${AttendanceCalculations.formatDuration(status.difference)} ✅`,
				);
			} else if (status.difference < 0) {
				parts.push(
					`${AttendanceCalculations.formatDuration(status.difference)} ⚠️`,
				);
			} else {
				parts.push('✅');
			}
		} else if (status.hasCheckedIn) {
			parts.push(`Checked in at ${status.today.checkIn!}`);
		} else {
			parts.push('Not checked in yet');
		}

		return parts.join(' ');
	}

	private getCurrentTime(): string {
		const now = new Date();
		return now.toTimeString().slice(0, 5);
	}
}
