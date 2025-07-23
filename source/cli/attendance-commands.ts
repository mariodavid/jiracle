import {AttendanceManager} from '../attendance/AttendanceManager.js';
import type {JiraConfig} from '../jira-client.js';
import {loadJiraConfig} from '../utils/config-loader.js';

export type AttendanceCommandResult = {
	success: boolean;
	message: string;
};

export type CheckInParameters = {
	date?: string;
	time?: string;
};

export type CheckOutParameters = {
	date?: string;
	time?: string;
};

export type StatusParameters = {
	date?: string;
};

function getAttendanceManager(
	configPath?: string,
	csvPath?: string,
): AttendanceManager {
	const config: JiraConfig = loadJiraConfig(configPath);

	if (!config.attendance?.enabled) {
		throw new Error(
			'Attendance tracking is not enabled. Please configure it in your jiracle.json',
		);
	}

	return new AttendanceManager(config.attendance, csvPath);
}

function validateDate(date: string): void {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		throw new Error('Date must be in YYYY-MM-DD format');
	}

	const testDate = new Date(date);
	if (
		Number.isNaN(testDate.getTime()) ||
		testDate.toISOString().split('T')[0] !== date
	) {
		throw new Error('Date must be in YYYY-MM-DD format');
	}
}

function validateTime(time: string): void {
	if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
		throw new Error('Time must be in HH:MM format (e.g., 08:30, 17:00)');
	}
}

export async function executeCheckIn(
	parameters: CheckInParameters,
	configPath?: string,
	csvPath?: string,
): Promise<AttendanceCommandResult> {
	try {
		if (parameters.date) {
			validateDate(parameters.date);
		}

		if (parameters.time) {
			validateTime(parameters.time);
		}

		const manager = getAttendanceManager(configPath, csvPath);
		const attendance = await manager.checkIn(parameters.date, parameters.time);

		const time = attendance.checkIn!;

		return {
			success: true,
			message: `✅ Checked in at ${time}`,
		};
	} catch (error: unknown) {
		return {
			success: false,
			message:
				error instanceof Error ? error.message : 'Unknown error occurred',
		};
	}
}

export async function executeCheckOut(
	parameters: CheckOutParameters,
	configPath?: string,
	csvPath?: string,
): Promise<AttendanceCommandResult> {
	try {
		if (parameters.date) {
			validateDate(parameters.date);
		}

		if (parameters.time) {
			validateTime(parameters.time);
		}

		const manager = getAttendanceManager(configPath, csvPath);
		const attendance = await manager.checkOut(parameters.date, parameters.time);

		const {checkIn} = attendance;
		const checkOut = attendance.checkOut!;

		let message = `✅ Checked out at ${checkOut}`;

		if (checkIn && attendance.totalHours !== undefined) {
			message += ` (${checkIn}-${checkOut}, ${attendance.totalHours}h total)`;
		}

		return {
			success: true,
			message,
		};
	} catch (error: unknown) {
		return {
			success: false,
			message:
				error instanceof Error ? error.message : 'Unknown error occurred',
		};
	}
}

export async function executeStatus(
	parameters: StatusParameters,
	configPath?: string,
	csvPath?: string,
): Promise<AttendanceCommandResult> {
	try {
		if (parameters.date) {
			validateDate(parameters.date);
		}

		const manager = getAttendanceManager(configPath, csvPath);
		const status = await manager.getStatus(parameters.date);

		const date =
			parameters.date ?? new Date().toISOString().split('T')[0] ?? '';
		const todayString = new Date().toISOString().split('T')[0] ?? '';
		const dateLabel = date === todayString ? 'Today' : date;

		const statusMessage = manager.formatStatusMessage(status);

		return {
			success: true,
			message: `${dateLabel}: ${String(statusMessage)}`,
		};
	} catch (error: unknown) {
		return {
			success: false,
			message:
				error instanceof Error ? error.message : 'Unknown error occurred',
		};
	}
}
