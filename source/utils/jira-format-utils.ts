import {Duration} from './duration.js';

export function normalizeTimeFormat(timeString: string): string {
	try {
		// Handle decimal formats with comma - convert comma to dot but preserve decimal format
		const decimalHourMatch = /^(\d+(?:,\d+)?)h$/i.exec(timeString);
		if (decimalHourMatch) {
			return decimalHourMatch[1]!.replace(',', '.') + 'h';
		}

		const duration = new Duration(timeString);
		const minutes = duration.toMinutes();

		if (minutes <= 0) {
			return '';
		}

		// Convert to Jira format with space (e.g., "2h 30m")
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;

		if (hours > 0 && remainingMinutes > 0) {
			return `${hours}h ${remainingMinutes}m`;
		}

		if (hours > 0) {
			return `${hours}h`;
		}

		return `${remainingMinutes}m`;
	} catch {
		return '';
	}
}

export function extractIssueKeyFromInput(input: string): string | undefined {
	// Trim whitespace
	const trimmed = input.trim();

	if (!trimmed) {
		return undefined;
	}

	// Check if it's a URL
	if (trimmed.includes('/browse/')) {
		// Extract issue key from URL like https://jira.example.com/browse/DEF-2457
		const match = /\/browse\/([A-Z]+-\d+)/.exec(trimmed);
		if (match?.[1]) {
			return match[1];
		}

		// If it contains /browse/ but no valid issue key, it's invalid
		return undefined;
	}

	// Check if it's already an issue key (PROJECT-123 format)
	const issueKeyMatch = /^([A-Z]+-\d+)$/.exec(trimmed);
	if (issueKeyMatch?.[1]) {
		return issueKeyMatch[1];
	}

	// If no pattern matches, it's invalid
	return undefined;
}
