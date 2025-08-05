import type {WeeklyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';
import type {FavoriteIssue} from '../jira-client.js';
import {LocalDate} from '../domain/LocalDate.js';

export type IssueData = {
	summary: string;
	dailyHours: Record<string, number>;
	weekTotal: number;
};

export function generateWeekDates(weekStart: LocalDate): LocalDate[] {
	const mondayStart = weekStart.getWeekStart();

	// Only generate weekdays (Monday to Friday) using LocalDate arithmetic
	return Array.from({length: 5}, (_, i) => mondayStart.addDays(i));
}

/**
 * @deprecated Use generateWeekDates with LocalDate instead
 */
export function generateWeekDatesFromDate(weekStart: Date): Date[] {
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
			const issueKeyString = issue.issueKey.toString();
			if (!issueMap[issueKeyString]) {
				issueMap[issueKeyString] = {
					summary: issue.issueSummary,
					dailyHours: {},
					weekTotal: 0,
				};
			}

			issueMap[issueKeyString]!.dailyHours[dateKey] =
				(issueMap[issueKeyString]!.dailyHours[dateKey] ?? 0) + issue.hours;
			issueMap[issueKeyString]!.weekTotal += issue.hours;
		}
	}

	return issueMap;
}

export function buildIssueMapFromFavorites(
	favoriteIssues: FavoriteIssue[],
): Record<string, IssueData> {
	const issueMap: Record<string, IssueData> = {};

	for (const favorite of favoriteIssues) {
		issueMap[favorite.key.toString()] = {
			summary: `Favorite: ${favorite.key.toString()}`,
			dailyHours: {},
			weekTotal: 0,
		};
	}

	return issueMap;
}
