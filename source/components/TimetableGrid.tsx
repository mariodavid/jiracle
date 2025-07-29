import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import figures from 'figures';
import {type WeeklyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';
import {LocalDate} from '../domain/LocalDate.js';
import {IssueKey} from '../domain/IssueKey.js';
import type {FavoriteIssue, JiraConfig} from '../jira-client.js';
import {type AttendanceManager} from '../attendance/AttendanceManager.js';
import type {WeeklyAttendance} from '../attendance/types.js';
import {useIssueGroups, type IssueGroup} from '../hooks/useIssueGroups.js';
import {
	calculateDailyTotals,
	formatHours,
	truncateText,
} from '../utils/TimetableCalculations.js';
// Import {calculateFocusableItems} from '../utils/FocusableItemCalculator.js';
import {useTableNavigation} from '../hooks/useTableNavigation.js';
import {
	generateWeekDates,
	buildIssueMap,
	buildIssueMapFromFavorites,
} from '../utils/TimetableDataUtils.js';
import {uiLogger} from '../utils/logger.js';
import {AttendanceFooterRows} from './AttendanceFooterRows.js';
import {AttendanceRows} from './AttendanceRows.js';
import {FocusableCell} from './FocusableCell.js';
import {TimetableLoadingStates} from './TimetableLoadingStates.js';

export type TimetableGridProps = {
	data: WeeklyWorklogSummary | undefined;
	isLoading: boolean;
	onWeekChange?: (direction: 'prev' | 'next') => void;
	onCellWorklog?: (data: {issueKey: IssueKey; date: LocalDate}) => void;
	onCellDelete?: (data: {issueKey: IssueKey; date: LocalDate}) => void;
	onAttendanceEdit?: (data: {date: LocalDate}) => void;
	onAttendanceDelete?: (data: {date: LocalDate}) => void;
	onOpenInBrowser?: (issueKey: IssueKey) => void;
	isActive?: boolean;
	favoriteIssues?: FavoriteIssue[];
	config?: JiraConfig;
	attendanceManager?: AttendanceManager;
	attendanceRefreshKey?: number;
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function TimetableGrid({
	data,
	isLoading,
	onWeekChange,
	onCellWorklog,
	onCellDelete,
	onAttendanceEdit,
	onAttendanceDelete,
	onOpenInBrowser,
	isActive = true,
	favoriteIssues = [],
	config,
	attendanceManager,
	attendanceRefreshKey = 0,
}: TimetableGridProps) {
	// Fixed minimum height container for all states
	const MIN_HEIGHT = 25;

	// Attendance data state
	const [weeklyAttendance, setWeeklyAttendance] = useState<WeeklyAttendance>(
		{},
	);
	// Remove unused variable warning suppression since we use it now

	// Load attendance data when attendanceManager, week, or refresh key changes
	useEffect(() => {
		uiLogger.debug('TimetableGrid: useEffect triggered', {
			hasAttendanceManager: Boolean(attendanceManager),
			hasData: Boolean(data),
			attendanceRefreshKey,
		});

		if (!attendanceManager) {
			uiLogger.debug('TimetableGrid: No attendance manager available');
			return;
		}

		if (!data) {
			uiLogger.debug('TimetableGrid: No data available yet');
			return;
		}

		const loadAttendanceData = async () => {
			try {
				// Convert to Date only at API boundary
				const weekStart = data.weekStart.toDate();
				uiLogger.debug('TimetableGrid: Loading attendance data for week', {
					weekStart: weekStart.toISOString(),
					weekStartLocal: data.weekStart.toISOString(),
				});

				const weekly = await attendanceManager.getWeeklyAttendance(weekStart);
				uiLogger.debug('TimetableGrid: Loaded weekly attendance', {
					attendanceKeys: Object.keys(weekly),
					attendanceData: weekly,
				});

				setWeeklyAttendance(weekly);
			} catch (error: unknown) {
				uiLogger.error('TimetableGrid: Failed to load attendance data', {
					error,
				});
				console.error('Failed to load attendance data:', error);
			}
		};

		void loadAttendanceData();
	}, [attendanceManager, data?.weekStart.toISOString(), attendanceRefreshKey]); // Use full ISO string to ensure week changes trigger reload

	// CALL ALL HOOKS FIRST (before any conditional returns)
	// Const {focus} = useFocusManager();
	// Const {findInitialFocus} = useGridNavigation();

	// Calculate values that depend on data (with safe defaults)
	const weekStartLocal = data
		? data.weekStart
		: LocalDate.today().getWeekStart();
	const weekDates = generateWeekDates(
		new Date(weekStartLocal.toISOString() + 'T00:00:00.000Z'),
	);
	const issueMap =
		data && data.dailySummaries.length > 0
			? buildIssueMap(data)
			: buildIssueMapFromFavorites(favoriteIssues);
	const dailyTotals = data ? calculateDailyTotals(data, weekDates) : [];

	// Calculate daily deltas (logged hours - attendance hours)
	const dailyLoggedHours: Record<string, number> = {};
	for (const [index, date] of weekDates.entries()) {
		const dateKey = LocalDate.fromDate(date).toISOString();
		dailyLoggedHours[dateKey] = dailyTotals[index] ?? 0;
	}

	// Group issues by their resolved groups using the extracted service
	const issueGroups = useIssueGroups(
		Object.entries(issueMap),
		config ?? undefined,
	);

	// Unified table navigation (focus management + keyboard input)
	const {focusedCell, handleFocusChange} = useTableNavigation({
		isActive,
		weekDates,
		attendanceManager,
		issueGroups,
		onWeekChange,
		onCellWorklog,
		onCellDelete,
		onAttendanceEdit,
		onAttendanceDelete,
		onOpenInBrowser,
	});

	// Helper function to check if an issue is a favorite
	const isFavoriteIssue = (issueKey: IssueKey): boolean => {
		return favoriteIssues.some(fav => fav.key.equals(issueKey));
	};

	// Helper function to format issue key with alias support, favorite marker and fixed width
	const formatIssueKey = (issueKey: IssueKey): string => {
		// Check if this issue has an alias configured
		const favoriteIssue = favoriteIssues.find(fav => fav.key.equals(issueKey));
		const displayText = favoriteIssue?.alias ?? issueKey.toString();

		// Pad the display text to a fixed width (e.g. 12 characters for consistency)
		const paddedDisplayText = displayText.padEnd(12, ' ');

		return isFavoriteIssue(issueKey)
			? `${paddedDisplayText} ${figures.star}`
			: paddedDisplayText;
	};

	// Helper function to format group total with desired amount comparison
	const formatGroupTotal = (group: IssueGroup): string => {
		const totalHours = formatHours(group.totalHours);

		const desiredAmount = group.group?.desiredAmount;
		if (typeof desiredAmount === 'number') {
			const actual = group.totalHours;
			const status = actual >= desiredAmount ? '✓' : '⚠️';
			return `${totalHours}/${String(desiredAmount)} ${status}`;
		}

		// Return hours without 'h' suffix for group totals
		return totalHours;
	};

	const tableWidth = 2 + 20 + 5 * 12 + 8; // Group + Issue + 5 weekdays (wider) + Total = 90

	// Set initial focus to first row and current day when component loads - DISABLED
	// useEffect(() => {
	// 	if (focusedCell === undefined && isActive) {
	// 		const focusableItems = calculateFocusableItems({
	// 			attendanceManager,
	// 			issueGroups,
	// 		});

	// 		// Calculate preferred column index (today's weekday)
	// 		const today = LocalDate.today();
	// 		const todayColumnIndex = weekDates.findIndex(date =>
	// 			LocalDate.fromDate(date).equals(today),
	// 		);
	// 		const preferredColumn = todayColumnIndex >= 0 ? todayColumnIndex : 0; // Default to Monday

	// 		const initialItem = findInitialFocus(focusableItems, preferredColumn);

	// 		if (initialItem) {
	// 			focus(initialItem.focusId);
	// 		}
	// 	}
	// }, [focusedCell, isActive, attendanceManager, issueGroups, focus]);

	// CONDITIONAL RENDERING AFTER ALL HOOKS
	if (isLoading) {
		return (
			<TimetableLoadingStates
				isLoading={isLoading}
				data={data}
				favoriteIssues={favoriteIssues}
				minHeight={MIN_HEIGHT}
			/>
		);
	}

	if (!data) {
		return (
			<TimetableLoadingStates
				isLoading={false}
				data={data}
				favoriteIssues={favoriteIssues}
				minHeight={MIN_HEIGHT}
			/>
		);
	}

	if (data.dailySummaries.length === 0 && favoriteIssues.length === 0) {
		return (
			<TimetableLoadingStates
				isLoading={false}
				data={data}
				favoriteIssues={favoriteIssues}
				minHeight={MIN_HEIGHT}
			/>
		);
	}

	return (
		<Box
			flexDirection="column"
			paddingX={1}
			alignItems="center"
			minHeight={MIN_HEIGHT}
		>
			{/* Header */}
			<Box flexDirection="row">
				<Box width={2}>
					<Text bold color="white">
						{' '}
					</Text>
				</Box>
				<Box width={20}>
					<Text bold color="white">
						{' '}
					</Text>
				</Box>
				{DAYS.map((day, index) => {
					const date = weekDates[index];
					const dayMonth = date
						? `(${date.getDate()}.${date.getMonth() + 1})`
						: '';
					return (
						<Box key={day} width={12} justifyContent="flex-end">
							<Text bold color="white">
								{day} {dayMonth}
							</Text>
						</Box>
					);
				})}
				<Box width={8} justifyContent="flex-end">
					<Text bold color="white">
						Total
					</Text>
				</Box>
			</Box>

			{/* Attendance rows - only show if attendanceManager is available */}
			{attendanceManager && (
				<AttendanceRows
					weekDates={weekDates}
					weeklyAttendance={weeklyAttendance}
					isActive={isActive}
					onFocusChange={handleFocusChange}
				/>
			)}

			{/* Separator */}
			<Box width={tableWidth}>
				<Text color="gray">{'─'.repeat(tableWidth)}</Text>
			</Box>

			{/* Issue rows grouped by resolved groups */}
			{issueGroups.map(group => (
				<Box key={group.group?.id ?? 'ungrouped'} flexDirection="column">
					{/* Group header row */}
					{group.group && (
						<Box flexDirection="column">
							{/* Extra spacing before group header */}
							<Box>
								<Text> </Text>
							</Box>
							{/* Group header with name */}
							<Box flexDirection="row">
								<Box width={2}>
									<Text> </Text>
								</Box>
								<Box width={20}>
									<Text bold color="yellow">
										{group.group.name}
									</Text>
								</Box>
								{weekDates.map((_, index) => (
									<Box
										key={`header-${String(group.group?.id ?? 'null')}-${index}`}
										width={12}
									>
										<Text> </Text>
									</Box>
								))}
								<Box width={8}>
									<Text> </Text>
								</Box>
							</Box>
							{/* Underline below group header */}
							<Box flexDirection="row">
								<Box width={2}>
									<Text color="yellow">{'─'.repeat(2)}</Text>
								</Box>
								<Box width={20}>
									<Text color="yellow">{'─'.repeat(20)}</Text>
								</Box>
								{weekDates.map((_, index) => (
									<Box
										key={`underline-${String(
											group.group?.id ?? 'null',
										)}-${index}`}
										width={12}
									>
										<Text color="yellow">{'─'.repeat(12)}</Text>
									</Box>
								))}
								<Box width={8}>
									<Text color="yellow">{'─'.repeat(8)}</Text>
								</Box>
							</Box>
						</Box>
					)}
					{group.issues.map(([issueKey, issueData]) => {
						const isRowHighlighted =
							focusedCell?.issueKey.toString() === issueKey;
						return (
							<Box key={issueKey} flexDirection="column">
								<Box flexDirection="row">
									{/* Arrow indicator for focused row */}
									<Box width={2}>
										<Text color={isRowHighlighted ? 'cyan' : undefined}>
											{isRowHighlighted ? figures.arrowRight : ' '}
										</Text>
									</Box>
									{/* Issue key column */}
									<Box width={20}>
										<Text bold color="cyan">
											{formatIssueKey(IssueKey.fromString(issueKey))}
										</Text>
									</Box>
									{/* Day columns */}
									{weekDates.map((date, index) =>
										isActive ? (
											<FocusableCell
												key={`${issueKey}-focusable-cell-${index}`}
												value={formatHours(
													issueData.dailyHours[
														LocalDate.fromDate(date).toISOString()
													] ?? 0,
												)}
												focusId={`issue-${issueKey}-${index}`}
												isActive={true}
												issueKey={IssueKey.fromString(issueKey)}
												columnIndex={index}
												width={12}
												onFocusChange={handleFocusChange}
											/>
										) : (
											<Box
												key={`${issueKey}-static-cell-${index}`}
												width={12}
												justifyContent="flex-end"
											>
												<Text>
													{formatHours(
														issueData.dailyHours[
															LocalDate.fromDate(date).toISOString()
														] ?? 0,
													)}
												</Text>
											</Box>
										),
									)}
									{/* Total column - always show individual issue total */}
									<Box width={8} justifyContent="flex-end">
										<Text bold color="yellow">
											{formatHours(issueData.weekTotal)}
										</Text>
									</Box>
								</Box>
								<Box paddingLeft={2}>
									<Text dimColor color="gray">
										{truncateText(issueData.summary, 50)}
									</Text>
								</Box>
							</Box>
						);
					})}
					{/* Group total separator and row */}
					{group.group && (
						<Box flexDirection="column">
							{/* Separator line above group total */}
							<Box flexDirection="row">
								<Box width={2}>
									<Text color="gray">{'─'.repeat(2)}</Text>
								</Box>
								<Box width={20}>
									<Text color="gray">{'─'.repeat(20)}</Text>
								</Box>
								{weekDates.map((_, index) => (
									<Box
										key={`sep-${String(group.group?.id ?? 'null')}-${index}`}
										width={12}
									>
										<Text color="gray">{'─'.repeat(12)}</Text>
									</Box>
								))}
								<Box width={8}>
									<Text color="gray">{'─'.repeat(8)}</Text>
								</Box>
							</Box>
							{/* Group total row */}
							<Box flexDirection="row">
								<Box width={2}>
									<Text> </Text>
								</Box>
								{/* Extended width for group total text - spans across issue and weekday columns */}
								<Box width={20 + 5 * 12}>
									<Text bold color="green">
										{group.group.name} Total
									</Text>
								</Box>
								<Box width={8} justifyContent="flex-end">
									<Text bold color="green">
										{formatGroupTotal(group)}
									</Text>
								</Box>
							</Box>
							{/* Additional spacing after group total */}
							<Box>
								<Text> </Text>
							</Box>
							<Box>
								<Text> </Text>
							</Box>
						</Box>
					)}
				</Box>
			))}

			{/* Separator */}
			<Box width={tableWidth}>
				<Text color="gray">{'─'.repeat(tableWidth)}</Text>
			</Box>

			{/* Daily totals */}
			<Box flexDirection="row">
				<Box width={2}>
					<Text> </Text>
				</Box>
				<Box width={20}>
					<Text bold color="yellow">
						Worklog
					</Text>
				</Box>
				{dailyTotals.map((total, index) => (
					<Box
						key={`daily-total-${index}`}
						width={12}
						justifyContent="flex-end"
					>
						<Text bold color="yellow">
							{formatHours(total)}
						</Text>
					</Box>
				))}
				<Box width={8} justifyContent="flex-end">
					<Text bold color="green">
						{formatHours(data?.weekTotal ?? 0)}
					</Text>
				</Box>
			</Box>

			{/* Attendance footer rows (hours and delta) - only show if attendanceManager is available */}
			{attendanceManager && (
				<AttendanceFooterRows
					weekDates={weekDates}
					weeklyAttendance={weeklyAttendance}
					dailyLoggedHours={dailyLoggedHours}
					config={config}
				/>
			)}
		</Box>
	);
}
