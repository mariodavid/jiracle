import {useState, useCallback} from 'react';
import {JiraClient, type JiraConfig, resolveDefaults} from '../jira-client.js';
import {LocalDate} from '../domain/LocalDate.js';
import {uiLogger} from '../utils/logger.js';
import {
	detectWorklogForEdit,
	findWorklogEntryForIssue,
} from '../utils/worklog-detection.js';
import type {
	WeeklyWorklogSummary,
	DailyWorklogSummary,
} from '../domain/WeeklyWorklogSummary.js';
import {AttendanceManager} from '../attendance/AttendanceManager.js';
import {WorklogEntry} from '../domain/WorklogEntry.js';
import {Duration} from '../domain/Duration.js';

export type WorklogFormData = {
	issueKey: string;
	date: LocalDate;
	timeSpent: Duration;
	comment: string;
	isVisible: boolean;
	isIssueKeyEditable: boolean;
	// Edit mode fields
	isEditMode?: boolean;
	worklogId?: string;
};

export type UseWorklogFormOptions = {
	config: JiraConfig;
	userEmail?: string | undefined;
	onRefresh: () => void;
	onActiveAreaChange: (area: string) => void;
	data?: WeeklyWorklogSummary; // WeeklyWorklogSummary data for worklog detection
};

export type UseWorklogFormReturn = {
	// State
	worklogForm: WorklogFormData;
	worklogSubmitting: boolean;
	worklogError: string | undefined;

	// Actions
	handleCellWorklog: (cellData: {issueKey: string; date: LocalDate}) => void;
	handleAddWorklog: () => void;
	handleWorklogSubmit: (data: {
		issueKey: string;
		date: LocalDate;
		timeSpent: Duration;
		comment: string;
		worklogId?: string;
	}) => Promise<void>;
	handleWorklogCancel: () => void;
	clearError: () => void;
};

