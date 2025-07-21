/**
 * Parse time strings to hours
 * @param timeStr - Time string (e.g., "2h30m", "1.5h", "90m", "1d")
 * @returns Number of hours
 */
function parseTimeToHours(timeStr: string): number {
	if (!timeStr) return 1;

	// Handle combined format (2h30m, 1h15m, etc.)
	const combinedMatch = timeStr.match(/^(\d+)h(\d+)m$/i);
	if (combinedMatch?.[1] && combinedMatch[2]) {
		const hours = Number.parseFloat(combinedMatch[1]);
		const minutes = Number.parseFloat(combinedMatch[2]);
		return hours + minutes / 60;
	}

	// Handle days (1d = 8h)
	const dayMatch = timeStr.match(/^(\d+(?:[.,]\d+)?)d$/i);
	if (dayMatch?.[1]) {
		return Number.parseFloat(dayMatch[1].replace(',', '.')) * 8;
	}

	// Handle hours (1h, 2.5h, etc.)
	const hourMatch = timeStr.match(/^(\d+(?:[.,]\d+)?)h?$/i);
	if (hourMatch?.[1]) {
		return Number.parseFloat(hourMatch[1].replace(',', '.'));
	}

	// Handle minutes (30m, 90m, etc.)
	const minuteMatch = timeStr.match(/^(\d+)m$/i);
	if (minuteMatch?.[1]) {
		return Number.parseFloat(minuteMatch[1]) / 60;
	}

	// Default to 1 hour if unparseable
	return 1;
}

/**
 * Normalize time string on submission
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

	return normalizedValue;
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
 * Adjust time up or down to nearest increment
 * @param currentTimeStr - Current time string
 * @param direction - 'up' or 'down'
 * @param incrementMinutes - Minutes to increment by
 * @returns New time string
 */
function adjustTime(
	currentTimeStr: string,
	direction: 'up' | 'down',
	incrementMinutes: number,
): string {
	const currentHours = parseTimeToHours(currentTimeStr);
	const totalMinutes = Math.round(currentHours * 60);

	const marks = generateTimeMarks(incrementMinutes);

	let newTotalMinutes: number;
	if (direction === 'up') {
		// Find next mark that's greater than current
		newTotalMinutes = marks.find(mark => mark > totalMinutes) || totalMinutes;
	} else {
		// Find previous mark that's less than current
		newTotalMinutes =
			marks.reverse().find(mark => mark < totalMinutes) || incrementMinutes;
		marks.reverse(); // Restore original order
	}

	// Ensure minimum value
	newTotalMinutes = Math.max(newTotalMinutes, incrementMinutes);

	// Convert back to appropriate format
	const hours = Math.floor(newTotalMinutes / 60);
	const minutes = newTotalMinutes % 60;

	let timeString: string;
	if (hours > 0 && minutes > 0) {
		timeString = `${hours}h${minutes}m`;
	} else if (hours > 0) {
		timeString = `${hours}h`;
	} else {
		timeString = `${minutes}m`;
	}

	return timeString;
}

export const TimeParsingService = {
	parseTimeToHours,
	normalizeTimeString,
	generateTimeMarks,
	adjustTime,
} as const;
