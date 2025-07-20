import React, {useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import {Alert} from '@inkjs/ui';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import {TimetableGrid} from './TimetableGrid.js';
import {TitleBar} from './TitleBar.js';
import {
	DeleteWorklogConfirmationArea,
	DeleteAttendanceConfirmationArea,
	CheckinConfirmationArea,
	CheckoutConfirmationArea,
	AlignTimeConfirmationArea,
	WorklogFormArea,
	AttendanceEditFormArea,
} from './areas/index.js';
import {NotificationBar} from './NotificationBar.js';
import {useWeeklyWorklogSummary} from '../hooks/useWeeklyWorklogSummary.js';
import {useWorklogForm} from '../hooks/useWorklogForm.js';
import {useDeleteOperations} from '../hooks/useDeleteOperations.js';
import {useAttendanceManagement} from '../hooks/useAttendanceManagement.js';
import {useNavigationState} from '../hooks/useNavigationState.js';
import {useTitleResolver} from '../hooks/useTitleResolver.js';
import {useActiveAreaResolver} from '../hooks/useActiveAreaResolver.js';
import {useRemainingTimeAlignment} from '../hooks/useRemainingTimeAlignment.js';
import {useNotification} from '../hooks/useNotification.js';
import type {JiraConfig} from '../jira-client.js';
import {getStartOfWeek, getEndOfWeek} from '../utils/date.js';
import {
	isBrowserOpenSupported,
	openInBrowser,
	generateJiraIssueUrl,
} from '../utils/browser.js';

export interface WeeklyTimetableViewProps {
	onBack: () => void;
	config: JiraConfig;
	userEmail?: string | null;
}

export function WeeklyTimetableView({
	onBack,
	config,
	userEmail,
}: WeeklyTimetableViewProps) {
	// Navigation state management
	const {
		currentWeek,
		activeArea,
		navigateToPreviousWeek,
		navigateToNextWeek,
		navigateToCurrentWeek,
		setActiveArea,
	} = useNavigationState();

	// Format date for display (German)
	const formatDate = (date: Date) => {
		const days = [
			'Sonntag',
			'Montag',
			'Dienstag',
			'Mittwoch',
			'Donnerstag',
			'Freitag',
			'Samstag',
		];
		const months = [
			'Jan',
			'Feb',
			'Mär',
			'Apr',
			'Mai',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Okt',
			'Nov',
			'Dez',
		];
		return `${days[date.getDay()]}, ${date.getDate()}. ${
			months[date.getMonth()]
		}`;
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

	// Worklog form state management
	const {
		worklogForm,
		worklogSubmitting,
		worklogError,
		handleCellWorklog,
		handleAddWorklog,
		handleWorklogSubmit,
		handleWorklogCancel,
	} = useWorklogForm({
		config,
		userEmail,
		onRefresh: refresh,
		onActiveAreaChange: (area: string) => setActiveArea(area as any),
		data,
	});

	// Attendance management state
	const {
		attendanceManager,
		attendanceRefreshKey,
		attendanceEdit,
		handleAttendanceEdit,
		handleAttendanceSubmit,
		handleAttendanceCancel,
		handleCheckinConfirm,
		handleCheckoutConfirm,
		refreshAttendance,
	} = useAttendanceManagement({
		config,
		onRefresh: refresh,
		onActiveAreaChange: (area: string) => setActiveArea(area as any),
	});

	// Delete operations state management
	const {
		deleteCandidate,
		deleteAttendanceCandidate,
		isDeleting,
		isDeletingAttendance,
		deleteError,
		handleCellDelete,
		handleDeleteAttendance,
		handleDeleteConfirm,
		handleDeleteAttendanceConfirm,
	} = useDeleteOperations({
		config,
		userEmail,
		onRefresh: refresh,
		onActiveAreaChange: (area: string) => setActiveArea(area as any),
		attendanceManager,
		onAttendanceRefresh: refreshAttendance,
	});

	// Title resolution
	const {title: resolvedTitle, titleColor} = useTitleResolver({
		currentWeek,
		worklogForm,
		deleteCandidate,
		deleteAttendanceCandidate,
		attendanceEdit,
		activeArea,
	});

	// Active area resolution
	const resolvedActiveArea = useActiveAreaResolver({
		activeArea,
		worklogForm,
		deleteCandidate,
		deleteAttendanceCandidate,
		attendanceEdit,
	});

	// Notification system
	const {notifications, showNotification} = useNotification();

	// Remaining time alignment
	const {alignRemainingTime, previewAlignment} = useRemainingTimeAlignment({
		config,
		userEmail,
		onRefresh: refresh,
		onNotification: showNotification,
	});

	// Alignment confirmation state
	const [alignmentConfirmation, setAlignmentConfirmation] = React.useState<{
		date: Date;
		dailySummary: any;
		previewData: {
			result: any;
			attendanceHours: number;
			currentLoggedHours: number;
			remainingHours: number;
			strategy: 'even' | 'proportional';
		};
	} | null>(null);
	const [isAligning, setIsAligning] = React.useState(false);

	// Always use fresh data from the hook
	const displayData = data;
	const displayLoading = isLoading;

	// Refresh data when component mounts
	useEffect(() => {
		// Small delay to ensure component is fully mounted
		const timer = setTimeout(() => {
			refresh();
		}, 100);

		return () => clearTimeout(timer);
	}, []); // Empty dependency array means this runs only on mount

	const handleOpenInBrowser = async (issueKey: string) => {
		if (!config.jiraUrl) return;
		try {
			const url = generateJiraIssueUrl(config.jiraUrl, issueKey);
			await openInBrowser(url);
		} catch (error) {
			console.error('Failed to open browser:', error);
		}
	};

	const handleAlignRemainingTime = async (date: Date) => {
		if (!displayData) return;

		// Find the daily summary for the selected date
		const dailySummary = displayData.dailySummaries.find(
			summary => summary.date.toDateString() === date.toDateString(),
		);

		// Get preview data for confirmation dialog
		const previewData = await previewAlignment(date, dailySummary || null);
		if (!previewData) return;

		// Show confirmation dialog
		setAlignmentConfirmation({
			date,
			dailySummary: dailySummary || null,
			previewData,
		});
		setActiveArea('align-time-confirmation');
	};

	const handleAlignmentConfirm = async (confirmed: boolean) => {
		if (!confirmed || !alignmentConfirmation) {
			// Cancel - return to timetable
			setAlignmentConfirmation(null);
			setActiveArea('timetable');
			return;
		}

		// Execute alignment
		setIsAligning(true);
		try {
			await alignRemainingTime(
				alignmentConfirmation.date,
				alignmentConfirmation.dailySummary,
			);
		} finally {
			setIsAligning(false);
			setAlignmentConfirmation(null);
			setActiveArea('timetable');
		}
	};

	useInput(input => {
		// Don't handle input if forms are visible or delete confirmation is active
		if (
			worklogForm.isVisible ||
			activeArea === 'delete-confirmation' ||
			activeArea === 'delete-attendance-confirmation' ||
			activeArea === 'attendance-edit' ||
			activeArea === 'checkin-confirmation' ||
			activeArea === 'checkout-confirmation' ||
			activeArea === 'align-time-confirmation'
		) {
			return;
		}

		// Note: Tab navigation is now handled by normal Ink focus management

		if (input === 'q') {
			onBack();
		} else if (input === 't') {
			// Go to current week, but stay in the same mode (attendance or worklog)
			navigateToCurrentWeek();
		} else if (input === 'r') {
			// Refresh data, but stay in the same mode
			refresh();
		} else if (input === 'l') {
			handleAddWorklog();
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
		<Box flexDirection="column" height={55}>
			{/* Header Area - Fixed Height */}
			<Box height={8} flexDirection="column">
				{/* JIRACLE Rainbow Banner */}
				<Box justifyContent="center" paddingY={1}>
					<Gradient key="weekly-gradient" name="rainbow">
						<BigText text="JIRACLE" font="tiny" />
					</Gradient>
				</Box>

				{/* Show title based on current mode */}
				<TitleBar title={resolvedTitle} color={titleColor} />

				{/* Error Display */}
				{error && (
					<Box justifyContent="center" paddingY={1}>
						<Text color="red">Error: {error}</Text>
					</Box>
				)}
			</Box>

			{/* Main Content Area - Fixed Height */}
			<Box height={40} flexDirection="column">
				{/* Extra spacing between week navigator and table - only when showing timetable */}
				{resolvedActiveArea === 'timetable' && <Box paddingY={1} />}

				{/* Conditional content: table, form, delete confirmation, or attendance edit */}
				{(() => {
					switch (resolvedActiveArea) {
						case 'worklog-form':
							return (
								<WorklogFormArea
									worklogForm={worklogForm}
									worklogSubmitting={worklogSubmitting}
									worklogError={worklogError}
									config={config}
									onSubmit={handleWorklogSubmit}
									onCancel={handleWorklogCancel}
								/>
							);

						case 'delete-confirmation':
							return (
								<DeleteWorklogConfirmationArea
									deleteCandidate={deleteCandidate!}
									isDeleting={isDeleting}
									onConfirm={handleDeleteConfirm}
									formatDate={formatDate}
								/>
							);

						case 'delete-attendance-confirmation':
							return (
								<DeleteAttendanceConfirmationArea
									deleteAttendanceCandidate={deleteAttendanceCandidate!}
									isDeletingAttendance={isDeletingAttendance}
									onConfirm={handleDeleteAttendanceConfirm}
									formatDate={formatDate}
								/>
							);

						case 'checkin-confirmation':
							return (
								<CheckinConfirmationArea onConfirm={handleCheckinConfirm} />
							);

						case 'checkout-confirmation':
							return (
								<CheckoutConfirmationArea onConfirm={handleCheckoutConfirm} />
							);

						case 'align-time-confirmation':
							return alignmentConfirmation ? (
								<AlignTimeConfirmationArea
									dayLabel={formatDate(alignmentConfirmation.date)}
									attendanceHours={
										alignmentConfirmation.previewData.attendanceHours
									}
									currentLoggedHours={
										alignmentConfirmation.previewData.currentLoggedHours
									}
									remainingHours={
										alignmentConfirmation.previewData.remainingHours
									}
									strategy={alignmentConfirmation.previewData.strategy}
									previewResult={alignmentConfirmation.previewData.result}
									isAligning={isAligning}
									onConfirm={handleAlignmentConfirm}
								/>
							) : null;

						case 'attendance-edit':
							return (
								<AttendanceEditFormArea
									attendanceEdit={attendanceEdit!}
									config={config}
									onSubmit={handleAttendanceSubmit}
									onCancel={handleAttendanceCancel}
								/>
							);

						default:
							return (
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
									onAlignRemainingTime={handleAlignRemainingTime}
									isActive={activeArea === 'timetable'}
									favoriteIssues={config.favorites}
									config={config}
									attendanceManager={attendanceManager || undefined}
									attendanceRefreshKey={attendanceRefreshKey}
								/>
							);
					}
				})()}

				{/* Delete error alert */}
				{deleteError && (
					<Alert variant="error" title="Delete failed">
						{deleteError}
					</Alert>
				)}

				{/* Notification bar */}
				<NotificationBar notifications={notifications} />
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
							[D] Delete Worklogs [F] Fill Time [I] Check In [O] Check Out
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
