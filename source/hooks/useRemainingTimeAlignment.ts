import {useCallback} from 'react';
import {JiraClient, resolveAlignRemainingStrategy} from '../jira-client.js';
import {RemainingTimeAlignment} from '../services/RemainingTimeAlignment.js';
import {AttendanceManager} from '../attendance/AttendanceManager.js';
import {formatLocalDateKey} from '../utils/date.js';
import {uiLogger} from '../utils/logger.js';
import type {JiraConfig, AlignRemainingStrategy} from '../jira-client.js';
import type {DailyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';
import type {Attendance} from '../attendance/types.js';
import type {
	AlignmentResult,
	CreateWorklogsResult,
} from '../services/RemainingTimeAlignment.js';

export interface UseRemainingTimeAlignmentOptions {
	config: JiraConfig;
	userEmail?: string | null;
	onRefresh: () => void;
	onNotification?: (message: string, type?: 'success' | 'error') => void;
}

export interface UseRemainingTimeAlignmentReturn {
	alignRemainingTime: (
		date: Date,
		dailySummary: DailyWorklogSummary | null,
	) => Promise<void>;
	previewAlignment: (
		date: Date,
		dailySummary: DailyWorklogSummary | null,
	) => Promise<{
		mode: 'update' | 'create';
		result?: AlignmentResult;
		createResult?: CreateWorklogsResult;
		attendanceHours: number;
		currentLoggedHours: number;
		remainingHours: number;
		strategy: AlignRemainingStrategy;
	} | null>;
}

export function useRemainingTimeAlignment(
	options: UseRemainingTimeAlignmentOptions,
): UseRemainingTimeAlignmentReturn {
	const {config, userEmail, onRefresh, onNotification} = options;

	const previewAlignment = useCallback(
		async (date: Date, dailySummary: DailyWorklogSummary | null) => {
			try {
				// Get attendance data for the date
				let attendance: Attendance | null = null;
				if (config.attendance?.enabled) {
					const attendanceManager = new AttendanceManager(config.attendance);
					const dateKey = formatLocalDateKey(date);
					const storage = (attendanceManager as any).storage;
					attendance = await storage.getByDate(dateKey);
				}

				// Get alignment strategy from config with backward compatibility
				const strategy = resolveAlignRemainingStrategy(config);

				const attendanceHours = attendance?.totalHours || 0;
				const currentLoggedHours = dailySummary?.totalHours || 0;
				const remainingHours = attendanceHours - currentLoggedHours;

				uiLogger.debug('previewAlignment: analyzing situation', {
					date: date.toISOString(),
					attendanceHours,
					currentLoggedHours,
					remainingHours,
					strategy,
					hasAttendance: Boolean(attendance),
					hasDailySummary: Boolean(dailySummary),
					issuesCount: dailySummary?.issues?.length || 0,
					fillConfig: config.fill,
				});

				// Determine mode: update existing worklogs vs create new ones
				// Only consider it "existing worklogs" if there are issues with actual hours > 0
				const hasExistingWorklogs =
					dailySummary && dailySummary.issues.some(issue => issue.hours > 0);

				uiLogger.debug('previewAlignment: determining mode', {
					hasDailySummary: Boolean(dailySummary),
					issuesCount: dailySummary?.issues?.length || 0,
					issuesWithHours:
						dailySummary?.issues?.filter(issue => issue.hours > 0).length || 0,
					hasExistingWorklogs,
					totalLoggedHours: currentLoggedHours,
				});

				if (hasExistingWorklogs) {
					// Mode: Update existing worklogs
					uiLogger.debug('previewAlignment: entering UPDATE mode', {
						issuesCount: dailySummary.issues.length,
					});

					const result = RemainingTimeAlignment.calculateAlignment(
						attendance,
						dailySummary,
						strategy,
					);

					// Handle errors
					if ('type' in result) {
						uiLogger.debug('previewAlignment: UPDATE mode failed', {
							errorType: result.type,
							errorMessage: result.message,
						});
						onNotification?.(result.message, 'error');
						return null;
					}

					uiLogger.debug('previewAlignment: UPDATE mode successful', {
						updatedIssuesCount: result.updatedIssues.length,
					});

					return {
						mode: 'update' as const,
						result,
						attendanceHours,
						currentLoggedHours,
						remainingHours,
						strategy,
					};
				} else {
					// Mode: Create new worklogs from default stories
					uiLogger.debug('previewAlignment: entering CREATE mode', {
						fillConfig: config.fill,
						hasDefaultStories: Boolean(config.fill?.defaultStories),
						defaultStoriesLength: config.fill?.defaultStories?.length || 0,
					});

					const defaultStories = config.fill?.defaultStories;
					if (!defaultStories || defaultStories.length === 0) {
						uiLogger.debug(
							'previewAlignment: CREATE mode failed - no default stories',
							{
								hasDefaultStories: Boolean(defaultStories),
								defaultStoriesLength: defaultStories?.length || 0,
								fillConfig: config.fill,
							},
						);
						onNotification?.(
							'No default stories configured for auto-fill',
							'error',
						);
						return null;
					}

					const createResult = RemainingTimeAlignment.createDefaultWorklogs(
						attendance,
						defaultStories,
						config,
					);

					// Handle errors
					if ('type' in createResult) {
						uiLogger.debug('previewAlignment: CREATE mode failed', {
							errorType: createResult.type,
							errorMessage: createResult.message,
							attendance,
							defaultStories,
						});
						onNotification?.(createResult.message, 'error');
						return null;
					}

					uiLogger.debug('previewAlignment: CREATE mode successful', {
						createdWorklogsCount: createResult.createdWorklogs.length,
						totalDistributed: createResult.totalDistributed,
					});

					return {
						mode: 'create' as const,
						createResult,
						attendanceHours,
						currentLoggedHours: 0, // No existing worklogs
						remainingHours: attendanceHours, // All attendance time to distribute
						strategy,
					};
				}
			} catch (error) {
				console.error('Failed to preview alignment:', error);
				onNotification?.(
					'Failed to preview alignment: ' +
						(error instanceof Error ? error.message : 'Unknown error'),
					'error',
				);
				return null;
			}
		},
		[config, onNotification],
	);

	// Helper function to update a single worklog with ID
	const updateSingleWorklog = useCallback(
		async (
			jiraClient: JiraClient,
			update: {issueKey: string; newHours: number},
			issueEntry: {worklogId: string; comment?: string},
			date: Date,
		) => {
			await jiraClient.updateWorklog(update.issueKey, issueEntry.worklogId, {
				timeSpent: `${update.newHours}h`,
				comment: issueEntry.comment || '',
				started: date.toISOString().replace('Z', '+0000'),
			});
		},
		[],
	);

	// Helper function to update multiple worklogs proportionally
	const updateMultipleWorklogs = useCallback(
		async (
			jiraClient: JiraClient,
			update: {issueKey: string; newHours: number},
			dateStr: string,
		) => {
			const worklogResponse = await jiraClient.getIssueWorklogs(
				update.issueKey,
			);
			const dayWorklogs = worklogResponse.worklogs.filter(worklog => {
				const worklogDate = new Date(worklog.started)
					.toISOString()
					.split('T')[0];
				const isCorrectDate = worklogDate === dateStr;
				const isCorrectUser =
					!userEmail || worklog.author.emailAddress === userEmail;
				return isCorrectDate && isCorrectUser;
			});

			if (dayWorklogs.length === 0) {
				return; // Skip if no worklogs found for this user on this date
			}

			const currentTotal = dayWorklogs.reduce(
				(sum: number, wl) => sum + wl.timeSpentSeconds / 3600,
				0,
			);
			const newTotalSeconds = update.newHours * 3600;

			for (const worklog of dayWorklogs) {
				const proportion = worklog.timeSpentSeconds / 3600 / currentTotal;
				const newSeconds = Math.round(newTotalSeconds * proportion);
				const newHours = newSeconds / 3600;

				await jiraClient.updateWorklog(update.issueKey, worklog.id, {
					timeSpent: `${newHours}h`,
					comment: worklog.comment,
					started: worklog.started,
				});
			}
		},
		[userEmail],
	);

	const alignRemainingTime = useCallback(
		async (date: Date, dailySummary: DailyWorklogSummary | null) => {
			try {
				// Get the preview data
				const previewData = await previewAlignment(date, dailySummary);
				if (!previewData) {
					return;
				}

				const jiraClient = new JiraClient(config);
				const dateStr = date.toISOString().split('T')[0]!;

				if (previewData.mode === 'update') {
					// Mode: Update existing worklogs
					const {result} = previewData;
					if (!result) {
						onNotification?.('No alignment result found', 'error');
						return;
					}

					for (const update of result.updatedIssues) {
						// Find the worklog entry for this issue on this date
						const issueEntry = dailySummary?.issues.find(
							issue => issue.issueKey === update.issueKey,
						);

						if (issueEntry?.worklogId) {
							// Simple case: single worklog with ID, just update it
							await updateSingleWorklog(
								jiraClient,
								update,
								issueEntry as {worklogId: string; comment?: string},
								date,
							);
						} else {
							// Complex case: multiple worklogs for this issue on this date
							await updateMultipleWorklogs(jiraClient, update, dateStr);
						}
					}
				} else if (previewData.mode === 'create') {
					// Mode: Create new worklogs from default stories
					const {createResult} = previewData;
					if (!createResult) {
						onNotification?.('No create result found', 'error');
						return;
					}

					for (const worklog of createResult.createdWorklogs) {
						await jiraClient.addWorklog(worklog.issueKey, {
							timeSpent: `${worklog.hours}h`,
							comment: worklog.comment,
							started: date.toISOString().replace('Z', '+0000'),
						});
					}
				}

				// Refresh the data
				onRefresh();
			} catch (error) {
				console.error('Failed to align remaining time:', error);
				onNotification?.(
					'Failed to align remaining time: ' +
						(error instanceof Error ? error.message : 'Unknown error'),
					'error',
				);
			}
		},
		[
			previewAlignment,
			config,
			updateSingleWorklog,
			updateMultipleWorklogs,
			onRefresh,
			onNotification,
		],
	);

	return {
		alignRemainingTime,
		previewAlignment,
	};
}
