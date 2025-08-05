import type {LocalDate} from './LocalDate.js';
import {MonthYear} from './MonthYear.js';

export class ExportPeriod {
	static forMonth(monthYear: MonthYear): ExportPeriod {
		const startDate = monthYear.getStartDate();
		const endDate = monthYear.getEndDate();
		return new ExportPeriod(startDate, endDate);
	}

	static forWeek(weekStartDate: LocalDate): ExportPeriod {
		const startDate = weekStartDate.getWeekStart();
		const endDate = weekStartDate.getWeekEnd();
		return new ExportPeriod(startDate, endDate);
	}

	static forDateRange(startDate: LocalDate, endDate: LocalDate): ExportPeriod {
		if (startDate.toDate().getTime() > endDate.toDate().getTime()) {
			throw new Error('Start date must be before or equal to end date');
		}

		return new ExportPeriod(startDate, endDate);
	}

	static currentMonth(): ExportPeriod {
		const currentMonthYear = MonthYear.current();
		return ExportPeriod.forMonth(currentMonthYear);
	}

	constructor(
		private readonly startDate: LocalDate,
		private readonly endDate: LocalDate,
	) {
		if (startDate.toDate().getTime() > endDate.toDate().getTime()) {
			throw new Error('Start date must be before or equal to end date');
		}
	}

	getStartDate(): LocalDate {
		return this.startDate;
	}

	getEndDate(): LocalDate {
		return this.endDate;
	}

	getDisplayName(): string {
		const start = this.startDate.toDisplayString();
		const end = this.endDate.toDisplayString();

		if (start === end) {
			return start;
		}

		return `${start} to ${end}`;
	}

	getShortDisplayName(): string {
		const startParts = this.startDate.toDisplayString().split('-');
		const endParts = this.endDate.toDisplayString().split('-');

		if (startParts[0] === endParts[0] && startParts[1] === endParts[1]) {
			// Same month/year
			const startMonth = startParts[1] ?? '';
			const startYear = startParts[0] ?? '';
			return `${startMonth}/${startYear}`;
		}

		const startMonth = startParts[1] ?? '';
		const startYear = startParts[0] ?? '';
		const endMonth = endParts[1] ?? '';
		const endYear = endParts[0] ?? '';
		return `${startMonth}/${startYear} - ${endMonth}/${endYear}`;
	}

	getDurationInDays(): number {
		const startTime = this.startDate.toDate().getTime();
		const endTime = this.endDate.toDate().getTime();
		const diffTime = endTime - startTime;
		return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
	}

	contains(date: LocalDate): boolean {
		const dateTime = date.toDate().getTime();
		const startTime = this.startDate.toDate().getTime();
		const endTime = this.endDate.toDate().getTime();

		return dateTime >= startTime && dateTime <= endTime;
	}

	isCurrentMonth(): boolean {
		const currentMonth = MonthYear.current();
		const periodStart = MonthYear.fromLocalDate(this.startDate);
		const periodEnd = MonthYear.fromLocalDate(this.endDate);

		return periodStart.equals(currentMonth) && periodEnd.equals(currentMonth);
	}

	getMonthYear(): MonthYear | undefined {
		const startMonth = MonthYear.fromLocalDate(this.startDate);
		const endMonth = MonthYear.fromLocalDate(this.endDate);

		if (startMonth.equals(endMonth)) {
			return startMonth;
		}

		return undefined; // Period spans multiple months
	}

	equals(other: ExportPeriod): boolean {
		return (
			this.startDate.equals(other.startDate) &&
			this.endDate.equals(other.endDate)
		);
	}

	toPlainObject(): {startDate: string; endDate: string} {
		return {
			startDate: this.startDate.toISOString(),
			endDate: this.endDate.toISOString(),
		};
	}
}
