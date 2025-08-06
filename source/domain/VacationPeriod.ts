import type {LocalDate} from './LocalDate.js';

export class VacationPeriod {
	static create(startDate: LocalDate, endDate: LocalDate): VacationPeriod {
		if (startDate.toISOString() > endDate.toISOString()) {
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

		while (currentDate.toISOString() <= this.endDate.toISOString()) {
			count++;
			currentDate = currentDate.addDays(1);
		}

		return count;
	}

	isValidRange(): boolean {
		return this.startDate.toISOString() <= this.endDate.toISOString();
	}

	includesWeekends(): boolean {
		let currentDate = this.startDate;

		while (currentDate.toISOString() <= this.endDate.toISOString()) {
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
		const dateString = date.toISOString();
		return (
			dateString >= this.startDate.toISOString() &&
			dateString <= this.endDate.toISOString()
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

		while (currentDate.toISOString() <= this.endDate.toISOString()) {
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