export function useWorklogForm(
	options: UseWorklogFormOptions,
): UseWorklogFormReturn {
	const {config, onRefresh, onActiveAreaChange, data} = options;

	// Helper function to calculate remaining time for a date
	const calculateRemainingTime = useCallback(
		async (date: LocalDate, currentIssueKey: string) => {
			try {
				// Check if attendance is enabled and get attendance data
				if (!config.attendance?.enabled) {
					return undefined; // No attendance tracking, can't calculate remaining time
				}

				const attendanceManager = new AttendanceManager(config.attendance);
				const dateKey = date.toISOString();
				// Use getAllAttendance and filter instead of accessing private storage
				const allAttendance = await attendanceManager.getAllAttendance();
				const attendance = allAttendance.find(a => a.date === dateKey);

				if (!attendance?.totalHours || attendance.totalHours <= 0) {
					return undefined; // No attendance data for this date
				}

				// Find daily summary for this date
				const dailySummary = data?.dailySummaries.find(
					(summary: DailyWorklogSummary) =>
						LocalDate.fromDate(summary.date).toISOString() === dateKey,
				);

				if (!dailySummary) {
					// No worklogs yet, return full attendance time
					return attendance.totalHours ?? 0;
				}

				// Calculate total time already logged for other issues
				let totalLoggedForOtherIssues = 0;
				for (const issue of dailySummary.issues) {
					// Don't count the current issue we're trying to log time for
					if (issue.issueKey !== currentIssueKey) {
						totalLoggedForOtherIssues += issue.hours ?? 0;
					}
				}

				// Calculate remaining time
				const remainingTime = attendance.totalHours - totalLoggedForOtherIssues;

				// Don't suggest negative time
				return Math.max(0, remainingTime);
			} catch (error: unknown) {
				console.error('Failed to calculate remaining time:', error);
				return undefined;
			}
		},
		[config, data],
	);

	const [worklogForm, setWorklogForm] = useState<WorklogFormData>({
		issueKey: '',
		date: LocalDate.today(),
		timeSpent: new Duration('1h'),
		comment: '',
		isVisible: false,
		isIssueKeyEditable: false,
	});

	const [worklogSubmitting, setWorklogSubmitting] = useState(false);
	const [worklogError, setWorklogError] = useState<string | undefined>(
		undefined,
	);

	const handleCellWorklog = useCallback(
		(cellData: {issueKey: string; date: LocalDate}) => {
			// Find the specific daily summary for this date
			const targetDate = cellData.date;
			const dailySummary = data?.dailySummaries.find((summary: any) =>
				LocalDate.fromDate(summary.date).equals(targetDate),
			);

			// Find the worklog entry for this issue on this date
			const worklogEntry = dailySummary
				? findWorklogEntryForIssue(cellData.issueKey, dailySummary.issues)
				: undefined;

			// Detect if this is an edit scenario
			const detectionResult = detectWorklogForEdit(worklogEntry);

			// Resolve defaults for new entries or use existing data for edits
			const defaults = resolveDefaults(config, cellData.issueKey);

			if (
				detectionResult.isEditable &&
				detectionResult.timeSpent &&
				detectionResult.comment
			) {
				// Edit mode: use existing data
				setWorklogForm({
					issueKey: cellData.issueKey,
					date: cellData.date,
					timeSpent: new Duration(detectionResult.timeSpent),
					comment: detectionResult.comment,
					isVisible: true,
					isIssueKeyEditable: false,
					isEditMode: detectionResult.isEditable,
					worklogId: detectionResult.worklogId,
				});
				setWorklogError(undefined);
				onActiveAreaChange('worklog-form');
			} else {
				// New entry mode: calculate remaining time first, then show form
				calculateRemainingTime(cellData.date, cellData.issueKey)
					.then(remainingTime => {
						let suggestedTime: Duration;

						if (remainingTime !== undefined && remainingTime > 0) {
							// Use remaining time as suggestion
							suggestedTime = Duration.fromHours(remainingTime);

							uiLogger.debug('Using remaining time as suggestion', {
								issueKey: cellData.issueKey,
								date: cellData.date.toISOString(),
								remainingTime,
								suggestion: suggestedTime.toString(),
							});
						} else if (remainingTime !== undefined && remainingTime === 0) {
							// Remaining time is 0 (all attendance hours already logged),
							// use config defaults for "clock out" workflow
							suggestedTime = new Duration(defaults.time);

							uiLogger.debug(
								'Remaining time is 0, using config defaults for clock out',
								{
									issueKey: cellData.issueKey,
									date: cellData.date.toISOString(),
									remainingTime,
									suggestion: suggestedTime.toString(),
								},
							);
						} else {
							// No remaining time calculation possible, use defaults
							suggestedTime = new Duration(defaults.time);
						}

						// Show form with calculated suggestion
						setWorklogForm({
							issueKey: cellData.issueKey,
							date: cellData.date,
							timeSpent: suggestedTime,
							comment: defaults.comment,
							isVisible: true,
							isIssueKeyEditable: false,
							isEditMode: false,
						});
						setWorklogError(undefined);
						onActiveAreaChange('worklog-form');
					})
					.catch(error => {
						console.error('Failed to calculate remaining time:', error);
						// Fallback to defaults on error
						setWorklogForm({
							issueKey: cellData.issueKey,
							date: cellData.date,
							timeSpent: new Duration(defaults.time),
							comment: defaults.comment,
							isVisible: true,
							isIssueKeyEditable: false,
							isEditMode: false,
						});
						setWorklogError(undefined);
						onActiveAreaChange('worklog-form');
					});
			}
		},
		[data, config, onActiveAreaChange, calculateRemainingTime],
	);

	const handleAddWorklog = useCallback(() => {
		const defaults = resolveDefaults(config, '');

		setWorklogForm({
			issueKey: '',
			date: LocalDate.today(), // Default to today
			timeSpent: new Duration(defaults.time),
			comment: defaults.comment,
			isVisible: true,
			isIssueKeyEditable: true, // Allow editing issue key in add mode
		});
		setWorklogError(undefined); // Clear any previous error
		onActiveAreaChange('worklog-form');
	}, [config, onActiveAreaChange]);

	const handleWorklogSubmit = useCallback(
		async (data: {
			issueKey: string;
			date: LocalDate;
			timeSpent: Duration;
			comment: string;
			worklogId?: string;
		}) => {
			// Immediate guard against double submission
			if (worklogSubmitting) {
				uiLogger.debug('useWorklogForm: Blocked duplicate submission');
				return;
			}

			uiLogger.debug('useWorklogForm: handleWorklogSubmit called', {
				issueKey: data.issueKey,
				timeSpent: data.timeSpent.toString(),
				comment: data.comment,
				isEditMode: Boolean(data.worklogId),
			});

			try {
				// Get duration in seconds for validation
				const durationSeconds = data.timeSpent.toSeconds();

				// Create WorklogEntry for validation and API request generation
				const worklogEntry = WorklogEntry.create({
					issueKey: data.issueKey,
					duration: durationSeconds,
					comment: data.comment,
					date: new Date(data.date.toISOString()),
					author: {
						displayName: options.userEmail ?? 'Unknown User',
						emailAddress: options.userEmail ?? 'unknown@example.com',
					},
				});

				setWorklogSubmitting(true);
				setWorklogError(undefined);

				const jiraClient = new JiraClient(config);
				const worklogData = worklogEntry.toApiRequest();

				if (data.worklogId) {
					// Edit existing worklog
					uiLogger.debug('useWorklogForm: Updating existing worklog', {
						worklogId: data.worklogId,
						issueKey: data.issueKey,
					});

					await jiraClient.updateWorklog(
						data.issueKey,
						data.worklogId,
						worklogData,
					);

					uiLogger.info(
						`Successfully updated worklog for ${
							data.issueKey
						}: ${data.timeSpent.toString()}`,
					);
				} else {
					// Add new worklog
					uiLogger.debug('useWorklogForm: Adding new worklog', {
						issueKey: data.issueKey,
					});

					await jiraClient.addWorklog(data.issueKey, worklogData);

					uiLogger.info(
						`Successfully logged work for ${
							data.issueKey
						}: ${data.timeSpent.toString()}`,
					);
				}

				// Refresh the data to show the new/updated worklog
				onRefresh();

				// Close form and return to table
				setWorklogForm(previous => ({...previous, isVisible: false}));
				onActiveAreaChange('timetable');

				uiLogger.debug(
					'useWorklogForm: Worklog submission completed successfully',
				);
			} catch (error: unknown) {
				setWorklogError(
					error instanceof Error ? error.message : 'Failed to submit worklog',
				);
			} finally {
				setWorklogSubmitting(false);
			}
		},
		[config, worklogSubmitting, onRefresh, onActiveAreaChange],
	);

	const handleWorklogCancel = useCallback(() => {
		setWorklogForm(previous => ({...previous, isVisible: false}));
		onActiveAreaChange('timetable');
	}, [onActiveAreaChange]);

	const clearError = useCallback(() => {
		setWorklogError(undefined);
	}, []);

	return {
		// State
		worklogForm,
		worklogSubmitting,
		worklogError,

		// Actions
		handleCellWorklog,
		handleAddWorklog,
		handleWorklogSubmit,
		handleWorklogCancel,
		clearError,
	};
}
