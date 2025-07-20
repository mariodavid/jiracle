import {useState, useCallback} from 'react';
import {
	JiraClient,
	type JiraConfig,
	type WorklogRequest,
	resolveDefaults,
} from '../jira-client.js';
import {formatLocalDateKey} from '../utils/date.js';
import {uiLogger} from '../utils/logger.js';
import {
	detectWorklogForEdit,
	findWorklogEntryForIssue,
} from '../utils/worklog-detection.js';

export interface WorklogFormData {
	issueKey: string;
	date: Date;
	timeSpent: string;
	comment: string;
	isVisible: boolean;
	isIssueKeyEditable: boolean;
	// Edit mode fields
	isEditMode?: boolean;
	worklogId?: string;
}

export interface UseWorklogFormOptions {
	config: JiraConfig;
	userEmail?: string | null;
	onRefresh: () => void;
	onActiveAreaChange: (area: string) => void;
	data?: any; // WeeklyWorklogSummary data for worklog detection
}

export interface UseWorklogFormReturn {
	// State
	worklogForm: WorklogFormData;
	worklogSubmitting: boolean;
	worklogError: string | null;

	// Actions
	handleCellWorklog: (cellData: {issueKey: string; date: Date}) => void;
	handleAddWorklog: () => void;
	handleWorklogSubmit: (data: {
		issueKey: string;
		date: Date;
		timeSpent: string;
		comment: string;
		worklogId?: string;
	}) => Promise<void>;
	handleWorklogCancel: () => void;
	clearError: () => void;
}

export function useWorklogForm(
	options: UseWorklogFormOptions,
): UseWorklogFormReturn {
	const {config, onRefresh, onActiveAreaChange, data} = options;

	const [worklogForm, setWorklogForm] = useState<WorklogFormData>({
		issueKey: '',
		date: new Date(),
		timeSpent: '1h',
		comment: '',
		isVisible: false,
		isIssueKeyEditable: false,
	});

	const [worklogSubmitting, setWorklogSubmitting] = useState(false);
	const [worklogError, setWorklogError] = useState<string | null>(null);

	const handleCellWorklog = useCallback(
		(cellData: {issueKey: string; date: Date}) => {
			// Find the specific daily summary for this date
			const targetDateKey = formatLocalDateKey(cellData.date);
			const dailySummary = data?.dailySummaries.find(
				(summary: any) => formatLocalDateKey(summary.date) === targetDateKey,
			);

			// Find the worklog entry for this issue on this date
			const worklogEntry = dailySummary
				? findWorklogEntryForIssue(cellData.issueKey, dailySummary.issues)
				: undefined;

			// Detect if this is an edit scenario
			const detectionResult = detectWorklogForEdit(worklogEntry);

			// Resolve defaults for new entries or use existing data for edits
			let timeSpent: string;
			let comment: string;

			if (
				detectionResult.isEditable &&
				detectionResult.timeSpent &&
				detectionResult.comment
			) {
				timeSpent = detectionResult.timeSpent;
				comment = detectionResult.comment;
			} else {
				const defaults = resolveDefaults(config, cellData.issueKey);
				timeSpent = defaults.time;
				comment = defaults.comment;
			}

			setWorklogForm({
				issueKey: cellData.issueKey,
				date: cellData.date,
				timeSpent,
				comment,
				isVisible: true,
				isIssueKeyEditable: false,
				isEditMode: detectionResult.isEditable,
				worklogId: detectionResult.worklogId,
			});
			setWorklogError(null); // Clear any previous error
			onActiveAreaChange('worklog-form');
		},
		[data, config, onActiveAreaChange],
	);

	const handleAddWorklog = useCallback(() => {
		const defaults = resolveDefaults(config, '');

		setWorklogForm({
			issueKey: '',
			date: new Date(), // Default to today
			timeSpent: defaults.time,
			comment: defaults.comment,
			isVisible: true,
			isIssueKeyEditable: true, // Allow editing issue key in add mode
		});
		setWorklogError(null); // Clear any previous error
		onActiveAreaChange('worklog-form');
	}, [config, onActiveAreaChange]);

	const handleWorklogSubmit = useCallback(
		async (data: {
			issueKey: string;
			date: Date;
			timeSpent: string;
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
				timeSpent: data.timeSpent,
				comment: data.comment,
				isEditMode: Boolean(data.worklogId),
			});

			// Validate issue key
			if (!data.issueKey || data.issueKey.trim() === '') {
				setWorklogError(
					'Issue key is required. Please enter a valid Jira issue key (e.g., DEF-123).',
				);
				return;
			}

			// Basic issue key format validation
			if (!/^[A-Z]+-\d+$/i.test(data.issueKey.trim())) {
				setWorklogError(
					'Invalid issue key format. Expected format: PROJECT-123 (e.g., DEF-123, ABC-456).',
				);
				return;
			}

			setWorklogSubmitting(true);
			setWorklogError(null);

			try {
				const jiraClient = new JiraClient(config);

				// Format the date to match Jira's expected format
				// Use the date from the form data (which may be different from worklogForm.date)
				const selectedDateTime = new Date(data.date);
				// Set time to 9:00 AM for worklog start time
				selectedDateTime.setHours(9, 0, 0, 0);

				const worklogData: WorklogRequest = {
					timeSpent: data.timeSpent,
					comment: data.comment || 'Work logged via Jiracle',
					started: selectedDateTime.toISOString().replace('Z', '+0000'),
				};

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
						`Successfully updated worklog for ${data.issueKey}: ${data.timeSpent}`,
					);
				} else {
					// Add new worklog
					uiLogger.debug('useWorklogForm: Adding new worklog', {
						issueKey: data.issueKey,
					});

					await jiraClient.addWorklog(data.issueKey, worklogData);

					uiLogger.info(
						`Successfully logged work for ${data.issueKey}: ${data.timeSpent}`,
					);
				}

				// Refresh the data to show the new/updated worklog
				onRefresh();

				// Close form and return to table
				setWorklogForm(prev => ({...prev, isVisible: false}));
				onActiveAreaChange('timetable');

				uiLogger.debug(
					'useWorklogForm: Worklog submission completed successfully',
				);
			} catch (err) {
				setWorklogError(
					err instanceof Error ? err.message : 'Failed to submit worklog',
				);
			} finally {
				setWorklogSubmitting(false);
			}
		},
		[config, worklogSubmitting, onRefresh, onActiveAreaChange],
	);

	const handleWorklogCancel = useCallback(() => {
		setWorklogForm(prev => ({...prev, isVisible: false}));
		onActiveAreaChange('timetable');
	}, [onActiveAreaChange]);

	const clearError = useCallback(() => {
		setWorklogError(null);
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
