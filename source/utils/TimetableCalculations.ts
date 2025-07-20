import {WeeklyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';
import {formatLocalDateKey} from './date.js';

export function calculateDailyTotals(
	data: WeeklyWorklogSummary,
	weekDates: Date[],
): number[] {
	const totals: number[] = new Array(5).fill(0);

	data.dailySummaries.forEach(dailySummary => {
		const dateKey = formatLocalDateKey(dailySummary.date);
		const dayIndex = weekDates.findIndex(
			date => formatLocalDateKey(date) === dateKey,
		);

		if (dayIndex >= 0) {
			totals[dayIndex] = dailySummary.totalHours;
		}
	});

	return totals;
}

export function formatHours(hours: number): string {
	if (hours === 0) {
		return '-';
	}

	return hours.toFixed(1);
}

export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}

	if (maxLength <= 3) {
		return '...';
	}

	return text.slice(0, Math.max(0, maxLength - 3)) + '...';
}

export function getCurrentDayIndex(): number {
	const today = new Date();
	const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
	return dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0
}

export function getDefaultFocusId(issueMap: Record<string, any>): string {
	const currentDayIndex = getCurrentDayIndex();
	const firstIssueKey = Object.keys(issueMap)[0];

	if (firstIssueKey) {
		return `issue-${firstIssueKey}-${currentDayIndex}`;
	}

	return '';
}
