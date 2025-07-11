import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import {WeekNavigator} from './WeekNavigator.js';
import {TimetableGrid} from './TimetableGrid.js';
import {InlineWorklogForm} from './InlineWorklogForm.js';
import {useWeeklyWorklogSummary} from '../hooks/useWeeklyWorklogSummary.js';
import {
	JiraClient,
	type JiraConfig,
	type WorklogRequest,
	getFavoriteDefaultComment,
	getFavoriteDefaultTime,
} from '../jira-client.js';
import {getStartOfWeek, getEndOfWeek} from '../utils/date.js';

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
		'prev-week' | 'timetable' | 'next-week' | 'worklog-form'
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
		// Get the favorite default comment for this issue if it exists
		const favoriteComment = config.favorites
			? getFavoriteDefaultComment(config.favorites, data.issueKey)
			: undefined;

		// Use favorite comment, then global default comment, then empty string
		const defaultComment = favoriteComment || config.defaultComment || '';

		// Get the default time for this issue
		const isFavoriteIssue = config?.favorites?.some(
			fav => fav.key === data.issueKey,
		);
		let defaultTime = '1h'; // fallback

		if (isFavoriteIssue && config?.favorites) {
			const favoriteDefaultTime = getFavoriteDefaultTime(
				config.favorites,
				data.issueKey,
			);
			if (favoriteDefaultTime) {
				defaultTime = favoriteDefaultTime;
			} else if (config?.defaultTime) {
				defaultTime = config.defaultTime;
			}
		} else if (config?.defaultTime) {
			defaultTime = config.defaultTime;
		}

		setWorklogForm({
			issueKey: data.issueKey,
			date: data.date,
			timeSpent: defaultTime,
			comment: defaultComment,
			isVisible: true,
		});
		setWorklogError(null); // Clear any previous error
		setActiveArea('worklog-form');
	};

	const handleWorklogSubmit = async (data: {
		timeSpent: string;
		comment: string;
	}) => {
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
	};

	const handleWorklogCancel = () => {
		setWorklogForm(prev => ({...prev, isVisible: false}));
		setActiveArea('timetable');
	};

	useInput((input, key) => {
		// Don't handle input if worklog form is visible
		if (worklogForm.isVisible) {
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
			{/* JIRACLE Rainbow Banner */}
			<Box justifyContent="center" paddingY={1}>
				<Gradient name="rainbow">
					<BigText text="JIRACLE" font="tiny" />
				</Gradient>
			</Box>

			{/* Week Navigator - only when not in form mode */}
			{!worklogForm.isVisible && (
				<WeekNavigator
					currentWeek={currentWeek}
					onPreviousWeek={navigateToPreviousWeek}
					onNextWeek={navigateToNextWeek}
					onCurrentWeek={handleCurrentWeek}
					activeArea={activeArea === 'worklog-form' ? 'timetable' : activeArea}
				/>
			)}

			{/* Show issue info when in form mode */}
			{worklogForm.isVisible && (
				<Box justifyContent="center" paddingY={1}>
					<Text color="white" bold>
						{worklogForm.issueKey} on {formatDate(worklogForm.date)}
					</Text>
				</Box>
			)}

			{/* Error Display */}
			{error && (
				<Box justifyContent="center" paddingY={1}>
					<Text color="red">Error: {error}</Text>
				</Box>
			)}

			{/* Extra spacing between week navigator and table - only when not in form mode */}
			{!worklogForm.isVisible && <Box paddingY={1} />}

			{/* Conditional content: either table or form */}
			{worklogForm.isVisible ? (
				/* Inline Worklog Form - replaces table */
				<Box justifyContent="center">
					<Box width={68}>
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
					isActive={activeArea === 'timetable'}
					shouldFocusCell={shouldFocusCell}
					onCellFocused={() => setShouldFocusCell(false)}
					favoriteIssues={config.favorites}
				/>
			)}

			{/* Extra spacing to make app taller */}
			<Box paddingY={4}>
				<Text color="gray" dimColor>
					{/* Empty space for better visual layout */}
				</Text>
			</Box>

			{/* Footer with keyboard shortcuts - moved to bottom */}
			<Box justifyContent="center" paddingY={1}>
				<Text color="gray">
					{worklogForm.isVisible
						? '[↑↓] Select Time [Tab] Switch Areas [Enter] Submit [Esc] Cancel'
						: '[↑↓←→] Navigate Cells [Enter] Log Work [Shift+←→] Week Navigation [L] Log Work [T] Today [R] Refresh [Q] Quit'}
				</Text>
			</Box>
		</Box>
	);
}
