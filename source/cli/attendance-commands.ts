import {AttendanceManager} from '../attendance/AttendanceManager.js';
import {readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import type {JiraConfig} from '../jira-client.js';

export interface AttendanceCommandResult {
	success: boolean;
	message: string;
}

export interface CheckInParams {
	date?: string;
	time?: string;
}

export interface CheckOutParams {
	date?: string;
	time?: string;
}

export interface StatusParams {
	date?: string;
}

function getAttendanceManager(
	configPath?: string,
	csvPath?: string,
): AttendanceManager {
	const configFilePath =
		configPath || join(homedir(), '.config', 'jiracle.json');
	const configData = readFileSync(configFilePath, 'utf8');
	const config: JiraConfig = JSON.parse(configData);

	if (!config.attendance || !config.attendance.enabled) {
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
	params: CheckInParams,
	configPath?: string,
	csvPath?: string,
): Promise<AttendanceCommandResult> {
	try {
		if (params.date) {
			validateDate(params.date);
		}

		if (params.time) {
			validateTime(params.time);
		}

		const manager = getAttendanceManager(configPath, csvPath);
		const attendance = await manager.checkIn(params.date, params.time);

		const time = attendance.checkIn!;

		return {
			success: true,
			message: `✅ Checked in at ${time}`,
		};
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error ? error.message : 'Unknown error occurred',
		};
	}
}

export async function executeCheckOut(
	params: CheckOutParams,
	configPath?: string,
	csvPath?: string,
): Promise<AttendanceCommandResult> {
	try {
		if (params.date) {
			validateDate(params.date);
		}

		if (params.time) {
			validateTime(params.time);
		}

		const manager = getAttendanceManager(configPath, csvPath);
		const attendance = await manager.checkOut(params.date, params.time);

		const checkIn = attendance.checkIn;
		const checkOut = attendance.checkOut!;

		let message = `✅ Checked out at ${checkOut}`;

		if (checkIn && attendance.totalHours !== undefined) {
			message += ` (${checkIn}-${checkOut}, ${attendance.totalHours}h total)`;
		}

		return {
			success: true,
			message,
		};
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error ? error.message : 'Unknown error occurred',
		};
	}
}

export async function executeStatus(
	params: StatusParams,
	configPath?: string,
	csvPath?: string,
): Promise<AttendanceCommandResult> {
	try {
		if (params.date) {
			validateDate(params.date);
		}

		const manager = getAttendanceManager(configPath, csvPath);
		const status = await manager.getStatus(params.date);

		const date = params.date || new Date().toISOString().split('T')[0]!;
		const dateLabel =
			date === new Date().toISOString().split('T')[0] ? 'Today' : date;

		const statusMessage = manager.formatStatusMessage(status);

		return {
			success: true,
			message: `${dateLabel}: ${statusMessage}`,
		};
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error ? error.message : 'Unknown error occurred',
		};
	}
}
