import {JiraClient} from '../jira-client.js';
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
	): Promise<WeeklyWorklogSummary> {
		// Build JQL query for issues with worklogs in the date range
		const jql = this.buildJqlQuery(weekStart, weekEnd);

		// Get current user's email for filtering (use provided email or fetch from API)
		const currentUserEmail =
			userEmail || (await this.jiraClient.getCurrentUser()).emailAddress;

		// Search for issues with worklogs in the date range
		const searchResult = await this.jiraClient.searchIssuesWithWorklogs(jql);

		// Fetch detailed worklogs for each issue
		const issuesWithWorklogs: IssueWithWorklogs[] = await Promise.all(
			searchResult.issues.map(async issue => {
				const worklogResponse = await this.jiraClient.getIssueWorklogs(
					issue.key,
				);
				return {
					issue: {
						id: issue.id,
						key: issue.key,
						fields: {
							summary: issue.fields.summary,
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
}
