import {LocalDate} from './LocalDate.js';

const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

export class MonthYear {
	static current(): MonthYear {
		const today = new Date();
		return new MonthYear(today.getFullYear(), today.getMonth() + 1);
	}

	static fromDate(date: Date): MonthYear {
		return new MonthYear(date.getFullYear(), date.getMonth() + 1);
	}

	static fromLocalDate(localDate: LocalDate): MonthYear {
		const date = localDate.toDate();
		return MonthYear.fromDate(date);
	}

	static fromString(monthYearString: string): MonthYear {
		const match = /^(\d{4})-(\d{1,2})$/.exec(monthYearString);
		if (!match) {
			throw new Error(
				`Invalid month-year format: ${monthYearString}. Expected YYYY-MM`,
			);
		}

		const year = Number.parseInt(match[1]!, 10);
		const month = Number.parseInt(match[2]!, 10);
		return new MonthYear(year, month);
	}

	private static isValidMonth(month: number): boolean {
		return Number.isInteger(month) && month >= 1 && month <= 12;
	}

	private static isValidYear(year: number): boolean {
		return Number.isInteger(year) && year >= 1900 && year <= 2100;
	}

	constructor(private readonly year: number, private readonly month: number) {
		if (!MonthYear.isValidMonth(month)) {
			throw new Error(`Invalid month: ${month}. Must be between 1 and 12`);
		}

		if (!MonthYear.isValidYear(year)) {
			throw new Error(`Invalid year: ${year}. Must be between 1900 and 2100`);
		}
	}

	getYear(): number {
		return this.year;
	}

	getMonth(): number {
		return this.month;
	}

	toString(): string {
		return `${this.year}-${this.month.toString().padStart(2, '0')}`;
	}

	getDisplayName(): string {
		const monthName = MONTH_NAMES[this.month - 1];
		if (!monthName) {
			throw new Error(`Invalid month index: ${this.month - 1}`);
		}

		return `${monthName} ${this.year}`;
	}

	getShortDisplayName(): string {
		const monthName = MONTH_NAMES[this.month - 1];
		if (!monthName) {
			throw new Error(`Invalid month index: ${this.month - 1}`);
		}

		return `${monthName.slice(0, 3)} ${this.year}`;
	}

	isCurrentMonth(): boolean {
		const current = MonthYear.current();
		return this.year === current.year && this.month === current.month;
	}

	getStartDate(): LocalDate {
		const startDate = new Date(this.year, this.month - 1, 1);
		return LocalDate.fromDate(startDate);
	}

	getEndDate(): LocalDate {
		const endDate = new Date(this.year, this.month, 0); // Last day of month
		return LocalDate.fromDate(endDate);
	}

	addMonths(months: number): MonthYear {
		const newDate = new Date(this.year, this.month - 1 + months, 1);
		return MonthYear.fromDate(newDate);
	}

	isBefore(other: MonthYear): boolean {
		if (this.year !== other.year) {
			return this.year < other.year;
		}

		return this.month < other.month;
	}

	isAfter(other: MonthYear): boolean {
		return other.isBefore(this);
	}

	equals(other: MonthYear): boolean {
		return this.year === other.year && this.month === other.month;
	}

	toPlainObject(): {year: number; month: number} {
		return {year: this.year, month: this.month};
	}
}
