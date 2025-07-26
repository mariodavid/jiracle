import {useState, useEffect, useCallback} from 'react';
import {JiraClient, type JiraConfig} from '../jira-client.js';
import {LocalDate} from '../domain/LocalDate.js';
import {uiLogger} from '../utils/logger.js';
import type {AttendanceManager} from '../attendance/AttendanceManager.js';

export type DeleteCandidate = {
	issueKey: string;
	date: LocalDate;
};

export type DeleteAttendanceCandidate = {
	date: LocalDate;
};

export type UseDeleteOperationsOptions = {
	config: JiraConfig;
	userEmail?: string | undefined;
	onRefresh: () => void;
	onActiveAreaChange: (area: string) => void;
	attendanceManager?: AttendanceManager | undefined;
	onAttendanceRefresh?: () => void;
};

export type UseDeleteOperationsReturn = {
	// State
	deleteCandidate: DeleteCandidate | undefined;
	deleteAttendanceCandidate: DeleteAttendanceCandidate | undefined;
	isDeleting: boolean;
	isDeletingAttendance: boolean;
	deleteError: string | undefined;

	// Actions
	handleCellDelete: (data: {issueKey: string; date: LocalDate}) => void;
	handleDeleteAttendance: (data: {date: LocalDate}) => void;
	handleDeleteConfirm: (confirmed: boolean) => Promise<void>;
	handleDeleteAttendanceConfirm: (confirmed: boolean) => Promise<void>;
	clearDeleteError: () => void;
};

export function useDeleteOperations(
	options: UseDeleteOperationsOptions,
): UseDeleteOperationsReturn {
	const {
		config,
		userEmail,
		onRefresh,
		onActiveAreaChange,
		attendanceManager,
		onAttendanceRefresh,
	} = options;

	const [deleteCandidate, setDeleteCandidate] = useState<
		DeleteCandidate | undefined
	>(undefined);
	const [deleteAttendanceCandidate, setDeleteAttendanceCandidate] = useState<
		DeleteAttendanceCandidate | undefined
	>(undefined);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDeletingAttendance, setIsDeletingAttendance] = useState(false);
	const [deleteError, setDeleteError] = useState<string | undefined>(undefined);

	const handleCellDelete = useCallback(
		(data: {issueKey: string; date: LocalDate}) => {
			setDeleteCandidate(data);
			onActiveAreaChange('delete-confirmation');
		},
		[onActiveAreaChange],
	);

	const handleDeleteAttendance = useCallback(
		(data: {date: LocalDate}) => {
			setDeleteAttendanceCandidate(data);
			onActiveAreaChange('delete-attendance-confirmation');
		},
		[onActiveAreaChange],
	);

	const handleDeleteConfirm = useCallback(
		async (confirmed: boolean) => {
			if (!confirmed || !deleteCandidate) {
				setDeleteCandidate(undefined);
				onActiveAreaChange('timetable');
				return;
			}

			setIsDeleting(true);
			setDeleteError(undefined);

			try {
				const jiraClient = new JiraClient(config);
				const worklogResponse = await jiraClient.getIssueWorklogs(
					deleteCandidate.issueKey,
				);

				// Filter worklogs for the selected date and current user only
				const targetDateString = LocalDate.fromDate(
					deleteCandidate.date,
				).toISOString();
				const worklogsToDelete = worklogResponse.worklogs.filter(worklog => {
					if (!worklog.started) return false;

					const worklogDate = new Date(worklog.started);
					const worklogDateString =
						LocalDate.fromDate(worklogDate).toISOString();

					// Check if worklog is for the target date
					if (worklogDateString !== targetDateString) return false;

					// Check if worklog belongs to current user
					return worklog.author?.emailAddress === userEmail;
				});

				uiLogger.debug(
					`Found ${worklogsToDelete.length} worklogs to delete for ${deleteCandidate.issueKey} on ${targetDateString}`,
				);

				// Delete each matching worklog
				await Promise.all(
					worklogsToDelete.map(async worklog => {
						uiLogger.debug(
							`Deleting worklog ${worklog.id} (${worklog.timeSpentSeconds}s)`,
						);
						return jiraClient.deleteWorklog(
							deleteCandidate.issueKey,
							worklog.id,
						);
					}),
				);

				// Refresh the data
				onRefresh();

				uiLogger.info(
					`Successfully deleted ${worklogsToDelete.length} worklogs for ${deleteCandidate.issueKey}`,
				);
			} catch (error: unknown) {
				console.error('Error deleting worklogs:', error);
				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error occurred';
				setDeleteError(`Failed to delete worklogs: ${errorMessage}`);
			} finally {
				setIsDeleting(false);
				setDeleteCandidate(undefined);
				onActiveAreaChange('timetable');
			}
		},
		[config, deleteCandidate, userEmail, onRefresh, onActiveAreaChange],
	);

	const handleDeleteAttendanceConfirm = useCallback(
		async (confirmed: boolean) => {
			if (!confirmed || !deleteAttendanceCandidate || !attendanceManager) {
				setDeleteAttendanceCandidate(undefined);
				onActiveAreaChange('timetable');
				return;
			}

			setIsDeletingAttendance(true);
			setDeleteError(undefined);

			try {
				const deleted = await attendanceManager.deleteAttendance(
					deleteAttendanceCandidate.date,
				);

				if (deleted) {
					// Refresh the data
					onRefresh();
					// Force attendance data refresh in TimetableGrid
					if (onAttendanceRefresh) {
						onAttendanceRefresh();
					}

					uiLogger.info(
						`Successfully deleted attendance for ${deleteAttendanceCandidate.date.toISOString()}`,
					);
				} else {
					setDeleteError('No attendance found for the selected date');
				}
			} catch (error: unknown) {
				console.error('Error deleting attendance:', error);
				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error occurred';
				setDeleteError(`Failed to delete attendance: ${errorMessage}`);
			} finally {
				setIsDeletingAttendance(false);
				setDeleteAttendanceCandidate(undefined);
				onActiveAreaChange('timetable');
			}
		},
		[
			deleteAttendanceCandidate,
			attendanceManager,
			onRefresh,
			onAttendanceRefresh,
			onActiveAreaChange,
		],
	);

	const clearDeleteError = useCallback(() => {
		setDeleteError(undefined);
	}, []);

	// Auto-hide delete error alert after 5 seconds
	useEffect(() => {
		if (deleteError) {
			const timer = setTimeout(() => {
				setDeleteError(undefined);
			}, 5000);
			return () => {
				clearTimeout(timer);
			};
		}

		return undefined;
	}, [deleteError]);

	return {
		// State
		deleteCandidate,
		deleteAttendanceCandidate,
		isDeleting,
		isDeletingAttendance,
		deleteError,

		// Actions
		handleCellDelete,
		handleDeleteAttendance,
		handleDeleteConfirm,
		handleDeleteAttendanceConfirm,
		clearDeleteError,
	};
}
