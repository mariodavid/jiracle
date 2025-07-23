import type {WeeklyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';
import type {FavoriteIssue} from '../jira-client.js';
import {formatLocalDateKey} from './date.js';

export type IssueData = {
	summary: string;
	dailyHours: Record<string, number>;
	weekTotal: number;
};

export function generateWeekDates(weekStart: Date): Date[] {
	const dates: Date[] = [];
	const current = new Date(weekStart);

	// Get Monday of the week (same logic as AttendanceCalculations.getWeekDates)
	const day = current.getDay();
	const diff = current.getDate() - day + (day === 0 ? -6 : 1);
	current.setDate(diff);

	// Only generate weekdays (Monday to Friday)
	for (let i = 0; i < 5; i++) {
		const date = new Date(current);
		dates.push(date);
		current.setDate(current.getDate() + 1);
	}

	return dates;
}

export function buildIssueMap(
	data: WeeklyWorklogSummary,
): Record<string, IssueData> {
	const issueMap: Record<string, IssueData> = {};

	// Process all worklog data (includes favorites with 0 hours from WeeklyWorklogSummaryUseCase)
	for (const dailySummary of data.dailySummaries) {
		const dateKey = formatLocalDateKey(dailySummary.date);

		for (const issue of dailySummary.issues) {
			if (!issueMap[issue.issueKey]) {
				issueMap[issue.issueKey] = {
					summary: issue.issueSummary,
					dailyHours: {},
					weekTotal: 0,
				};
			}

			issueMap[issue.issueKey]!.dailyHours[dateKey] =
				(issueMap[issue.issueKey]!.dailyHours[dateKey] || 0) + issue.hours;
			issueMap[issue.issueKey]!.weekTotal += issue.hours;
		}
	}

	return issueMap;
}

export function buildIssueMapFromFavorites(
	favoriteIssues: FavoriteIssue[],
): Record<string, IssueData> {
	const issueMap: Record<string, IssueData> = {};

	for (const favorite of favoriteIssues) {
		issueMap[favorite.key] = {
			summary: `Favorite: ${favorite.key}`,
			dailyHours: {},
			weekTotal: 0,
		};
	}

	return issueMap;
}
