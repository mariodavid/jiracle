import {homedir} from 'node:os';
import {join, dirname} from 'node:path';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import type {Attendance} from './types.js';

export class AttendanceCSVStorage {
	private readonly csvPath: string;

	constructor(csvPath?: string) {
		this.csvPath =
			csvPath || join(homedir(), '.config', 'jiracle', 'attendance.csv');
	}

	async ensureDirectory(): Promise<void> {
		const dir = dirname(this.csvPath);
		if (!existsSync(dir)) {
			await mkdir(dir, {recursive: true});
		}
	}

	async readAll(): Promise<Attendance[]> {
		try {
			if (!existsSync(this.csvPath)) {
				return [];
			}

			const content = await readFile(this.csvPath, 'utf8');
			const lines = content.trim().split('\n');

			if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
				return [];
			}

			// Skip header if present
			const dataLines = lines[0]?.startsWith('Date,') ? lines.slice(1) : lines;

			return dataLines
				.filter(line => line.trim() && line.split(',').length >= 4) // Must have at least date and breakMinutes
				.map(line => this.parseCSVLine(line));
		} catch (error) {
			console.error('Error reading CSV:', error);
			return [];
		}
	}

	async write(attendances: Attendance[]): Promise<void> {
		await this.ensureDirectory();

		const header = 'Date,CheckIn,CheckOut,BreakMinutes,TotalHours,Notes';
		const lines = [header];

		for (const attendance of attendances) {
			lines.push(this.toCSVLine(attendance));
		}

		await writeFile(this.csvPath, lines.join('\n') + '\n');
	}

	async getByDate(date: string): Promise<Attendance | null> {
		const attendances = await this.readAll();
		return attendances.find(a => a.date === date) || null;
	}

	async getByDateRange(
		startDate: string,
		endDate: string,
	): Promise<Attendance[]> {
		const attendances = await this.readAll();
		return attendances.filter(a => a.date >= startDate && a.date <= endDate);
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

	async deleteByDate(date: string): Promise<void> {
		const attendances = await this.readAll();
		const filteredAttendances = attendances.filter(
			attendance => attendance.date !== date,
		);
		await this.write(filteredAttendances);
	}

	private parseCSVLine(line: string): Attendance {
		const [date, checkIn, checkOut, breakMinutes, totalHours, notes] =
			line.split(',');

		if (!date) {
			throw new Error('Date is required in CSV line');
		}

		const attendance: Attendance = {
			date,
			breakMinutes: Number(breakMinutes) || 30,
		};

		if (checkIn && checkIn !== '') {
			attendance.checkIn = checkIn;
		}
		if (checkOut && checkOut !== '') {
			attendance.checkOut = checkOut;
		}
		if (totalHours && totalHours !== '' && !isNaN(Number(totalHours))) {
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
			attendance.checkIn || '',
			attendance.checkOut || '',
			attendance.breakMinutes.toString(),
			attendance.totalHours?.toString() || '',
			attendance.notes || '',
		];

		return fields.join(',');
	}
}
