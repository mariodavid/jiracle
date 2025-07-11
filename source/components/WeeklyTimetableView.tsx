import React, {useState, useEffect, useCallback} from 'react';
import {Box, Text, useInput} from 'ink';
import {Alert, Spinner} from '@inkjs/ui';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import {WeekNavigator, getWeekTitle} from './WeekNavigator.js';
import {TimetableGrid} from './TimetableGrid.js';
import {InlineWorklogForm} from './InlineWorklogForm.js';
import {DeleteWorklogConfirmation} from './DeleteWorklogConfirmation.js';
import {TitleBar} from './TitleBar.js';
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

interface WorklogFormData {
	issueKey: string;
	date: Date;
	timeSpent: string;
	comment: string;
	isVisible: boolean;
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
		| 'prev-week'
		| 'timetable'
		| 'next-week'
		| 'worklog-form'
		| 'delete-confirmation'
	>('timetable');
	const [shouldFocusCell, setShouldFocusCell] = useState(true);
	const [worklogForm, setWorklogForm] = useState<WorklogFormData>({
		issueKey: '',
		date: new Date(),
		timeSpent: '1h',
		comment: '',
		isVisible: false,
	});
	const [worklogSubmitting, setWorklogSubmitting] = useState(false);
	const [worklogError, setWorklogError] = useState<string | null>(null);
	const [deleteCandidate, setDeleteCandidate] = useState<{
		issueKey: string;
		date: Date;
	} | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteSuccess, setDeleteSuccess] = useState<{
		issueKey: string;
		count: number;
	} | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);

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

	// Refresh data when component mounts
	useEffect(() => {
		// Small delay to ensure component is fully mounted
		const timer = setTimeout(() => {
			refresh();
		}, 100);

		return () => clearTimeout(timer);
	}, []); // Empty dependency array means this runs only on mount

	// Auto-focus cell when data is loaded
	useEffect(() => {
		if (
			displayData &&
			!isLoading &&
			activeArea === 'timetable' &&
			!worklogForm.isVisible
		) {
			setShouldFocusCell(true);
		}
	}, [displayData, isLoading, activeArea, worklogForm.isVisible]);

	const navigateToPreviousWeek = () => {
		const newWeek = new Date(currentWeek);
		newWeek.setDate(currentWeek.getDate() - 7);
		setCurrentWeek(newWeek);
	};

	const navigateToNextWeek = () => {
		const newWeek = new Date(currentWeek);
		newWeek.setDate(currentWeek.getDate() + 7);
		setCurrentWeek(newWeek);
	};

	const handleCurrentWeek = () => {
		setCurrentWeek(new Date());
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
		});
		setWorklogError(null); // Clear any previous error
		setActiveArea('worklog-form');
	};

	const handleWorklogSubmit = useCallback(
		async (data: {timeSpent: string; comment: string}) => {
			// Immediate guard against double submission
			if (worklogSubmitting) {
				console.log('WeeklyTimetableView: Blocked duplicate submission');
				return;
			}

			console.log('WeeklyTimetableView: handleWorklogSubmit called', {
				issueKey: worklogForm.issueKey,
				timeSpent: data.timeSpent,
				comment: data.comment,
				timestamp: new Date().toISOString(),
			});

			setWorklogSubmitting(true);
			setWorklogError(null);

			try {
				// Create Jira client
				const client = new JiraClient(config);

				// Format the date to match Jira's expected format
				const selectedDateTime = new Date(worklogForm.date);
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

				await client.addWorklog(worklogForm.issueKey, worklogData);

				console.log('WeeklyTimetableView: Worklog submitted successfully', {
					issueKey: worklogForm.issueKey,
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
		[
			worklogForm.issueKey,
			worklogForm.date,
			config,
			worklogSubmitting,
			refresh,
		],
	);

	const handleWorklogCancel = () => {
		setWorklogForm(prev => ({...prev, isVisible: false}));
		setActiveArea('timetable');
	};

	const handleCellDelete = (data: {issueKey: string; date: Date}) => {
		setDeleteCandidate(data);
		setActiveArea('delete-confirmation');
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

			console.log(
				`Found ${worklogsToDelete.length} worklogs to delete for ${deleteCandidate.issueKey} on ${targetDateString}`,
			);

			// Delete each matching worklog
			for (const worklog of worklogsToDelete) {
				console.log(
					`Deleting worklog ${worklog.id} (${worklog.timeSpentSeconds}s)`,
				);
				await jiraClient.deleteWorklog(deleteCandidate.issueKey, worklog.id);
			}

			// Refresh the data
			refresh();

			// Show success alert
			setDeleteSuccess({
				issueKey: deleteCandidate.issueKey,
				count: worklogsToDelete.length,
			});
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

	// Auto-hide delete success alert after 3 seconds
	useEffect(() => {
		if (deleteSuccess) {
			const timer = setTimeout(() => {
				setDeleteSuccess(null);
			}, 3000);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [deleteSuccess]);

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

	useInput((input, key) => {
		// Don't handle input if worklog form is visible or delete confirmation is active
		if (worklogForm.isVisible || activeArea === 'delete-confirmation') {
			return;
		}

		// Handle Tab with highest priority to prevent default behavior
		if (key.tab) {
			// Check if table has data to decide if it should be focusable
			const hasTableData = displayData && displayData.dailySummaries.length > 0;

			// Tab navigation between focus areas
			if (activeArea === 'prev-week') {
				if (hasTableData) {
					setActiveArea('timetable');
					setShouldFocusCell(true);
				} else {
					// Skip table if no data, go directly to next-week
					setActiveArea('next-week');
					setShouldFocusCell(false);
				}
			} else if (activeArea === 'timetable') {
				setActiveArea('next-week');
				setShouldFocusCell(false);
			} else {
				setActiveArea('prev-week');
				setShouldFocusCell(false);
			}
			return; // Prevent further processing
		}

		if (input === 'q') {
			onBack();
		} else if (input === 't') {
			handleCurrentWeek();
		} else if (input === 'r') {
			refresh();
		} else if (input === 'l' && onLogWork) {
			onLogWork();
		} else if (key.return) {
			// Handle Enter for navigation buttons
			if (activeArea === 'prev-week') {
				navigateToPreviousWeek();
			} else if (activeArea === 'next-week') {
				navigateToNextWeek();
			}
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

				{/* Week Navigator - only when not in form or delete mode */}
				{!worklogForm.isVisible && activeArea !== 'delete-confirmation' && (
					<WeekNavigator
						currentWeek={currentWeek}
						onPreviousWeek={navigateToPreviousWeek}
						onNextWeek={navigateToNextWeek}
						onCurrentWeek={handleCurrentWeek}
						activeArea={
							activeArea === 'worklog-form' ||
							(activeArea as string) === 'delete-confirmation'
								? 'timetable'
								: (activeArea as 'prev-week' | 'timetable' | 'next-week')
						}
					/>
				)}

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
				{!worklogForm.isVisible && activeArea !== 'delete-confirmation' && (
					<Box paddingY={1} />
				)}

				{/* Conditional content: table, form, or delete confirmation */}
				{worklogForm.isVisible ? (
					/* Inline Worklog Form - replaces table */
					<Box justifyContent="center">
						<Box
							width={68}
							borderStyle="round"
							borderColor="cyan"
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
						isActive={activeArea === 'timetable'}
						shouldFocusCell={shouldFocusCell}
						onCellFocused={() => setShouldFocusCell(false)}
						favoriteIssues={config.favorites}
					/>
				)}

				{/* Delete success alert */}
				{deleteSuccess && (
					<Alert variant="success" title="Worklogs deleted">
						{deleteSuccess.count > 0
							? `Successfully deleted ${deleteSuccess.count} worklog${
									deleteSuccess.count === 1 ? '' : 's'
							  } for ${deleteSuccess.issueKey}`
							: `No worklogs found to delete for ${deleteSuccess.issueKey}`}
					</Alert>
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
							[↑↓←→] Navigate Cells [Enter] Log Work [Shift+←→] Week Navigation
						</Text>
						<Text color="gray">
							[D] Delete Worklogs [T] Today [R] Refresh [Q] Quit
						</Text>
					</>
				)}
			</Box>
		</Box>
	);
}
