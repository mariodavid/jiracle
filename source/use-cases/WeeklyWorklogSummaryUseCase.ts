import {
	type JiraClient,
	type FavoriteIssue,
	type JiraIssue,
	type WorklogEntry,
} from '../jira-client.js';
import {LocalDate} from '../domain/LocalDate.js';
import {uiLogger} from '../utils/logger.js';
import {
	type WeeklyWorklogSummary,
	type DailyWorklogSummary,
	type IssueWorklogEntry,
	type IssueWithWorklogs,
} from '../domain/WeeklyWorklogSummary.js';

export type ExecuteWeeklyWorklogSummaryOptions = {
	weekStart: Date;
	weekEnd: Date;
	userEmail?: string;
	favoriteIssues?: FavoriteIssue[];
	slidingWindowConfig?: {past: number; future: number};
};

export class WeeklyWorklogSummaryUseCase {
	constructor(private readonly jiraClient: JiraClient) {}

	async execute(
		options: ExecuteWeeklyWorklogSummaryOptions,
	): Promise<WeeklyWorklogSummary> {
		const {weekStart, weekEnd, userEmail, favoriteIssues, slidingWindowConfig} =
			options;
		// Build JQL query for issues with worklogs in the date range
		const jql = this.buildJqlQuery(weekStart, weekEnd);

		// Get current user's email for filtering (use provided email or fetch from API)
		const currentUser = await this.jiraClient.getCurrentUser();
		const currentUserEmail = userEmail ?? currentUser.emailAddress;

		// Search for issues with worklogs in the date range
		const searchResult = await this.jiraClient.searchIssuesWithWorklogs(jql);

		// If sliding window is configured, fetch additional issues from the window period
		let slidingWindowSearchResult: {issues: JiraIssue[]} = {issues: []};
		if (
			slidingWindowConfig &&
			(slidingWindowConfig.past > 0 || slidingWindowConfig.future > 0)
		) {
			const pastDays = slidingWindowConfig.past;
			const futureDays = slidingWindowConfig.future;

			// Calculate window start from the week start (past sliding window)
			const weekStartLocal = LocalDate.fromDate(weekStart);
			const windowStartLocal = weekStartLocal.addDays(-pastDays);
			const windowStart = new Date(
				windowStartLocal.toISOString() + 'T00:00:00.000Z',
			);

			// Calculate window end from the week end (future sliding window)
			const weekEndLocal = LocalDate.fromDate(weekEnd);
			const windowEndLocal = weekEndLocal.addDays(futureDays);
			const windowEnd = new Date(
				windowEndLocal.toISOString() + 'T23:59:59.999Z',
			);

			uiLogger.debug('Sliding window configured', {
				pastDays,
				futureDays,
				windowStart: windowStartLocal.toISOString(),
				windowEnd: windowEndLocal.toISOString(),
				weekStart: weekStartLocal.toISOString(),
				weekEnd: weekEndLocal.toISOString(),
			});

			// Search for issues in the extended sliding window, excluding the current week
			const pastSearchResults =
				pastDays > 0
					? await this.fetchSlidingWindowIssues(
							windowStart,
							new Date(
								weekStartLocal.addDays(-1).toISOString() + 'T23:59:59.999Z',
							),
					  )
					: {issues: []};
			const futureSearchResults =
				futureDays > 0
					? await this.fetchSlidingWindowIssues(
							new Date(
								weekEndLocal.addDays(1).toISOString() + 'T00:00:00.000Z',
							),
							windowEnd,
					  )
					: {issues: []};

			// Merge past and future results, avoiding duplicates
			const allSlidingWindowIssues: JiraIssue[] = [
				...pastSearchResults.issues,
				...futureSearchResults.issues.filter(
					futureIssue =>
						!pastSearchResults.issues.some(
							pastIssue => pastIssue.key === futureIssue.key,
						),
				),
			];

			slidingWindowSearchResult = {issues: allSlidingWindowIssues};

			uiLogger.debug('Sliding window search completed', {
				foundPastIssues: pastSearchResults.issues.length,
				foundFutureIssues: futureSearchResults.issues.length,
				totalSlidingWindowIssues: slidingWindowSearchResult.issues.length,
				issueKeys: slidingWindowSearchResult.issues.map(
					(issue: JiraIssue): string => issue.key,
				),
			});
		}

		// Fetch favorite issues details if provided
		const favoriteIssuesData =
			favoriteIssues && favoriteIssues.length > 0
				? await this.jiraClient.fetchFavoriteIssues(favoriteIssues)
				: [];

		// Merge worklogged issues, sliding window issues, and favorite issues (avoid duplicates)
		const allIssueKeys = new Set([
			...searchResult.issues.map((issue: JiraIssue): string => issue.key),
			...slidingWindowSearchResult.issues.map(
				(issue: JiraIssue): string => issue.key,
			),
			...favoriteIssuesData.map((issue: JiraIssue): string => issue.key),
		]);

		uiLogger.debug('Issue collection summary', {
			currentWeekIssues: searchResult.issues.length,
			slidingWindowIssues: slidingWindowSearchResult.issues.length,
			favoriteIssues: favoriteIssuesData.length,
			totalUniqueIssues: allIssueKeys.size,
		});

		// Fetch detailed worklogs for each issue
		const issuesWithWorklogs: IssueWithWorklogs[] = await Promise.all(
			[...allIssueKeys].map(async issueKey => {
				// Find issue data from either worklogs search, sliding window search, or favorites
				const worklogIssue: JiraIssue | undefined = searchResult.issues.find(
					issue => issue.key === issueKey,
				);
				const slidingWindowIssue: JiraIssue | undefined =
					slidingWindowSearchResult.issues.find(
						issue => issue.key === issueKey,
					);
				const favoriteIssue = favoriteIssuesData.find(
					issue => issue.key === issueKey,
				);

				const issueData = worklogIssue ?? slidingWindowIssue ?? favoriteIssue;
				if (!issueData) {
					throw new Error(`Issue data not found for ${issueKey}`);
				}

				// For favorites that don't have full issue data, fetch it
				const fullIssueData: JiraIssue =
					'id' in issueData && 'fields' in issueData
						? issueData
						: await this.jiraClient.fetchIssue(issueKey);

				const worklogResponse = await this.jiraClient.getIssueWorklogs(
					issueKey,
				);
				return {
					issue: {
						id: fullIssueData.id,
						key: fullIssueData.key,
						fields: {
							summary: fullIssueData.fields.summary,
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

		// Add sliding window issues without current week worklogs to the first available day
		if (slidingWindowSearchResult.issues.length > 0) {
			this.addSlidingWindowIssuesWithoutWorklogs({
				dailySummaries,
				issuesWithWorklogs,
				slidingWindowIssues: slidingWindowSearchResult.issues,
				favoriteIssuesData,
				weekStart,
			});
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

	private async fetchSlidingWindowIssues(
		startDate: Date,
		endDate: Date,
	): Promise<{issues: JiraIssue[]}> {
		const dateRange = {
			from: startDate.toISOString().split('T')[0],
			to: endDate.toISOString().split('T')[0],
		};

		uiLogger.debug('Searching for sliding window issues', {dateRange});

		const windowJql = this.buildJqlQuery(startDate, endDate);
		return this.jiraClient.searchIssuesWithWorklogs(windowJql);
	}

	private aggregateWorklogsByDay(
		issuesWithWorklogs: IssueWithWorklogs[],
		weekStart: Date,
		weekEnd: Date,
		currentUserEmail: string,
	): DailyWorklogSummary[] {
		const dailyWorklogMap = new Map<string, DailyWorklogSummary>();

		// Track worklogs by issue/date for aggregation logic
		const worklogsByIssueDate = new Map<string, WorklogEntry[]>();

		for (const {issue, worklogs} of issuesWithWorklogs) {
			const filteredWorklogs = worklogs
				.filter(worklog =>
					this.isWorklogInDateRange(worklog.started, weekStart, weekEnd),
				)
				.filter(worklog => worklog.author.emailAddress === currentUserEmail);

			for (const worklog of filteredWorklogs) {
				const worklogDate = new Date(worklog.started);
				const localDateKey = LocalDate.fromDate(worklogDate).toISOString();
				const issueWorklogKey = `${issue.key}|${localDateKey}`;

				// Track worklogs for this issue/date combination
				if (!worklogsByIssueDate.has(issueWorklogKey)) {
					worklogsByIssueDate.set(issueWorklogKey, []);
				}

				worklogsByIssueDate.get(issueWorklogKey)!.push(worklog);
			}
		}

		// Now aggregate by issue/date
		for (const [issueWorklogKey, worklogs] of worklogsByIssueDate.entries()) {
			// Split by pipe character to separate issue key from date
			const [issueKey, localDateKey] = issueWorklogKey.split('|');
			const {issue} = issuesWithWorklogs.find(
				iwl => iwl.issue.key === issueKey,
			)!;
			const totalHours = worklogs.reduce(
				(sum: number, wl): number => sum + wl.timeSpentSeconds / 3600,
				0,
			);

			// Create issue entry with optional worklog ID and comment if there's exactly one worklog
			const issueEntry: IssueWorklogEntry = {
				issueKey: issue.key,
				issueSummary: issue.fields.summary,
				hours: totalHours,
				// Only include worklog ID and comment if there's exactly one worklog for this issue/date
				...(worklogs.length === 1 &&
					worklogs[0] && {
						worklogId: worklogs[0].id,
						comment: worklogs[0].comment,
					}),
			};

			const existingSummary = dailyWorklogMap.get(localDateKey!);
			if (existingSummary) {
				existingSummary.issues.push(issueEntry);
				dailyWorklogMap.set(localDateKey!, {
					...existingSummary,
					totalHours: existingSummary.totalHours + totalHours,
				});
			} else {
				// Get date from the first worklog or fallback to current date
				const worklogDate = worklogs[0]
					? new Date(worklogs[0].started)
					: new Date();
				dailyWorklogMap.set(localDateKey!, {
					date: worklogDate,
					totalHours,
					issues: [issueEntry],
				});
			}
		}

		// Convert map to sorted array
		return [...dailyWorklogMap.values()].sort(
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
		_issuesWithWorklogs: IssueWithWorklogs[],
		favoriteIssuesData: Array<JiraIssue | FavoriteIssue>,
		weekStart: Date,
	): void {
		// Find favorite issues that have no worklogs in current week
		const issueKeysWithCurrentWeekWorklogs = new Set(
			dailySummaries.flatMap(summary =>
				summary.issues.map(issue => issue.issueKey),
			),
		);

		const favoriteIssuesWithoutWorklogs = favoriteIssuesData.filter(
			favorite => !issueKeysWithCurrentWeekWorklogs.has(favorite.key),
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
		for (const favorite of favoriteIssuesWithoutWorklogs) {
			let summary: string;
			if (
				'fields' in favorite &&
				favorite.fields &&
				typeof favorite.fields.summary === 'string'
			) {
				summary = favorite.fields.summary;
			} else if ('alias' in favorite && typeof favorite.alias === 'string') {
				summary = favorite.alias;
			} else {
				summary = favorite.key;
			}

			firstDay.issues.push({
				issueKey: favorite.key,
				issueSummary: summary,
				hours: 0,
			});
		}
	}

	private addSlidingWindowIssuesWithoutWorklogs(options: {
		dailySummaries: DailyWorklogSummary[];
		issuesWithWorklogs: IssueWithWorklogs[];
		slidingWindowIssues: JiraIssue[];
		favoriteIssuesData: Array<JiraIssue | FavoriteIssue>;
		weekStart: Date;
	}): void {
		const {dailySummaries, slidingWindowIssues, favoriteIssuesData, weekStart} =
			options;
		// Find issues that have worklogs in current week or are already favorites
		const issueKeysWithCurrentWeekWorklogs = new Set(
			dailySummaries.flatMap(summary =>
				summary.issues.map(issue => issue.issueKey),
			),
		);
		const favoriteIssueKeys = new Set(
			favoriteIssuesData.map(
				(fav: JiraIssue | FavoriteIssue): string => fav.key,
			),
		);

		const slidingWindowIssuesWithoutCurrentWeekWorklogs =
			slidingWindowIssues.filter(
				issue =>
					!issueKeysWithCurrentWeekWorklogs.has(issue.key) &&
					!favoriteIssueKeys.has(issue.key),
			);

		uiLogger.debug('Adding sliding window issues to timetable', {
			candidateSlidingWindowIssues: slidingWindowIssues.length,
			issuesWithCurrentWorklogs: issueKeysWithCurrentWeekWorklogs.size,
			favoriteIssuesCount: favoriteIssueKeys.size,
			slidingWindowIssuesToAdd:
				slidingWindowIssuesWithoutCurrentWeekWorklogs.length,
			issueKeysToAdd: slidingWindowIssuesWithoutCurrentWeekWorklogs.map(
				(issue: JiraIssue): string => issue.key,
			),
		});

		if (slidingWindowIssuesWithoutCurrentWeekWorklogs.length === 0) {
			return;
		}

		// Create or use first day to add sliding window issues with 0 hours
		if (dailySummaries.length === 0) {
			// No worklogs at all, create a summary for the first day of the week
			dailySummaries.push({
				date: new Date(weekStart),
				totalHours: 0,
				issues: [],
			});
		}

		// Add sliding window issues with 0 hours to the first day
		const firstDay = dailySummaries[0]!;
		for (const issue of slidingWindowIssuesWithoutCurrentWeekWorklogs) {
			firstDay.issues.push({
				issueKey: issue.key,
				issueSummary: issue.fields.summary,
				hours: 0,
			});
		}
	}
}
