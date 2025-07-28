import {LocalDate} from './LocalDate.js';

export class WeekRange {
	static fromDate(date: LocalDate): WeekRange {
		const weekStart = date.getWeekStart();
		const weekEnd = weekStart.addDays(6);
		return new WeekRange(weekStart, weekEnd);
	}

	static current(): WeekRange {
		return WeekRange.fromDate(LocalDate.today());
	}

	static parse(weekString: string): WeekRange {
		const parts = weekString.split('/');
		if (parts.length !== 2) {
			throw new Error(
				`Invalid week string format: ${weekString}. Expected 'YYYY-MM-DD/YYYY-MM-DD'`,
			);
		}

		const startDate = LocalDate.fromString(parts[0]!.trim());
		const endDate = LocalDate.fromString(parts[1]!.trim());
		return new WeekRange(startDate, endDate);
	}

	private constructor(
		private readonly start: LocalDate,
		private readonly end: LocalDate,
	) {
		if (!this.isValidWeekRange(start, end)) {
			throw new Error(
				'Invalid week range: end must be exactly 6 days after start, and start must be Monday',
			);
		}
	}

	getStart(): LocalDate {
		return this.start;
	}

	getEnd(): LocalDate {
		return this.end;
	}

	contains(date: LocalDate): boolean {
		const dateString = date.toISOString();
		const startString = this.start.toISOString();
		const endString = this.end.toISOString();
		return dateString >= startString && dateString <= endString;
	}

	previous(): WeekRange {
		const previousStart = this.start.addDays(-7);
		return WeekRange.fromDate(previousStart);
	}

	next(): WeekRange {
		const nextStart = this.start.addDays(7);
		return WeekRange.fromDate(nextStart);
	}

	getDays(): LocalDate[] {
		const days: LocalDate[] = [];

		for (let i = 0; i < 7; i++) {
			days.push(this.start.addDays(i));
		}

		return days;
	}

	getWeekdays(): LocalDate[] {
		const weekdays: LocalDate[] = [];

		for (let i = 0; i < 5; i++) {
			// Monday to Friday
			weekdays.push(this.start.addDays(i));
		}

		return weekdays;
	}

	toDisplayString(): string {
		const startDate = this.start.toDate();
		const endDate = this.end.toDate();
		return this.formatDateRange(startDate, endDate);
	}

	toWeekString(): string {
		return `${this.start.toISOString()}/${this.end.toISOString()}`;
	}

	equals(other: WeekRange): boolean {
		return this.start.equals(other.start) && this.end.equals(other.end);
	}

	getWeekNumber(): number {
		const startDate = this.start.toDate();
		const firstThursday = new Date(startDate.getFullYear(), 0, 4);
		const firstThursdayDayOfWeek = firstThursday.getDay();
		const firstMondayOfYear = new Date(firstThursday);
		firstMondayOfYear.setDate(
			firstThursday.getDate() -
				(firstThursdayDayOfWeek === 0 ? 6 : firstThursdayDayOfWeek - 1),
		);

		const diffInMs = startDate.getTime() - firstMondayOfYear.getTime();
		const diffInWeeks = Math.floor(diffInMs / (7 * 24 * 60 * 60 * 1000));
		return diffInWeeks + 1;
	}

	getYear(): number {
		return this.start.toDate().getFullYear();
	}

	private formatDateRange(start: Date, end: Date): string {
		const startFormatted = this.formatDate(start);
		const endFormatted = this.formatDate(end);

		if (
			start.getMonth() === end.getMonth() &&
			start.getFullYear() === end.getFullYear()
		) {
			// Same month: "Jan 6-12, 2025"
			const monthName = start.toLocaleDateString('en-US', {month: 'short'});
			return `${monthName} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
		}

		if (start.getFullYear() === end.getFullYear()) {
			// Same year: "Dec 30 - Jan 5, 2025"
			const startMonth = start.toLocaleDateString('en-US', {month: 'short'});
			const endMonth = end.toLocaleDateString('en-US', {month: 'short'});
			return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
		}

		// Different years: "Dec 30, 2024 - Jan 5, 2025"
		return `${startFormatted} - ${endFormatted}`;
	}

	private formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	}

	private isValidWeekRange(start: LocalDate, end: LocalDate): boolean {
		const daysDiff = Math.floor(
			(end.toDate().getTime() - start.toDate().getTime()) /
				(24 * 60 * 60 * 1000),
		);

		if (daysDiff !== 6) {
			return false;
		}

		const startDayOfWeek = start.toDate().getUTCDay();
		return startDayOfWeek === 1; // Monday
	}
}
