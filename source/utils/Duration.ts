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

		const timeStr = input.trim();
		if (!timeStr) return 0;

		// Handle combined format (2h30m, 1h15m, etc.)
		const combinedMatch = timeStr.match(
			/^(\d+(?:[.,]\d+)?)h(\d+(?:[.,]\d+)?)m$/i,
		);
		if (combinedMatch) {
			const hours = parseFloat(combinedMatch[1]!.replace(',', '.'));
			const minutes = parseFloat(combinedMatch[2]!.replace(',', '.'));
			return Math.round(hours * 60 + minutes);
		}

		// Handle hours only (1h, 2.5h, etc.)
		const hourMatch = timeStr.match(/^(\d+(?:[.,]\d+)?)h$/i);
		if (hourMatch) {
			const hours = parseFloat(hourMatch[1]!.replace(',', '.'));
			return Math.round(hours * 60);
		}

		// Handle minutes only (30m, 45m, etc.)
		const minuteMatch = timeStr.match(/^(\d+(?:[.,]\d+)?)m$/i);
		if (minuteMatch) {
			const minutes = parseFloat(minuteMatch[1]!.replace(',', '.'));
			return Math.round(minutes);
		}

		// Handle days (1d = 8h = 480m)
		const dayMatch = timeStr.match(/^(\d+(?:[.,]\d+)?)d$/i);
		if (dayMatch) {
			const days = parseFloat(dayMatch[1]!.replace(',', '.'));
			return Math.round(days * 8 * 60);
		}

		// Handle plain numbers (assume minutes)
		const numberMatch = timeStr.match(/^(\d+(?:[.,]\d+)?)$/);
		if (numberMatch) {
			return Math.round(parseFloat(numberMatch[1]!.replace(',', '.')));
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
		} else if (hours > 0) {
			return `${hours}h`;
		} else {
			return `${remainingMinutes}m`;
		}
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
}
