import type {LocalDate} from './LocalDate.js';
import {VacationPeriod} from './VacationPeriod.js';

export class VacationEntry {
	static create(
		startDate: LocalDate,
		endDate: LocalDate,
		notes?: string,
	): VacationEntry {
		const period = VacationPeriod.create(startDate, endDate);
		return new VacationEntry(period, notes);
	}

	static single(date: LocalDate, notes?: string): VacationEntry {
		const period = VacationPeriod.single(date);
		return new VacationEntry(period, notes);
	}

	private constructor(
		public readonly period: VacationPeriod,
		public readonly notes?: string,
	) {}

	get startDate(): LocalDate {
		return this.period.startDate;
	}

	get endDate(): LocalDate {
		return this.period.endDate;
	}

	getDurationDays(): number {
		return this.period.getDurationDays();
	}

	isValidRange(): boolean {
		return this.period.isValidRange();
	}

	includesWeekends(): boolean {
		return this.period.includesWeekends();
	}

	contains(date: LocalDate): boolean {
		return this.period.contains(date);
	}

	overlaps(other: VacationEntry): boolean {
		return this.period.overlaps(other.period);
	}

	getAllDates(): LocalDate[] {
		return this.period.getAllDates();
	}

	equals(other: VacationEntry): boolean {
		return this.period.equals(other.period) && this.notes === other.notes;
	}

	withNotes(notes: string): VacationEntry {
		return new VacationEntry(this.period, notes);
	}

	toString(): string {
		const start = this.startDate.toISOString();
		const end = this.endDate.toISOString();
		const duration = this.getDurationDays();

		if (start === end) {
			return `${start} (1 day)`;
		}

		return `${start} - ${end} (${duration} days)`;
	}
}
