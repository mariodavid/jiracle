export class LocalDate {
	static today(): LocalDate {
		const today = new Date();
		return LocalDate.fromDate(today);
	}

	static fromDate(date: Date): LocalDate {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const dateKey = `${year}-${month}-${day}`;
		return new LocalDate(dateKey);
	}

	static fromString(dateString: string): LocalDate {
		if (!LocalDate.isValidDateString(dateString)) {
			throw new Error(
				`Invalid date format: ${dateString}. Expected YYYY-MM-DD`,
			);
		}

		return new LocalDate(dateString);
	}

	private static isValidDateString(dateString: string): boolean {
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(dateString)) {
			return false;
		}

		const date = new Date(dateString + 'T00:00:00.000Z');
		try {
			return date.toISOString().startsWith(dateString);
		} catch {
			return false;
		}
	}

	private constructor(private readonly dateKey: string) {}

	toISOString(): string {
		return this.dateKey;
	}

	toDisplayString(): string {
		return this.dateKey;
	}

	equals(other: LocalDate): boolean {
		return this.dateKey === other.dateKey;
	}

	addDays(days: number): LocalDate {
		const date = new Date(this.dateKey + 'T00:00:00.000Z');
		date.setUTCDate(date.getUTCDate() + days);
		return LocalDate.fromDate(date);
	}

	getWeekStart(): LocalDate {
		const date = new Date(this.dateKey + 'T00:00:00.000Z');
		const dayOfWeek = date.getUTCDay();
		const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as start of week
		const startDate = new Date(date);
		startDate.setUTCDate(date.getUTCDate() + diff);
		return LocalDate.fromDate(startDate);
	}

	getWeekEnd(): LocalDate {
		const weekStart = this.getWeekStart();
		return weekStart.addDays(6);
	}

	toDate(): Date {
		return new Date(this.dateKey + 'T00:00:00.000Z');
	}
}
