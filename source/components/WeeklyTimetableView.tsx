import React, {useMemo, useCallback, useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import {Alert} from '@inkjs/ui';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import {useWeeklyWorklogSummary} from '../hooks/useWeeklyWorklogSummary.js';
import {useWorklogForm} from '../hooks/useWorklogForm.js';
import {useDeleteOperations} from '../hooks/useDeleteOperations.js';
import {useAttendanceManagement} from '../hooks/useAttendanceManagement.js';
import {useNavigationState} from '../hooks/useNavigationState.js';
import {useTitleResolver} from '../hooks/useTitleResolver.js';
import {useActiveAreaResolver} from '../hooks/useActiveAreaResolver.js';
import {useNotification} from '../hooks/useNotification.js';
import {useVacationManagement} from '../hooks/useVacationManagement.js';
import type {LocalDate} from '../domain/LocalDate.js';
import type {VacationEntry} from '../domain/VacationEntry.js';
import {JiraClient, type JiraConfig} from '../jira-client.js';
import {useSAPExport} from '../hooks/useSAPExport.js';
import type {IssueKey} from '../domain/IssueKey.js';
import {openInBrowser, generateJiraIssueUrl} from '../utils/browser.js';
import {NotificationBar} from './NotificationBar.js';
import {
	DeleteWorklogConfirmationArea,
	DeleteAttendanceConfirmationArea,
	CheckinConfirmationArea,
	CheckoutConfirmationArea,
	WorklogFormArea,
	AttendanceEditFormArea,
} from './areas/index.js';
import {TitleBar} from './TitleBar.js';
import {TimetableGrid} from './TimetableGrid.js';
import {StatisticsView} from './StatisticsView.js';
import {SAPExportView} from './SAPExportView.js';
import {HelpText} from './HelpText.js';
import {VacationListView, groupVacationDates} from './VacationListView.js';
import {VacationEntryForm} from './VacationEntryForm.js';

export type WeeklyTimetableViewProps = {
	onBack: () => void;
	config: JiraConfig;
	userEmail?: string | undefined;
};

export function WeeklyTimetableView({
	onBack,
	config,
	userEmail,
}: WeeklyTimetableViewProps) {
	// Create JiraClient instance (memoized to prevent infinite loops)
	const jiraClient = useMemo(() => new JiraClient(config), [config]);

	// SAP export functionality
	const {handleExport: handleSAPExport} = useSAPExport(config);

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
	const formatDate = (date: LocalDate) => {
		const dateObject: Date = date.toDate();
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
		const dayName = days[dateObject.getDay()] ?? 'Unknown';
		const monthName = months[dateObject.getMonth()] ?? 'Unknown';
		return `${dayName}, ${dateObject.getDate()}. ${monthName}`;
	};

	const weekRange = currentWeek;

	// Memoize favoriteIssues to prevent unnecessary re-renders
	const favoriteIssues = useMemo(
		() => config.favorites ?? [],
		[config.favorites],
	);

	// Memoize the activeArea change callback to prevent infinite re-renders
	const handleActiveAreaChange = useCallback(
		(area: string) => {
			setActiveArea(area as any);
		},
		[setActiveArea],
	);

	const {data, isLoading, error, refresh} = useWeeklyWorklogSummary({
		weekRange,
		config,
		skipAutoLoad: false, // Always load fresh data when component mounts
		userEmail: userEmail ?? undefined,
		favoriteIssues,
	});

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
		onActiveAreaChange: handleActiveAreaChange,
		data: data ?? undefined,
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
		onActiveAreaChange: handleActiveAreaChange,
	});

	// Vacation management state
	const {addVacationDays, removeVacationDays} = useVacationManagement({
		attendanceManager,
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
		onActiveAreaChange: handleActiveAreaChange,
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
	const {notifications} = useNotification();

	// State for bonus tab availability
	const [showBonusTab, setShowBonusTab] = useState<boolean>(false);

	// State for vacation entries
	const [vacationEntries, setVacationEntries] = useState<VacationEntry[]>([]);

	// Always use fresh data from the hook
	const displayData = data;
	const displayLoading = isLoading;

	// Load vacation entries when vacation list area is active
	useEffect(() => {
		const loadVacationEntries = async () => {
			if (activeArea === 'vacation-list' && attendanceManager) {
				try {
					const allAttendance = await attendanceManager.getAllAttendance();
					const entries = groupVacationDates(allAttendance);
					setVacationEntries(entries);
				} catch (error: unknown) {
					console.error('Failed to load vacation entries:', error);
					setVacationEntries([]);
				}
			}
		};

		void loadVacationEntries();
	}, [activeArea, attendanceManager, attendanceRefreshKey]);

	// Refresh data when component mounts - DISABLED to prevent render loop
	// useEffect(() => {
	// 	// Small delay to ensure component is fully mounted
	// 	const timer = setTimeout(() => {
	// 		refresh();
	// 	}, 100);

	// 	return () => {
	// 		clearTimeout(timer);
	// 	};
	// }, []); // Empty dependency array means this runs only on mount

	const handleOpenInBrowser = async (issueKey: IssueKey) => {
		if (!config.jiraUrl) return;
		try {
			const url = generateJiraIssueUrl(config.jiraUrl, issueKey);
			await openInBrowser(url);
		} catch (error: unknown) {
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
			activeArea === 'checkout-confirmation' ||
			activeArea === 'statistics' ||
			activeArea === 'sap-export' ||
			activeArea === 'vacation-list' ||
			activeArea === 'vacation-form'
		) {
			return;
		}

		// Note: Tab navigation is now handled by normal Ink focus management

		switch (input) {
			case 'q': {
				onBack();
				break;
			}

			case 't': {
				// Go to current week, but stay in the same mode (attendance or worklog)
				navigateToCurrentWeek();
				break;
			}

			case 'r': {
				// Refresh data, but stay in the same mode
				refresh();
				break;
			}

			case 'l': {
				handleAddWorklog();
				break;
			}

			case 'i': {
				// Start work (checkin)
				setActiveArea('checkin-confirmation');
				break;
			}

			case 'o': {
				// End work (checkout)
				setActiveArea('checkout-confirmation');
				break;
			}

			case 'a': {
				// Add worklog for arbitrary issue
				handleAddWorklog();
				break;
			}

			case 's': {
				// Show statistics view
				setActiveArea('statistics');
				break;
			}

			case 'e': {
				// Export to SAP S/4HANA
				setActiveArea('sap-export');
				break;
			}

			case 'h': {
				// Show vacation list (holiday)
				setActiveArea('vacation-list');
				break;
			}

			default: {
				// No action for other keys
				break;
			}
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
				{/* Conditional content: table, form, delete confirmation, or attendance edit */}
				{(() => {
					switch (resolvedActiveArea) {
						case 'worklog-form': {
							return (
								<WorklogFormArea
									worklogForm={worklogForm}
									worklogSubmitting={worklogSubmitting}
									worklogError={worklogError}
									config={config}
									jiraClient={jiraClient}
									onSubmit={handleWorklogSubmit}
									onCancel={handleWorklogCancel}
								/>
							);
						}

						case 'delete-confirmation': {
							return (
								<DeleteWorklogConfirmationArea
									deleteCandidate={deleteCandidate!}
									isDeleting={isDeleting}
									formatDate={formatDate}
									onConfirm={handleDeleteConfirm}
								/>
							);
						}

						case 'delete-attendance-confirmation': {
							return (
								<DeleteAttendanceConfirmationArea
									deleteAttendanceCandidate={deleteAttendanceCandidate!}
									isDeletingAttendance={isDeletingAttendance}
									formatDate={formatDate}
									onConfirm={handleDeleteAttendanceConfirm}
								/>
							);
						}

						case 'checkin-confirmation': {
							return (
								<CheckinConfirmationArea onConfirm={handleCheckinConfirm} />
							);
						}

						case 'checkout-confirmation': {
							return (
								<CheckoutConfirmationArea onConfirm={handleCheckoutConfirm} />
							);
						}

						case 'attendance-edit': {
							return (
								<AttendanceEditFormArea
									attendanceEdit={attendanceEdit!}
									config={config}
									worklogData={data}
									onSubmit={handleAttendanceSubmit}
									onCancel={handleAttendanceCancel}
								/>
							);
						}

						case 'statistics': {
							return (
								<StatisticsView
									config={config}
									onBack={() => {
										setActiveArea('timetable');
									}}
									onBonusTabChange={setShowBonusTab}
								/>
							);
						}

						case 'sap-export': {
							return (
								<SAPExportView
									config={config}
									onBack={() => {
										setActiveArea('timetable');
									}}
									onExport={handleSAPExport}
								/>
							);
						}

						case 'vacation-list': {
							return (
								<VacationListView
									vacationEntries={vacationEntries}
									currentYear={new Date().getFullYear()}
									onAddVacation={() => {
										setActiveArea('vacation-form');
									}}
									onRemoveVacation={async startDate => {
										try {
											await removeVacationDays(startDate);
											refreshAttendance();
										} catch (error: unknown) {
											console.error('Failed to remove vacation:', error);
										}
									}}
									onBack={() => {
										setActiveArea('timetable');
									}}
								/>
							);
						}

						case 'vacation-form': {
							return (
								<VacationEntryForm
									onSave={async (startDate, endDate) => {
										try {
											await addVacationDays(startDate, endDate);
											refreshAttendance();
											setActiveArea('vacation-list');
										} catch (error: unknown) {
											console.error('Failed to save vacation:', error);
										}
									}}
									onCancel={() => {
										setActiveArea('vacation-list');
									}}
								/>
							);
						}

						default: {
							return (
								<TimetableGrid
									data={displayData}
									isLoading={displayLoading}
									isActive={activeArea === 'timetable'}
									favoriteIssues={config.favorites}
									config={config}
									attendanceManager={attendanceManager ?? undefined}
									attendanceRefreshKey={attendanceRefreshKey}
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
								/>
							);
						}
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
			<HelpText
				activeArea={resolvedActiveArea}
				config={config}
				showBonusTab={showBonusTab}
			/>
		</Box>
	);
}
