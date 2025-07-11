import {JiraClient, type FavoriteIssue} from '../jira-client.js';
import {formatLocalDateKey} from '../utils/date.js';
import {
	WeeklyWorklogSummary,
	DailyWorklogSummary,
	IssueWorklogEntry,
	IssueWithWorklogs,
} from '../domain/WeeklyWorklogSummary.js';

export class WeeklyWorklogSummaryUseCase {
	constructor(private jiraClient: JiraClient) {}

	async execute(
		weekStart: Date,
		weekEnd: Date,
		userEmail?: string,
		favoriteIssues?: FavoriteIssue[],
	): Promise<WeeklyWorklogSummary> {
		// Build JQL query for issues with worklogs in the date range
		const jql = this.buildJqlQuery(weekStart, weekEnd);

		// Get current user's email for filtering (use provided email or fetch from API)
		const currentUserEmail =
			userEmail || (await this.jiraClient.getCurrentUser()).emailAddress;

		// Search for issues with worklogs in the date range
		const searchResult = await this.jiraClient.searchIssuesWithWorklogs(jql);

		// Fetch favorite issues details if provided
		const favoriteIssuesData =
			favoriteIssues && favoriteIssues.length > 0
				? await this.jiraClient.fetchFavoriteIssues(favoriteIssues)
				: [];

		// Merge worklogged issues with favorite issues (avoid duplicates)
		const allIssueKeys = new Set([
			...searchResult.issues.map(issue => issue.key),
			...favoriteIssuesData.map(issue => issue.key),
		]);

		// Fetch detailed worklogs for each issue
		const issuesWithWorklogs: IssueWithWorklogs[] = await Promise.all(
			Array.from(allIssueKeys).map(async issueKey => {
				// Find issue data from either worklogs search or favorites
				const worklogIssue = searchResult.issues.find(
					issue => issue.key === issueKey,
				);
				const favoriteIssue = favoriteIssuesData.find(
					issue => issue.key === issueKey,
				);

				const issueData = worklogIssue || favoriteIssue;
				if (!issueData) {
					throw new Error(`Issue data not found for ${issueKey}`);
				}

				const worklogResponse = await this.jiraClient.getIssueWorklogs(
					issueKey,
				);
				return {
					issue: {
						id: issueData.id,
						key: issueData.key,
						fields: {
							summary: issueData.fields.summary,
						},
					},
					worklogs: worklogResponse.worklogs,
				};
			}),
		);

		// Aggregate worklogs by day
		const dailySummaries = this.aggregateWorklogsByDay(
			issuesWithWorklogs,
			weekStart,
			weekEnd,
			currentUserEmail,
		);

		// Add favorite issues without worklogs to the first available day (for display purposes)
		if (favoriteIssues && favoriteIssues.length > 0) {
			this.addFavoriteIssuesWithoutWorklogs(
				dailySummaries,
				issuesWithWorklogs,
				favoriteIssuesData,
				weekStart,
			);
		}

		// Calculate week total
		const weekTotal = dailySummaries.reduce(
			(sum, day) => sum + day.totalHours,
			0,
		);

		return {
			weekStart,
			weekEnd,
			dailySummaries,
			weekTotal,
		};
	}

	private buildJqlQuery(weekStart: Date, weekEnd: Date): string {
		const startDate = this.formatDateForJql(weekStart);
		const endDate = this.formatDateForJql(weekEnd);

		return `worklogAuthor = currentUser() AND worklogDate >= "${startDate}" AND worklogDate <= "${endDate}"`;
	}

	private formatDateForJql(date: Date): string {
		return date.toISOString().split('T')[0]!; // YYYY-MM-DD format
	}

	private aggregateWorklogsByDay(
		issuesWithWorklogs: IssueWithWorklogs[],
		weekStart: Date,
		weekEnd: Date,
		currentUserEmail: string,
	): DailyWorklogSummary[] {
		const dailyWorklogMap = new Map<string, DailyWorklogSummary>();

		issuesWithWorklogs.forEach(({issue, worklogs}) => {
			worklogs
				.filter(worklog =>
					this.isWorklogInDateRange(worklog.started, weekStart, weekEnd),
				)
				.filter(worklog => worklog.author.emailAddress === currentUserEmail)
				.forEach(worklog => {
					const worklogDate = new Date(worklog.started);
					// Use local date instead of UTC date for consistency with week calculation
					const localDateKey = formatLocalDateKey(worklogDate);
					const hours = worklog.timeSpentSeconds / 3600; // Convert seconds to hours

					const issueEntry: IssueWorklogEntry = {
						issueKey: issue.key,
						issueSummary: issue.fields.summary,
						hours,
					};

					const existingSummary = dailyWorklogMap.get(localDateKey);
					if (existingSummary) {
						existingSummary.issues.push(issueEntry);
						dailyWorklogMap.set(localDateKey, {
							...existingSummary,
							totalHours: existingSummary.totalHours + hours,
						});
					} else {
						dailyWorklogMap.set(localDateKey, {
							date: worklogDate,
							totalHours: hours,
							issues: [issueEntry],
						});
					}
				});
		});

		// Convert map to sorted array
		return Array.from(dailyWorklogMap.values()).sort(
			(a, b) => a.date.getTime() - b.date.getTime(),
		);
	}

	private isWorklogInDateRange(
		worklogStarted: string,
		weekStart: Date,
		weekEnd: Date,
	): boolean {
		const worklogDate = new Date(worklogStarted);
		return worklogDate >= weekStart && worklogDate <= weekEnd;
	}

	private addFavoriteIssuesWithoutWorklogs(
		dailySummaries: DailyWorklogSummary[],
		issuesWithWorklogs: IssueWithWorklogs[],
		favoriteIssuesData: any[],
		weekStart: Date,
	): void {
		// Find favorite issues that have no worklogs
		const issueKeysWithWorklogs = new Set(
			issuesWithWorklogs
				.filter(iwl => iwl.worklogs.length > 0)
				.map(iwl => iwl.issue.key),
		);

		const favoriteIssuesWithoutWorklogs = favoriteIssuesData.filter(
			favorite => !issueKeysWithWorklogs.has(favorite.key),
		);

		if (favoriteIssuesWithoutWorklogs.length === 0) {
			return;
		}

		// Create or use first day to add favorite issues with 0 hours
		if (dailySummaries.length === 0) {
			// No worklogs at all, create a summary for the first day of the week
			dailySummaries.push({
				date: new Date(weekStart),
				totalHours: 0,
				issues: [],
			});
		}

		// Add favorite issues with 0 hours to the first day
		const firstDay = dailySummaries[0]!;
		favoriteIssuesWithoutWorklogs.forEach(favorite => {
			firstDay.issues.push({
				issueKey: favorite.key,
				issueSummary: favorite.fields.summary,
				hours: 0,
			});
		});
	}
}
