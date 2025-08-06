import type {LocalDate} from './LocalDate.js';

export class VacationPeriod {
	static create(startDate: LocalDate, endDate: LocalDate): VacationPeriod {
		if (startDate.isAfter(endDate)) {
			throw new Error('Start date must be before or equal to end date');
		}

		return new VacationPeriod(startDate, endDate);
	}

	static single(date: LocalDate): VacationPeriod {
		return new VacationPeriod(date, date);
	}

	private constructor(
		public readonly startDate: LocalDate,
		public readonly endDate: LocalDate,
	) {}

	getDurationDays(): number {
		let count = 0;
		let currentDate = this.startDate;

		while (currentDate.isBeforeOrEqual(this.endDate)) {
			count++;
			currentDate = currentDate.addDays(1);
		}

		return count;
	}

	isValidRange(): boolean {
		return this.startDate.isBeforeOrEqual(this.endDate);
	}

	includesWeekends(): boolean {
		let currentDate = this.startDate;

		while (currentDate.isBeforeOrEqual(this.endDate)) {
			const dayOfWeek = currentDate.toDate().getDay();

			if (dayOfWeek === 0 || dayOfWeek === 6) {
				// Sunday or Saturday
				return true;
			}

			currentDate = currentDate.addDays(1);
		}

		return false;
	}

	contains(date: LocalDate): boolean {
		return (
			date.isAfterOrEqual(this.startDate) && date.isBeforeOrEqual(this.endDate)
		);
	}

	overlaps(other: VacationPeriod): boolean {
		return (
			this.contains(other.startDate) ||
			this.contains(other.endDate) ||
			other.contains(this.startDate) ||
			other.contains(this.endDate)
		);
	}

	getAllDates(): LocalDate[] {
		const dates: LocalDate[] = [];
		let currentDate = this.startDate;

		while (currentDate.isBeforeOrEqual(this.endDate)) {
			dates.push(currentDate);
			currentDate = currentDate.addDays(1);
		}

		return dates;
	}

	equals(other: VacationPeriod): boolean {
		return (
			this.startDate.equals(other.startDate) &&
			this.endDate.equals(other.endDate)
		);
	}
}
