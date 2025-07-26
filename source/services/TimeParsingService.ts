import {Duration} from '../domain/Duration.js';

/**
 * Parse time strings to Duration object
 * @param timeString - Time string (e.g., "2h30m", "1.5h", "90m", "1d")
 * @returns Duration object
 */
function parseTimeToDuration(timeString: string): Duration {
	if (!timeString) return new Duration('1h');

	try {
		return Duration.parseOrThrow(timeString);
	} catch {
		return new Duration('1h');
	}
}

/**
 * Parse time strings to hours (legacy compatibility)
 * @param timeString - Time string (e.g., "2h30m", "1.5h", "90m", "1d")
 * @returns Number of hours
 */
function parseTimeToHours(timeString: string): number {
	return parseTimeToDuration(timeString).toHours();
}

/**
 * Normalize time string on submission using Duration parsing
 * @param inputValue - Raw input value
 * @returns Normalized time string
 */
function normalizeTimeString(inputValue: string): string {
	let normalizedValue = inputValue;

	// Convert comma to dot (German decimal separator)
	if (normalizedValue.includes(',')) {
		normalizedValue = normalizedValue.replace(/,/g, '.');
	}

	// If user just entered numbers, add unit based on smart logic
	if (/^\d+([.,]\d+)?$/.test(normalizedValue)) {
		const hasDecimal = /[.,]/.test(normalizedValue);
		const numericValue = Number.parseFloat(normalizedValue.replace(',', '.'));

		// Smart unit selection:
		// - If has decimal (1.5, 2,5): always hours
		// - If >= 10: likely minutes
		// - If < 10: likely hours
		const smartUnit = hasDecimal ? 'h' : numericValue >= 10 ? 'm' : 'h';
		normalizedValue += smartUnit;
	}

	// If user entered h+digits (like "2h5"), add 'm' automatically
	if (/^\d+h\d+$/.test(normalizedValue)) {
		normalizedValue += 'm';
	}

	// Final cleanup: ensure any remaining commas are converted to dots
	normalizedValue = normalizedValue.replace(/,/g, '.');

	// Validate and normalize through Duration parsing
	try {
		const duration = Duration.parseOrThrow(normalizedValue);
		return duration.toString();
	} catch {
		// If parsing fails, return original value
		return normalizedValue;
	}
}

/**
 * Generate time adjustment marks based on increment
 * @param incrementMinutes - Minutes to increment by
 * @returns Array of minute marks
 */
function generateTimeMarks(incrementMinutes: number): number[] {
	const marks = [];
	for (let min = 0; min <= 24 * 60; min += incrementMinutes) {
		marks.push(min);
	}

	return marks;
}

/**
 * Adjust time up or down to nearest increment using Duration
 * @param currentTimeString - Current time string
 * @param direction - 'up' or 'down'
 * @param incrementMinutes - Minutes to increment by
 * @returns New time string
 */
function adjustTime(
	currentTimeString: string,
	direction: 'up' | 'down',
	incrementMinutes: number,
): string {
	const currentDuration = parseTimeToDuration(currentTimeString);
	const totalMinutes = currentDuration.toMinutes();

	const marks = generateTimeMarks(incrementMinutes);

	let newTotalMinutes: number;
	if (direction === 'up') {
		// Find next mark that's greater than current
		newTotalMinutes = marks.find(mark => mark > totalMinutes) ?? totalMinutes;
	} else {
		// Find previous mark that's less than current
		newTotalMinutes =
			marks.reverse().find(mark => mark < totalMinutes) ?? incrementMinutes;
		marks.reverse(); // Restore original order
	}

	// Ensure minimum value
	newTotalMinutes = Math.max(newTotalMinutes, incrementMinutes);

	// Create new Duration from minutes and return string representation
	return Duration.fromMinutes(newTotalMinutes).toString();
}

export const TimeParsingService = {
	parseTimeToDuration,
	parseTimeToHours,
	normalizeTimeString,
	generateTimeMarks,
	adjustTime,
} as const;
