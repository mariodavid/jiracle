import React, {useState, useEffect, useCallback} from 'react';
import {Box, Text, useInput} from 'ink';
import {Alert, Spinner} from '@inkjs/ui';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import {getWeekTitle} from './WeekNavigator.js';
import {TimetableGrid} from './TimetableGrid.js';
import {InlineWorklogForm} from './InlineWorklogForm.js';
import {DeleteWorklogConfirmation} from './DeleteWorklogConfirmation.js';
import {DeleteAttendanceConfirmation} from './DeleteAttendanceConfirmation.js';
import {CheckinConfirmation} from './CheckinConfirmation.js';
import {CheckoutConfirmation} from './CheckoutConfirmation.js';
import {TitleBar} from './TitleBar.js';
import {AttendanceManager} from '../attendance/AttendanceManager.js';
import {AttendanceEditForm} from './AttendanceEditForm.js';
import type {Attendance} from '../attendance/types.js';
import {useWeeklyWorklogSummary} from '../hooks/useWeeklyWorklogSummary.js';
import {
	JiraClient,
	type JiraConfig,
	type WorklogRequest,
	resolveDefaults,
} from '../jira-client.js';
import {
	getStartOfWeek,
	getEndOfWeek,
	formatLocalDateKey,
} from '../utils/date.js';
import {
	isBrowserOpenSupported,
	openInBrowser,
	generateJiraIssueUrl,
} from '../utils/browser.js';
import {uiLogger} from '../utils/logger.js';

interface WorklogFormData {
	issueKey: string;
	date: Date;
	timeSpent: string;
	comment: string;
	isVisible: boolean;
	isIssueKeyEditable: boolean;
}

export interface WeeklyTimetableViewProps {
	onBack: () => void;
	onLogWork?: () => void;
	onCellWorklog?: (data: {issueKey: string; date: Date}) => void;
	config: JiraConfig;
	userEmail?: string | null;
}

