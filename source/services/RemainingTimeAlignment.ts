import type {
	AlignRemainingStrategy,
	DefaultStory,
	JiraConfig,
} from '../jira-client.js';
import {validateDefaultStories, resolveDefaults} from '../jira-client.js';
import type {
	DailyWorklogSummary,
	IssueWorklogEntry,
} from '../domain/WeeklyWorklogSummary.js';
import type {Attendance} from '../attendance/types.js';
import {uiLogger} from '../utils/logger.js';

export interface AlignmentResult {
	updatedIssues: Array<{
		issueKey: string;
		newHours: number;
		oldHours: number;
		diff: number;
	}>;
	totalDistributed: number;
	message: string;
}

export interface CreateWorklogsResult {
	createdWorklogs: Array<{
		issueKey: string;
		hours: number;
		comment: string;
		percentage: number;
	}>;
	totalDistributed: number;
	message: string;
}

export interface AlignmentError {
	type:
		| 'no-attendance'
		| 'no-worklogs'
		| 'no-remaining'
		| 'calculation-error'
		| 'invalid-config';
	message: string;
}

export class RemainingTimeAlignment {
	/**
	 * Calculates how to distribute remaining time across existing worklogs
	 */
	static calculateAlignment(
		attendance: Attendance | null,
		dailySummary: DailyWorklogSummary | null,
		strategy: AlignRemainingStrategy = 'even',
	): AlignmentResult | AlignmentError {
		uiLogger.debug('RemainingTimeAlignment.calculateAlignment START', {
			attendance,
			dailySummary,
			strategy,
		});

		// Validate inputs
		if (!attendance || !attendance.totalHours) {
			uiLogger.debug('No attendance data found', {attendance});
			return {
				type: 'no-attendance',
				message: 'No attendance data found for this date',
			};
		}

		if (!dailySummary || dailySummary.issues.length === 0) {
			uiLogger.debug('No worklogs found', {dailySummary});
			return {
				type: 'no-worklogs',
				message: 'No worklogs found for this date',
			};
		}

		const attendanceHours = attendance.totalHours;
		const currentWorklogHours = dailySummary.totalHours;
		const remainingHours = attendanceHours - currentWorklogHours;

		uiLogger.debug('Alignment calculation details', {
			attendanceHours,
			currentWorklogHours,
			remainingHours,
			issues: dailySummary.issues.map(i => ({key: i.issueKey, hours: i.hours})),
		});

		// Check if there's any time to distribute
		if (Math.abs(remainingHours) < 0.01) {
			uiLogger.debug('No remaining time to distribute', {
				remainingHours,
				threshold: 0.01,
			});
			return {
				type: 'no-remaining',
				message: 'No remaining time to distribute',
			};
		}

		// Filter to only include issues with existing worklogs (hours > 0)
		const issuesWithWorklogs = dailySummary.issues.filter(
			issue => issue.hours > 0,
		);

		uiLogger.debug('Filtering issues for distribution', {
			totalIssues: dailySummary.issues.length,
			issuesWithWorklogs: issuesWithWorklogs.length,
			filteredIssues: issuesWithWorklogs.map(i => ({
				key: i.issueKey,
				hours: i.hours,
			})),
		});

		if (issuesWithWorklogs.length === 0) {
			uiLogger.debug('No existing worklogs to update');
			return {
				type: 'no-worklogs',
				message: 'No existing worklogs found to update',
			};
		}

		const updatedIssues = this.distributeTime(
			issuesWithWorklogs,
			remainingHours,
			strategy,
		);

		uiLogger.debug('Distribution result', {
			updatedIssues: updatedIssues.map(i => ({
				issueKey: i.issueKey,
				oldHours: i.oldHours,
				newHours: i.newHours,
				diff: i.diff,
			})),
		});

		const totalDistributed = updatedIssues.reduce(
			(sum, issue) => sum + issue.diff,
			0,
		);

		const strategyName = strategy === 'even' ? 'evenly' : 'proportionally';
		const message = `Remaining ${remainingHours.toFixed(
			2,
		)}h distributed ${strategyName} across ${updatedIssues.length} worklogs`;

		uiLogger.info('Alignment calculation completed', {
			totalDistributed,
			strategy: strategyName,
			remainingHours,
			updatedIssuesCount: updatedIssues.length,
			message,
		});

		return {
			updatedIssues,
			totalDistributed,
			message,
		};
	}

	/**
	 * Distributes remaining time across issues based on strategy
	 */
	private static distributeTime(
		issues: IssueWorklogEntry[],
		remainingHours: number,
		strategy: AlignRemainingStrategy,
	): Array<{
		issueKey: string;
		newHours: number;
		oldHours: number;
		diff: number;
	}> {
		return strategy === 'even'
			? this.distributeEvenly(issues, remainingHours)
			: this.distributeProportionally(issues, remainingHours);
	}

