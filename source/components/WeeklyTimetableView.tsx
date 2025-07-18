import React, {useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import {Alert} from '@inkjs/ui';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import {TimetableGrid} from './TimetableGrid.js';
import {InlineWorklogForm} from './InlineWorklogForm.js';
import {DeleteWorklogConfirmation} from './DeleteWorklogConfirmation.js';
import {DeleteAttendanceConfirmation} from './DeleteAttendanceConfirmation.js';
import {CheckinConfirmation} from './CheckinConfirmation.js';
import {CheckoutConfirmation} from './CheckoutConfirmation.js';
import {ConfirmationDialog} from './ConfirmationDialog.js';
import {TitleBar} from './TitleBar.js';
import {AttendanceEditForm} from './AttendanceEditForm.js';
import {useWeeklyWorklogSummary} from '../hooks/useWeeklyWorklogSummary.js';
import {useWorklogForm} from '../hooks/useWorklogForm.js';
import {useDeleteOperations} from '../hooks/useDeleteOperations.js';
import {useAttendanceManagement} from '../hooks/useAttendanceManagement.js';
import {useNavigationState} from '../hooks/useNavigationState.js';
import {useTitleResolver} from '../hooks/useTitleResolver.js';
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
								isEditMode={worklogForm.isEditMode}
								worklogId={worklogForm.worklogId}
							/>
						</Box>
					</Box>
				) : activeArea === 'delete-confirmation' && deleteCandidate ? (
					/* Delete Confirmation - replaces table */
					<ConfirmationDialog
						width={68}
						borderColor="red"
						isLoading={isDeleting}
						loadingText="Deleting worklogs..."
					>
						<DeleteWorklogConfirmation
							issueKey={deleteCandidate.issueKey}
							dayLabel={formatDate(deleteCandidate.date)}
							onConfirm={handleDeleteConfirm}
						/>
					</ConfirmationDialog>
				) : activeArea === 'delete-attendance-confirmation' &&
				  deleteAttendanceCandidate ? (
					/* Delete Attendance Confirmation - replaces table */
					<ConfirmationDialog
						width={68}
						borderColor="red"
						paddingX={2}
						isLoading={isDeletingAttendance}
						loadingText="Deleting attendance..."
					>
						<DeleteAttendanceConfirmation
							dayLabel={formatDate(deleteAttendanceCandidate.date)}
							onConfirm={handleDeleteAttendanceConfirm}
						/>
					</ConfirmationDialog>
				) : activeArea === 'checkin-confirmation' ? (
					/* Checkin Confirmation - replaces table */
					<ConfirmationDialog width={50} borderColor="cyan">
						<CheckinConfirmation onConfirm={handleCheckinConfirm} />
					</ConfirmationDialog>
				) : activeArea === 'checkout-confirmation' ? (
					/* Checkout Confirmation - replaces table */
					<ConfirmationDialog width={50} borderColor="yellow">
						<CheckoutConfirmation onConfirm={handleCheckoutConfirm} />
					</ConfirmationDialog>
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