export function WeeklyTimetableView({
	onBack,
	onLogWork,
	config,
	userEmail,
}: WeeklyTimetableViewProps) {
	const [currentWeek, setCurrentWeek] = useState(new Date());
	const [activeArea, setActiveArea] = useState<
		| 'timetable'
		| 'worklog-form'
		| 'delete-confirmation'
		| 'delete-attendance-confirmation'
		| 'attendance-edit'
		| 'checkin-confirmation'
		| 'checkout-confirmation'
	>('timetable');
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
	const [deleteCandidate, setDeleteCandidate] = useState<{
		issueKey: string;
		date: Date;
	} | null>(null);
	const [deleteAttendanceCandidate, setDeleteAttendanceCandidate] = useState<{
		date: Date;
	} | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDeletingAttendance, setIsDeletingAttendance] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [attendanceManager, setAttendanceManager] =
		useState<AttendanceManager | null>(null);
	const [attendanceRefreshKey, setAttendanceRefreshKey] = useState(0);
	const [attendanceEdit, setAttendanceEdit] = useState<{
		date: Date;
		data?: Attendance;
	} | null>(null);

	// Format date for display
	const formatDate = (date: Date) => {
		const days = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
		];
		const months = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
		];
		return `${days[date.getDay()]}, ${
			months[date.getMonth()]
		} ${date.getDate()}`;
	};

	const weekStart = getStartOfWeek(currentWeek);
	const weekEnd = getEndOfWeek(currentWeek);

	const {data, isLoading, error, refresh} = useWeeklyWorklogSummary(
		weekStart,
		weekEnd,
		config,
		false, // Always load fresh data when component mounts
		userEmail || undefined,
		config.favorites, // Pass favorite issues to include them in the table
	);

	// Always use fresh data from the hook
	const displayData = data;
	const displayLoading = isLoading;

	// Initialize attendance manager
	useEffect(() => {
		if (config.attendance?.enabled) {
			const manager = new AttendanceManager(config.attendance);
			setAttendanceManager(manager);
		}
	}, [config.attendance]);

	// Refresh data when component mounts
	useEffect(() => {
		// Small delay to ensure component is fully mounted
		const timer = setTimeout(() => {
			refresh();
		}, 100);

		return () => clearTimeout(timer);
	}, []); // Empty dependency array means this runs only on mount

	const navigateToPreviousWeek = () => {
		const newWeek = new Date(currentWeek);
		newWeek.setDate(currentWeek.getDate() - 7);
		setCurrentWeek(newWeek);
		// Return focus to table after navigation
		setActiveArea('timetable');
	};

	const navigateToNextWeek = () => {
		const newWeek = new Date(currentWeek);
		newWeek.setDate(currentWeek.getDate() + 7);
		setCurrentWeek(newWeek);
		// Return focus to table after navigation
		setActiveArea('timetable');
	};

	const handleCurrentWeek = () => {
		setCurrentWeek(new Date());
		// Return focus to table after navigation
		setActiveArea('timetable');
	};

	const handleCellWorklog = (data: {issueKey: string; date: Date}) => {
		// Resolve defaults using the new hierarchical system
		const defaults = resolveDefaults(config, data.issueKey);

		setWorklogForm({
			issueKey: data.issueKey,
			date: data.date,
			timeSpent: defaults.time,
			comment: defaults.comment,
			isVisible: true,
			isIssueKeyEditable: false,
		});
		setWorklogError(null); // Clear any previous error
		setActiveArea('worklog-form');
	};

	const handleAddWorklog = () => {
		// Use global defaults for time and comment
		const defaults = resolveDefaults(config, '');

		setWorklogForm({
			issueKey: '',
			date: new Date(), // Default to today
			timeSpent: defaults.time,
			comment: defaults.comment,
			isVisible: true,
			isIssueKeyEditable: true,
		});
		setWorklogError(null); // Clear any previous error
		setActiveArea('worklog-form');
	};

	const handleWorklogSubmit = useCallback(
		async (data: {
			issueKey: string;
			timeSpent: string;
			comment: string;
			date: Date;
		}) => {
			// Immediate guard against double submission
			if (worklogSubmitting) {
				uiLogger.debug('WeeklyTimetableView: Blocked duplicate submission');
				return;
			}

			uiLogger.debug('WeeklyTimetableView: handleWorklogSubmit called', {
				issueKey: data.issueKey,
				timeSpent: data.timeSpent,
				comment: data.comment,
				timestamp: new Date().toISOString(),
			});

			// Validate issue key before submitting
			if (!data.issueKey || data.issueKey.trim() === '') {
				setWorklogError(
					'Issue key is required. Please enter a valid Jira issue key (e.g., JTS-123).',
				);
				return;
			}

			// Validate issue key format (basic check)
			if (!/^[A-Z]+-\d+$/i.test(data.issueKey.trim())) {
				setWorklogError(
					'Invalid issue key format. Expected format: PROJECT-123 (e.g., JTS-123, GVV-456).',
				);
				return;
			}

			setWorklogSubmitting(true);
			setWorklogError(null);

			try {
				// Create Jira client
				const client = new JiraClient(config);

				// Format the date to match Jira's expected format
				// Use the date from the form data (which may be different from worklogForm.date)
				const selectedDateTime = new Date(data.date);
				// Set time to 9:00 AM for worklog start time
				selectedDateTime.setHours(9, 0, 0, 0);
				const formattedStarted = selectedDateTime
					.toISOString()
					.replace('Z', '+0000');

				const worklogData: WorklogRequest = {
					timeSpent: data.timeSpent,
					comment: data.comment || 'Work logged via Jiracle',
					started: formattedStarted,
				};

				// Use trimmed issue key
				const trimmedIssueKey = data.issueKey.trim();
				await client.addWorklog(trimmedIssueKey, worklogData);

				uiLogger.debug('WeeklyTimetableView: Worklog submitted successfully', {
					issueKey: trimmedIssueKey,
					timestamp: new Date().toISOString(),
				});

				// Close form and return to table
				setWorklogForm(prev => ({...prev, isVisible: false}));
				setActiveArea('timetable');

				// Refresh the data to show the new worklog
				refresh();
			} catch (err) {
				setWorklogError(
					err instanceof Error ? err.message : 'Failed to submit worklog',
				);
			} finally {
				setWorklogSubmitting(false);
			}
		},
		[config, worklogSubmitting, refresh],
	);

	const handleWorklogCancel = () => {
		setWorklogForm(prev => ({...prev, isVisible: false}));
		setActiveArea('timetable');
	};

	const handleCellDelete = (data: {issueKey: string; date: Date}) => {
		setDeleteCandidate(data);
		setActiveArea('delete-confirmation');
	};

	const handleAttendanceEdit = async (data: {date: Date}) => {
		if (!attendanceManager) return;

		try {
			// Load existing attendance data for this date
			// Use local date format to avoid timezone issues
			const dateKey = formatLocalDateKey(data.date);
			// Load attendance data directly for this specific date
			const storage = (attendanceManager as any).storage;
			const existingData = await storage.getByDate(dateKey);

			setAttendanceEdit({
				date: data.date,
				data: existingData || undefined,
			});
			setActiveArea('attendance-edit');
		} catch (error) {
			console.error('Failed to load attendance data:', error);
			// Still allow editing with defaults
			setAttendanceEdit({
				date: data.date,
				data: undefined,
			});
			setActiveArea('attendance-edit');
		}
	};

	const handleAttendanceSubmit = async (data: Attendance) => {
		if (!attendanceManager) return;

		try {
			await attendanceManager.updateAttendance(data);
			setAttendanceEdit(null);
			setActiveArea('timetable');
			// Refresh the data to show the updated attendance
			refresh();
			// Force attendance data refresh in TimetableGrid
			setAttendanceRefreshKey(prev => prev + 1);
		} catch (error) {
			console.error('Failed to save attendance:', error);
		}
	};

	const handleAttendanceCancel = () => {
		setAttendanceEdit(null);
		setActiveArea('timetable');
	};

	const handleDeleteAttendance = (data: {date: Date}) => {
		setDeleteAttendanceCandidate(data);
		setActiveArea('delete-attendance-confirmation');
	};

	const handleOpenInBrowser = async (issueKey: string) => {
		if (!config.jiraUrl) return;
		try {
			const url = generateJiraIssueUrl(config.jiraUrl, issueKey);
			await openInBrowser(url);
		} catch (error) {
			console.error('Failed to open browser:', error);
		}
	};

	const handleDeleteConfirm = async (confirmed: boolean) => {
		if (!confirmed || !deleteCandidate) {
			setDeleteCandidate(null);
			setActiveArea('timetable');
			return;
		}

		setIsDeleting(true);
		try {
			const jiraClient = new JiraClient(config);
			const worklogResponse = await jiraClient.getIssueWorklogs(
				deleteCandidate.issueKey,
			);

			// Filter worklogs for the selected date and current user only
			const targetDateString = formatLocalDateKey(deleteCandidate.date);
			const worklogsToDelete = worklogResponse.worklogs.filter(worklog => {
				if (!worklog.started) return false;
				const worklogDate = new Date(worklog.started);
				const worklogDateString = formatLocalDateKey(worklogDate);
				const matchesDate = worklogDateString === targetDateString;
				const isCurrentUser = userEmail
					? worklog.author.emailAddress === userEmail
					: true;
				return matchesDate && isCurrentUser;
			});

			uiLogger.debug(
				`Found ${worklogsToDelete.length} worklogs to delete for ${deleteCandidate.issueKey} on ${targetDateString}`,
			);

			// Delete each matching worklog
			for (const worklog of worklogsToDelete) {
				uiLogger.debug(
					`Deleting worklog ${worklog.id} (${worklog.timeSpentSeconds}s)`,
				);
				await jiraClient.deleteWorklog(deleteCandidate.issueKey, worklog.id);
			}

			// Refresh the data
			refresh();
		} catch (error) {
			console.error('Error deleting worklogs:', error);
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error occurred';
			setDeleteError(`Failed to delete worklogs: ${errorMessage}`);
		} finally {
			setIsDeleting(false);
			setDeleteCandidate(null);
			setActiveArea('timetable');
		}
	};

	const handleDeleteAttendanceConfirm = async (confirmed: boolean) => {
		if (!confirmed || !deleteAttendanceCandidate || !attendanceManager) {
			setDeleteAttendanceCandidate(null);
			setActiveArea('timetable');
			return;
		}
		setIsDeletingAttendance(true);
		try {
			const targetDateString = formatLocalDateKey(
				deleteAttendanceCandidate.date,
			);
			const deleted = await attendanceManager.deleteAttendance(
				targetDateString,
			);

			if (deleted) {
				// Refresh the data
				refresh();
				// Force attendance data refresh in TimetableGrid
				setAttendanceRefreshKey(prev => prev + 1);
			}
		} catch (error) {
			console.error('Error deleting attendance:', error);
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error occurred';
			setDeleteError(`Failed to delete attendance: ${errorMessage}`);
		} finally {
			setIsDeletingAttendance(false);
			setDeleteAttendanceCandidate(null);
			setActiveArea('timetable');
		}
	};

	const handleCheckinConfirm = async (confirmed: boolean) => {
		if (!confirmed || !attendanceManager) {
			setActiveArea('timetable');
			return;
		}

		try {
			await attendanceManager.checkIn();
			setAttendanceRefreshKey(prev => prev + 1); // Trigger refresh
			setActiveArea('timetable');
		} catch (error) {
			console.error('Error checking in:', error);
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error occurred';
			setDeleteError(`Failed to check in: ${errorMessage}`);
			setActiveArea('timetable');
		}
	};

	const handleCheckoutConfirm = async (confirmed: boolean) => {
		if (!confirmed || !attendanceManager) {
			setActiveArea('timetable');
			return;
		}

		try {
			await attendanceManager.checkOut();
			setAttendanceRefreshKey(prev => prev + 1); // Trigger refresh
			setActiveArea('timetable');
		} catch (error) {
			console.error('Error checking out:', error);
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error occurred';
			setDeleteError(`Failed to check out: ${errorMessage}`);
			setActiveArea('timetable');
		}
	};

	// Auto-hide delete error alert after 5 seconds
	useEffect(() => {
		if (deleteError) {
			const timer = setTimeout(() => {
				setDeleteError(null);
			}, 5000);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [deleteError]);

	useInput(input => {
		// Don't handle input if forms are visible or delete confirmation is active
		if (
			worklogForm.isVisible ||
			activeArea === 'delete-confirmation' ||
			activeArea === 'delete-attendance-confirmation' ||
			activeArea === 'attendance-edit' ||
			activeArea === 'checkin-confirmation' ||
			activeArea === 'checkout-confirmation'
		) {
			return;
		}

		// Note: Tab navigation is now handled by normal Ink focus management

		if (input === 'q') {
			onBack();
		} else if (input === 't') {
			// Go to current week, but stay in the same mode (attendance or worklog)
			handleCurrentWeek();
		} else if (input === 'r') {
			// Refresh data, but stay in the same mode
			refresh();
		} else if (input === 'l' && onLogWork) {
			onLogWork();
		} else if (input === 'i') {
			// Start work (checkin)
			setActiveArea('checkin-confirmation');
		} else if (input === 'o') {
			// End work (checkout)
			setActiveArea('checkout-confirmation');
		} else if (input === 'a') {
			// Add worklog for arbitrary issue
			handleAddWorklog();
		}
		// Note: ESC key is handled by App.tsx to avoid conflicts
		// Note: Arrow keys are handled by TimetableGrid for cell navigation when table is active
	});

	return (
		<Box flexDirection="column" height={40}>
			{/* Header Area - Fixed Height */}
			<Box height={8} flexDirection="column">
				{/* JIRACLE Rainbow Banner */}
				<Box justifyContent="center" paddingY={1}>
					<Gradient key="weekly-gradient" name="rainbow">
						<BigText text="JIRACLE" font="tiny" />
					</Gradient>
				</Box>

				{/* Show title based on current mode */}
				{worklogForm.isVisible ? (
					<TitleBar
						title={`${worklogForm.issueKey} on ${formatDate(worklogForm.date)}`}
					/>
				) : activeArea === 'delete-confirmation' && deleteCandidate ? (
					<TitleBar
						title={`Delete worklogs for ${deleteCandidate.issueKey}`}
						color="red"
					/>
				) : activeArea === 'delete-attendance-confirmation' &&
				  deleteAttendanceCandidate ? (
					<TitleBar
						title={`Delete attendance for ${formatDate(
							deleteAttendanceCandidate.date,
						)}`}
						color="red"
					/>
				) : activeArea === 'attendance-edit' && attendanceEdit ? (
					<TitleBar
						title={`Anwesenheit - ${formatDate(attendanceEdit.date)}`}
					/>
				) : (
					<TitleBar title={getWeekTitle(currentWeek)} />
				)}

				{/* Error Display */}
				{error && (
					<Box justifyContent="center" paddingY={1}>
						<Text color="red">Error: {error}</Text>
					</Box>
				)}
			</Box>

			{/* Main Content Area - Fixed Height */}
			<Box height={25} flexDirection="column">
				{/* Extra spacing between week navigator and table - only when not in form or delete mode */}
				{!worklogForm.isVisible &&
					activeArea !== 'delete-confirmation' &&
					activeArea !== 'delete-attendance-confirmation' && (
						<Box paddingY={1} />
					)}

				{/* Conditional content: table, form, delete confirmation, or attendance edit */}
				{worklogForm.isVisible ? (
					/* Inline Worklog Form - replaces table */
					<Box justifyContent="center">
						<Box
							width={68}
							{...(!worklogSubmitting && {
								borderStyle: 'round',
								borderColor: 'cyan',
							})}
							paddingX={1}
							paddingY={1}
						>
							<InlineWorklogForm
								issueKey={worklogForm.issueKey}
								date={worklogForm.date}
								defaultTimeSpent={worklogForm.timeSpent}
								defaultComment={worklogForm.comment}
								onSubmit={handleWorklogSubmit}
								onCancel={handleWorklogCancel}
								isSubmitting={worklogSubmitting}
								error={worklogError}
								config={config}
								isFavorite={config?.favorites?.some(
									fav => fav.key === worklogForm.issueKey,
								)}
								isIssueKeyEditable={worklogForm.isIssueKeyEditable}
							/>
						</Box>
					</Box>
				) : activeArea === 'delete-confirmation' && deleteCandidate ? (
					/* Delete Confirmation - replaces table */
					<Box justifyContent="center">
						<Box
							width={68}
							borderStyle="round"
							borderColor="red"
							paddingX={1}
							paddingY={1}
						>
							{isDeleting ? (
								<Box flexDirection="row" alignItems="center">
									<Spinner />
									<Text> Deleting worklogs...</Text>
								</Box>
							) : (
								<DeleteWorklogConfirmation
									issueKey={deleteCandidate.issueKey}
									dayLabel={formatDate(deleteCandidate.date)}
									onConfirm={handleDeleteConfirm}
								/>
							)}
						</Box>
					</Box>
				) : activeArea === 'delete-attendance-confirmation' &&
				  deleteAttendanceCandidate ? (
					/* Delete Attendance Confirmation - replaces table */
					<Box justifyContent="center">
						<Box
							width={68}
							borderStyle="round"
							borderColor="red"
							paddingX={2}
							paddingY={1}
						>
							{isDeletingAttendance ? (
								<Box flexDirection="row" alignItems="center">
									<Spinner />
									<Text> Deleting attendance...</Text>
								</Box>
							) : (
								<DeleteAttendanceConfirmation
									dayLabel={formatDate(deleteAttendanceCandidate.date)}
									onConfirm={handleDeleteAttendanceConfirm}
								/>
							)}
						</Box>
					</Box>
				) : activeArea === 'checkin-confirmation' ? (
					/* Checkin Confirmation - replaces table */
					<Box justifyContent="center">
						<Box
							width={50}
							borderStyle="round"
							borderColor="cyan"
							paddingX={1}
							paddingY={1}
						>
							<CheckinConfirmation onConfirm={handleCheckinConfirm} />
						</Box>
					</Box>
				) : activeArea === 'checkout-confirmation' ? (
					/* Checkout Confirmation - replaces table */
					<Box justifyContent="center">
						<Box
							width={50}
							borderStyle="round"
							borderColor="yellow"
							paddingX={1}
							paddingY={1}
						>
							<CheckoutConfirmation onConfirm={handleCheckoutConfirm} />
						</Box>
					</Box>
				) : activeArea === 'attendance-edit' && attendanceEdit ? (
					/* Attendance Edit Form - replaces table */
					<Box justifyContent="center">
						<Box
							width={50}
							borderStyle="round"
							borderColor="cyan"
							paddingX={1}
							paddingY={1}
						>
							<AttendanceEditForm
								date={attendanceEdit.date}
								initialData={attendanceEdit.data}
								onSubmit={handleAttendanceSubmit}
								onCancel={handleAttendanceCancel}
								config={config}
							/>
						</Box>
					</Box>
				) : (
					/* Timetable Grid */
					<TimetableGrid
						data={displayData}
						isLoading={displayLoading}
						onWeekChange={direction => {
							if (direction === 'prev') {
								navigateToPreviousWeek();
							} else {
								navigateToNextWeek();
							}
						}}
						onCellWorklog={handleCellWorklog}
						onCellDelete={handleCellDelete}
						onAttendanceEdit={handleAttendanceEdit}
						onAttendanceDelete={handleDeleteAttendance}
						onOpenInBrowser={handleOpenInBrowser}
						isActive={activeArea === 'timetable'}
						favoriteIssues={config.favorites}
						config={config}
						attendanceManager={attendanceManager || undefined}
						attendanceRefreshKey={attendanceRefreshKey}
					/>
				)}

				{/* Delete error alert */}
				{deleteError && (
					<Alert variant="error" title="Delete failed">
						{deleteError}
					</Alert>
				)}
			</Box>

			{/* Footer Area - Fixed Height */}
			<Box
				height={7}
				justifyContent="center"
				flexDirection="column"
				alignItems="center"
			>
				{worklogForm.isVisible ? (
					<Text color="gray">
						[↑↓] Select Time [Tab] Switch Areas [Enter] Submit [Esc] Cancel
					</Text>
				) : (
					<>
						<Text color="gray">
							[↑↓←→] Navigate Cells [Enter] Log Work [A] Add Worklog [Shift+←→]
							Week Navigation
						</Text>
						<Text color="gray">
							[D] Delete Worklogs [I] Check In [O] Check Out
							{isBrowserOpenSupported() && config.jiraUrl
								? ' [Shift+O] Open in Browser'
								: ''}
						</Text>
						<Text color="gray">[T] Today [R] Refresh [Q] Quit</Text>
					</>
				)}
			</Box>
		</Box>
	);
}
