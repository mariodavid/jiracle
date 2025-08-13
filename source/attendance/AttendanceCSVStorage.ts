import {homedir} from 'node:os';
import {join, dirname} from 'node:path';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {LocalDate} from '../domain/LocalDate.js';
import {uiLogger} from '../utils/logger.js';
import type {Attendance, AttendanceType} from './types.js';

export class AttendanceCSVStorage {
	private readonly csvPath: string;

	constructor(csvPath?: string) {
		this.csvPath =
			csvPath ?? join(homedir(), '.config', 'jiracle', 'attendance.csv');
	}

	async ensureDirectory(): Promise<void> {
		const dir = dirname(this.csvPath);
		if (!existsSync(dir)) {
			await mkdir(dir, {recursive: true});
		}
	}

	async readAll(): Promise<Attendance[]> {
		try {
			uiLogger.debug('AttendanceCSVStorage: Reading CSV file', {
				csvPath: this.csvPath,
				exists: existsSync(this.csvPath),
			});

			if (!existsSync(this.csvPath)) {
				uiLogger.debug('AttendanceCSVStorage: CSV file does not exist');
				return [];
			}

			const content = await readFile(this.csvPath, 'utf8');
			const lines = content.trim().split('\n');

			uiLogger.debug('AttendanceCSVStorage: Read CSV content', {
				totalLines: lines.length,
				firstLine: lines[0],
				contentPreview: content.slice(0, 200),
			});

			if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
				return [];
			}

			// Skip header if present
			const dataLines = lines[0]?.startsWith('Date,') ? lines.slice(1) : lines;

			const attendances = dataLines
				.filter(line => line.trim() && line.split(',').length >= 4) // Must have at least date and breakMinutes
				.map(line => this.parseCSVLine(line));

			uiLogger.debug('AttendanceCSVStorage: Parsed attendances', {
				attendanceCount: attendances.length,
				attendances: attendances.map(a => ({
					date: a.date,
					checkIn: a.checkIn,
					checkOut: a.checkOut,
				})),
			});

			return attendances;
		} catch (error: unknown) {
			uiLogger.error('AttendanceCSVStorage: Error reading CSV', {error});
			console.error('Error reading CSV:', error);
			return [];
		}
	}

	async write(attendances: Attendance[]): Promise<void> {
		await this.ensureDirectory();

		const header = 'Date,Type,CheckIn,CheckOut,BreakMinutes,TotalHours,Notes';
		const lines = [header];

		for (const attendance of attendances) {
			lines.push(this.toCSVLine(attendance));
		}

		await writeFile(this.csvPath, lines.join('\n') + '\n');
	}

	async getByDate(date: LocalDate): Promise<Attendance | undefined> {
		const attendances = await this.readAll();

		uiLogger.debug('AttendanceCSVStorage: getByDate called', {
			searchDate: date.toISOString(),
			availableDates: attendances.map(a => a.date),
		});

		const found = attendances.find(a => {
			const attendanceDate = LocalDate.fromString(a.date);
			const matches = attendanceDate.equals(date);

			uiLogger.debug('AttendanceCSVStorage: Comparing dates', {
				searchDate: date.toISOString(),
				attendanceDate: a.date,
				attendanceDateParsed: attendanceDate.toISOString(),
				matches,
			});

			return matches;
		});

		uiLogger.debug('AttendanceCSVStorage: getByDate result', {
			searchDate: date.toISOString(),
			found: found
				? {
						date: found.date,
						checkIn: found.checkIn,
						checkOut: found.checkOut,
				  }
				: null,
		});

		return found ?? undefined;
	}

	async getByDateRange(
		startDate: LocalDate,
		endDate: LocalDate,
	): Promise<Attendance[]> {
		const attendances = await this.readAll();
		return attendances.filter(a => {
			const attendanceDate = LocalDate.fromString(a.date);
			return (
				attendanceDate.isAfterOrEqual(startDate) &&
				attendanceDate.isBeforeOrEqual(endDate)
			);
		});
	}

	async upsert(attendance: Attendance): Promise<void> {
		const attendances = await this.readAll();
		const index = attendances.findIndex(a => a.date === attendance.date);

		if (index >= 0) {
			attendances[index] = attendance;
		} else {
			attendances.push(attendance);
		}

		// Sort by date
		attendances.sort((a, b) => a.date.localeCompare(b.date));

		await this.write(attendances);
	}

	async deleteByDate(date: LocalDate): Promise<void> {
		const attendances = await this.readAll();
		const filteredAttendances = attendances.filter(
			attendance => !LocalDate.fromString(attendance.date).equals(date),
		);
		await this.write(filteredAttendances);
	}

	private parseCSVLine(line: string): Attendance {
		const [date, type, checkIn, checkOut, breakMinutes, totalHours, notes] =
			line.split(',');

		if (!date) {
			throw new Error('Date is required in CSV line');
		}

		const attendance: Attendance = {
			date,
			breakMinutes:
				breakMinutes !== undefined && breakMinutes !== ''
					? Number(breakMinutes)
					: 30,
		};

		if (type && type !== '') {
			// Validate type is one of the allowed values
			const validTypes: AttendanceType[] = [
				'WORK',
				'VACATION',
				'HOLIDAY',
				'SICK',
			];
			if (validTypes.includes(type as AttendanceType)) {
				attendance.type = type as AttendanceType;
			}
		}

		if (checkIn && checkIn !== '') {
			attendance.checkIn = checkIn;
		}

		if (checkOut && checkOut !== '') {
			attendance.checkOut = checkOut;
		}

		if (totalHours && totalHours !== '' && !Number.isNaN(Number(totalHours))) {
			attendance.totalHours = Number(totalHours);
		}

		if (notes && notes !== '') {
			attendance.notes = notes;
		}

		return attendance;
	}

	private toCSVLine(attendance: Attendance): string {
		const fields = [
			attendance.date,
			attendance.type ?? '',
			attendance.checkIn ?? '',
			attendance.checkOut ?? '',
			attendance.breakMinutes.toString(),
			attendance.totalHours?.toString() ?? '',
			attendance.notes ?? '',
		];

		return fields.join(',');
	}
}
