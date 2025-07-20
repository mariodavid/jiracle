/**
 * Duration utility class for parsing and converting time formats
 * Supports formats like: 1h, 30m, 1h15m, 2.5h, 45, etc.
 */
export class Duration {
	private minutes: number;

	constructor(input: string | number) {
		this.minutes = Duration.parseToMinutes(input);
	}

	/**
	 * Parse various time formats to minutes
	 */
	static parseToMinutes(input: string | number): number {
		if (typeof input === 'number') {
			return input;
		}

		const timeStr = input.trim().toLowerCase();
		if (!timeStr) return 0;

		// Handle English words (2 hours, 45 minutes, etc.)
		const englishWordsMatch = timeStr.match(
			/^(\d+(?:[.,]\d+)?)\s+(hours?|h)$/i,
		);
		if (englishWordsMatch) {
			const hours = Number.parseFloat(englishWordsMatch[1]!.replace(',', '.'));
			return Math.round(hours * 60);
		}

		const englishMinutesMatch = timeStr.match(
			/^(\d+(?:[.,]\d+)?)\s+(minutes?|mins?|m)$/i,
		);
		if (englishMinutesMatch) {
			const minutes = Number.parseFloat(
				englishMinutesMatch[1]!.replace(',', '.'),
			);
			return Math.round(minutes);
		}

		// Handle combined format with space (2h 30m, 1h 15m, etc.)
		const spacedCombinedMatch = timeStr.match(
			/^(\d+(?:[.,]\d+)?)h\s+(\d+(?:[.,]\d+)?)m$/i,
		);
		if (spacedCombinedMatch) {
			const hours = Number.parseFloat(
				spacedCombinedMatch[1]!.replace(',', '.'),
			);
			const minutes = Number.parseFloat(
				spacedCombinedMatch[2]!.replace(',', '.'),
			);
			return Math.round(hours * 60 + minutes);
		}

		// Handle combined format without space (2h30m, 1h15m, etc.)
		const combinedMatch = timeStr.match(
			/^(\d+(?:[.,]\d+)?)h(\d+(?:[.,]\d+)?)m$/i,
		);
		if (combinedMatch) {
			const hours = Number.parseFloat(combinedMatch[1]!.replace(',', '.'));
			const minutes = Number.parseFloat(combinedMatch[2]!.replace(',', '.'));
			return Math.round(hours * 60 + minutes);
		}

		// Handle hours only (1h, 2.5h, etc.)
		const hourMatch = timeStr.match(/^(\d+(?:[.,]\d+)?)h$/i);
		if (hourMatch) {
			const hours = Number.parseFloat(hourMatch[1]!.replace(',', '.'));
			return Math.round(hours * 60);
		}

		// Handle minutes only (30m, 45m, etc.)
		const minuteMatch = timeStr.match(/^(\d+(?:[.,]\d+)?)m$/i);
		if (minuteMatch) {
			const minutes = Number.parseFloat(minuteMatch[1]!.replace(',', '.'));
			return Math.round(minutes);
		}

		// Handle days (1d = 8h = 480m)
		const dayMatch = timeStr.match(/^(\d+(?:[.,]\d+)?)d$/i);
		if (dayMatch) {
			const days = Number.parseFloat(dayMatch[1]!.replace(',', '.'));
			return Math.round(days * 8 * 60);
		}

		// Handle plain numbers (assume minutes)
		const numberMatch = timeStr.match(/^(\d+(?:[.,]\d+)?)$/);
		if (numberMatch) {
			return Math.round(Number.parseFloat(numberMatch[1]!.replace(',', '.')));
		}

		// Default fallback
		return 0;
	}

	/**
	 * Get duration in minutes
	 */
	toMinutes(): number {
		return this.minutes;
	}

	/**
	 * Get duration in hours (decimal)
	 */
	toHours(): number {
		return this.minutes / 60;
	}

	/**
	 * Format as readable string (e.g., "1h15m", "30m", "2h")
	 */
	toString(): string {
		if (this.minutes === 0) return '0m';

		const hours = Math.floor(this.minutes / 60);
		const remainingMinutes = this.minutes % 60;

		if (hours > 0 && remainingMinutes > 0) {
			return `${hours}h${remainingMinutes}m`;
		}
		if (hours > 0) {
			return `${hours}h`;
		}
		return `${remainingMinutes}m`;
	}

	/**
	 * Create Duration from minutes
	 */
	static fromMinutes(minutes: number): Duration {
		return new Duration(minutes);
	}

	/**
	 * Create Duration from hours
	 */
	static fromHours(hours: number): Duration {
		return new Duration(Math.round(hours * 60));
	}

	/**
	 * Calculate working duration between check-in and check-out times, minus break time
	 * @param checkIn Time in HH:MM format (e.g., "08:00")
	 * @param checkOut Time in HH:MM format (e.g., "17:00")
	 * @param breakMinutes Break time in minutes
	 * @returns Duration object representing working time
	 */
	static calculateWorkingDuration(
		checkIn: string,
		checkOut: string,
		breakMinutes: number = 0,
	): Duration {
		const parseTime = (time: string): number => {
			const [hours, minutes] = time.split(':').map(Number);
			return (hours || 0) * 60 + (minutes || 0);
		};

		const inMinutes = parseTime(checkIn);
		const outMinutes = parseTime(checkOut);
		const totalMinutes = outMinutes - inMinutes;
		const workingMinutes = totalMinutes - breakMinutes;

		return new Duration(Math.max(0, workingMinutes));
	}

	/**
	 * Format as decimal hours string (e.g., "8.25", "7.5", "8")
	 */
	toDecimalHours(): string {
		const decimalHours = this.minutes / 60;
		return decimalHours.toFixed(2).replace(/\.?0+$/, ''); // Remove trailing zeros
	}
}
