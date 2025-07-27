import type {WeeklyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';
import type {FavoriteIssue} from '../jira-client.js';
import {LocalDate} from '../domain/LocalDate.js';

export type IssueData = {
	summary: string;
	dailyHours: Record<string, number>;
	weekTotal: number;
};

export function generateWeekDates(weekStart: Date): Date[] {
	const mondayStart = LocalDate.fromDate(weekStart).getWeekStart();

	// Only generate weekdays (Monday to Friday) using LocalDate arithmetic
	return Array.from({length: 5}, (_, i) => {
		const localDate = mondayStart.addDays(i);
		return new Date(localDate.toISOString() + 'T00:00:00.000Z');
	});
}

export function buildIssueMap(
	data: WeeklyWorklogSummary,
): Record<string, IssueData> {
	const issueMap: Record<string, IssueData> = {};

	// Process all worklog data (includes favorites with 0 hours from WeeklyWorklogSummaryUseCase)
	for (const dailySummary of data.dailySummaries) {
		const dateKey = dailySummary.date.toISOString();

		for (const issue of dailySummary.issues) {
			if (!issueMap[issue.issueKey]) {
				issueMap[issue.issueKey] = {
					summary: issue.issueSummary,
					dailyHours: {},
					weekTotal: 0,
				};
			}

			issueMap[issue.issueKey]!.dailyHours[dateKey] =
				(issueMap[issue.issueKey]!.dailyHours[dateKey] ?? 0) + issue.hours;
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
