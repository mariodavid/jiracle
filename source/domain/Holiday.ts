import type {Attendance} from '../attendance/types.js';
import {LocalDate} from './LocalDate.js';

/**
 * Holiday name value object
 */
export class HolidayName {
	static fromString(name: string): HolidayName {
		if (!name || name.trim().length === 0) {
			throw new TypeError('Holiday name cannot be empty');
		}

		return new HolidayName(name.trim());
	}

	private readonly value: string;

	constructor(value: string) {
		if (!value || value.trim().length === 0) {
			throw new TypeError('Holiday name cannot be empty');
		}

		this.value = value.trim();
	}

	toString(): string {
		return this.value;
	}

	equals(other: HolidayName): boolean {
		return this.value === other.value;
	}
}

/**
 * Holiday value object encapsulating holiday business logic
 */
export class Holiday {
	static fromApiData(name: string, datum: string, hinweis?: string): Holiday {
		return new Holiday(
			HolidayName.fromString(name),
			LocalDate.fromString(datum),
			hinweis,
		);
	}

	constructor(
		public readonly name: HolidayName,
		public readonly date: LocalDate,
		public readonly note?: string,
	) {}

	/**
	 * Convert holiday to attendance entry
	 */
	toAttendance(): Attendance {
		return {
			date: this.date.toISOString(),
			type: 'HOLIDAY',
			breakMinutes: 0,
			totalHours: 0,
			notes: `Public Holiday: ${this.name.toString()}`,
		};
	}

	/**
	 * Get the date as LocalDate
	 */
	getDate(): LocalDate {
		return this.date;
	}

	/**
	 * Get holiday name
	 */
	getName(): HolidayName {
		return this.name;
	}

	/**
	 * Check if this holiday is on the same date as another
	 */
	isSameDate(other: Holiday): boolean {
		return this.date.equals(other.date);
	}

	/**
	 * Check if this holiday equals another holiday
	 */
	equals(other: Holiday): boolean {
		return (
			this.name.equals(other.name) &&
			this.date.equals(other.date) &&
			this.note === other.note
		);
	}

	toString(): string {
		return `${this.name.toString()} (${this.date.toDisplayString()})`;
	}
}