	/**
	 * Distributes time evenly across all issues
	 */
	private static distributeEvenly(
		issues: IssueWorklogEntry[],
		remainingHours: number,
	): Array<{
		issueKey: string;
		newHours: number;
		oldHours: number;
		diff: number;
	}> {
		const perIssue = remainingHours / issues.length;

		return issues.map(issue => ({
			issueKey: issue.issueKey,
			oldHours: issue.hours,
			newHours: Math.max(0, issue.hours + perIssue), // Ensure non-negative
			diff: perIssue,
		}));
	}

	/**
	 * Distributes time proportionally based on existing worklog hours
	 */
	private static distributeProportionally(
		issues: IssueWorklogEntry[],
		remainingHours: number,
	): Array<{
		issueKey: string;
		newHours: number;
		oldHours: number;
		diff: number;
	}> {
		const totalCurrentHours = issues.reduce(
			(sum, issue) => sum + issue.hours,
			0,
		);

		// If no current hours, fall back to even distribution
		if (totalCurrentHours === 0) {
			return this.distributeEvenly(issues, remainingHours);
		}

		return issues.map(issue => {
			const proportion = issue.hours / totalCurrentHours;
			const diff = remainingHours * proportion;
			return {
				issueKey: issue.issueKey,
				oldHours: issue.hours,
				newHours: Math.max(0, issue.hours + diff), // Ensure non-negative
				diff,
			};
		});
	}

	/**
	 * Creates new worklogs for default stories based on percentage distribution
	 */
	static createDefaultWorklogs(
		attendance: Attendance | null,
		defaultStories: DefaultStory[],
		config: JiraConfig,
	): CreateWorklogsResult | AlignmentError {
		uiLogger.debug('createDefaultWorklogs: Starting', {
			hasAttendance: !!attendance,
			attendanceHours: attendance?.totalHours,
			defaultStoriesCount: defaultStories?.length || 0,
			defaultStories,
			fillConfig: config.fill,
		});

		// Validate inputs
		if (!attendance || !attendance.totalHours) {
			uiLogger.debug('createDefaultWorklogs: No attendance data found', {
				hasAttendance: !!attendance,
				totalHours: attendance?.totalHours,
				attendance,
			});
			return {
				type: 'no-attendance',
				message: 'No attendance data found for this date',
			};
		}

		// Validate default stories configuration
		const validation = validateDefaultStories(defaultStories);
		if (!validation.valid) {
			uiLogger.debug(
				'createDefaultWorklogs: Invalid default stories configuration',
				{
					defaultStories,
					validationError: validation.error,
					validationValid: validation.valid,
				},
			);
			return {
				type: 'invalid-config',
				message: validation.error || 'Invalid default stories configuration',
			};
		}

		uiLogger.debug(
			'createDefaultWorklogs: Validation passed, proceeding with creation',
			{
				attendanceHours: attendance.totalHours,
				storiesCount: defaultStories.length,
			},
		);

		const attendanceHours = attendance.totalHours;
		uiLogger.debug('Creating worklogs for default stories', {
			attendanceHours,
			defaultStoriesCount: defaultStories.length,
		});

		// Pre-resolve defaults for all stories to optimize performance
		const defaultsCache = new Map<string, {comment: string}>();
		for (const story of defaultStories) {
			if (!defaultsCache.has(story.issueKey)) {
				const defaults = resolveDefaults(config, story.issueKey);
				defaultsCache.set(story.issueKey, {
					comment: defaults.comment || '',
				});
			}
		}

		// Calculate hours for each story using cached defaults
		const createdWorklogs = defaultStories.map(story => {
			const hours = (attendanceHours * story.percentage) / 100;
			const cachedDefaults = defaultsCache.get(story.issueKey)!;
			const comment = cachedDefaults.comment;

			uiLogger.debug('Creating worklog for story', {
				issueKey: story.issueKey,
				percentage: story.percentage,
				hours,
				comment,
			});

			return {
				issueKey: story.issueKey,
				hours,
				comment,
				percentage: story.percentage,
			};
		});

		const totalDistributed = createdWorklogs.reduce(
			(sum, worklog) => sum + worklog.hours,
			0,
		);

		const message = `${totalDistributed.toFixed(1)}h distributed across ${
			createdWorklogs.length
		} default stories`;

		uiLogger.debug('RemainingTimeAlignment.createDefaultWorklogs COMPLETE', {
			totalDistributed,
			createdWorklogsCount: createdWorklogs.length,
			message,
		});

		return {
			createdWorklogs,
			totalDistributed,
			message,
		};
	}
}
