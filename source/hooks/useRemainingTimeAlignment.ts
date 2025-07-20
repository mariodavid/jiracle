import {useCallback} from 'react';
import {JiraClient} from '../jira-client.js';
import {RemainingTimeAlignment} from '../services/RemainingTimeAlignment.js';
import {AttendanceManager} from '../attendance/AttendanceManager.js';
import {formatLocalDateKey} from '../utils/date.js';
import type {JiraConfig, AlignRemainingStrategy} from '../jira-client.js';
import type {DailyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';
import type {Attendance} from '../attendance/types.js';

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
		result: import('../services/RemainingTimeAlignment.js').AlignmentResult;
		attendanceHours: number;
		currentLoggedHours: number;
		remainingHours: number;
		strategy: import('../jira-client.js').AlignRemainingStrategy;
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

				// Get alignment strategy from config
				const strategy: AlignRemainingStrategy =
					config.alignRemainingStrategy || 'even';

				// Calculate alignment
				const result = RemainingTimeAlignment.calculateAlignment(
					attendance,
					dailySummary,
					strategy,
				);

				// Handle errors
				if ('type' in result) {
					onNotification?.(result.message, 'error');
					return null;
				}

				const attendanceHours = attendance?.totalHours || 0;
				const currentLoggedHours = dailySummary?.totalHours || 0;
				const remainingHours = attendanceHours - currentLoggedHours;

				return {
					result,
					attendanceHours,
					currentLoggedHours,
					remainingHours,
					strategy,
				};
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

	const alignRemainingTime = useCallback(
		async (date: Date, dailySummary: DailyWorklogSummary | null) => {
			try {
				// Get the preview data
				const previewData = await previewAlignment(date, dailySummary);
				if (!previewData) {
					return;
				}

				const {result} = previewData;

				// Apply the alignment by updating worklogs
				const jiraClient = new JiraClient(config);
				const dateStr = date.toISOString().split('T')[0];

				for (const update of result.updatedIssues) {
					// Find the worklog entry for this issue on this date
					const issueEntry = dailySummary?.issues.find(
						issue => issue.issueKey === update.issueKey,
					);

					if (issueEntry?.worklogId) {
						// Simple case: single worklog with ID, just update it
						await jiraClient.updateWorklog(
							update.issueKey,
							issueEntry.worklogId,
							{
								timeSpent: `${update.newHours}h`,
								comment: issueEntry.comment || '',
								started: date.toISOString().replace('Z', '+0000'),
							},
						);
					} else {
						// Complex case: multiple worklogs for this issue on this date
						// Get all worklogs for this issue and filter by date
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

						if (dayWorklogs.length > 0) {
							// Distribute the new total time across existing worklogs proportionally
							const currentTotal = dayWorklogs.reduce(
								(sum: number, wl) => sum + wl.timeSpentSeconds / 3600,
								0,
							);
							const newTotalSeconds = update.newHours * 3600;

							for (const worklog of dayWorklogs) {
								const proportion =
									worklog.timeSpentSeconds / 3600 / currentTotal;
								const newSeconds = Math.round(newTotalSeconds * proportion);
								const newHours = newSeconds / 3600;

								await jiraClient.updateWorklog(update.issueKey, worklog.id, {
									timeSpent: `${newHours}h`,
									comment: worklog.comment,
									started: worklog.started,
								});
							}
						}
						// If no worklogs found for this user on this date, skip this issue
					}
				}

				// Don't show success notification anymore - confirmation dialog replaces it
				// onNotification?.(result.message, 'success');

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
		[previewAlignment, config, userEmail, onRefresh, onNotification],
	);

	return {
		alignRemainingTime,
		previewAlignment,
	};
}
