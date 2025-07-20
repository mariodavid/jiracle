import React, {useEffect, useState} from 'react';
import {Box, Text, useFocusManager} from 'ink';
import {Spinner} from '@inkjs/ui';
import figures from 'figures';
import {WeeklyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';
import {FocusableCell} from './FocusableCell.js';
import {AttendanceRows} from './AttendanceRows.js';
import {AttendanceFooterRows} from './AttendanceFooterRows.js';
import {formatLocalDateKey} from '../utils/date.js';
import type {FavoriteIssue, JiraConfig} from '../jira-client.js';
import {AttendanceManager} from '../attendance/AttendanceManager.js';
import type {WeeklyAttendance} from '../attendance/types.js';
import {useIssueGroups} from '../hooks/useIssueGroups.js';
import type {IssueGroup} from '../services/IssueGroupManager.js';
import {
	calculateDailyTotals,
	formatHours,
	truncateText,
} from '../utils/TimetableCalculations.js';
import {FocusableItemCalculator} from '../utils/FocusableItemCalculator.js';
import {GridNavigationService} from '../services/GridNavigationService.js';
import {useTableNavigation} from '../hooks/useTableNavigation.js';

export interface TimetableGridProps {
	data: WeeklyWorklogSummary | null;
	isLoading: boolean;
	onWeekChange?: (direction: 'prev' | 'next') => void;
	onCellWorklog?: (data: {issueKey: string; date: Date}) => void;
	onCellDelete?: (data: {issueKey: string; date: Date}) => void;
	onAttendanceEdit?: (data: {date: Date}) => void;
	onAttendanceDelete?: (data: {date: Date}) => void;
	onOpenInBrowser?: (issueKey: string) => void;
	isActive?: boolean;
	favoriteIssues?: FavoriteIssue[];
	config?: JiraConfig;
	attendanceManager?: AttendanceManager;
	attendanceRefreshKey?: number;
}

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

	// Load attendance data when attendanceManager, week, or refresh key changes
	useEffect(() => {
		if (!attendanceManager || !data) return;

		const loadAttendanceData = async () => {
			try {
				const weekStart = new Date(data.weekStart);
				const weekly = await attendanceManager.getWeeklyAttendance(weekStart);
				setWeeklyAttendance(weekly);
			} catch (err) {
				console.error('Failed to load attendance data:', err);
			}
		};

		loadAttendanceData();
	}, [attendanceManager, data, attendanceRefreshKey]);

	// CALL ALL HOOKS FIRST (before any conditional returns)
	const {focus} = useFocusManager();

	// Calculate values that depend on data (with safe defaults)
	const weekStart = data ? new Date(data.weekStart) : new Date();
	const weekDates = generateWeekDates(weekStart);
	const issueMap =
		data && data.dailySummaries.length > 0
			? buildIssueMap(data)
			: buildIssueMapFromFavorites(favoriteIssues);
	const dailyTotals = data ? calculateDailyTotals(data, weekDates) : [];

	// Calculate daily deltas (logged hours - attendance hours)
	const dailyLoggedHours: Record<string, number> = {};
	weekDates.forEach((date, index) => {
		const dateKey = formatLocalDateKey(date);
		dailyLoggedHours[dateKey] = dailyTotals[index] || 0;
	});

	// Group issues by their resolved groups using the extracted service
	const issueGroups = useIssueGroups(Object.entries(issueMap), config || null);

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
	const isFavoriteIssue = (issueKey: string): boolean => {
		return favoriteIssues.some(fav => fav.key === issueKey);
	};

	// Helper function to format issue key with alias support, favorite marker and fixed width
	const formatIssueKey = (issueKey: string): string => {
		// Check if this issue has an alias configured
		const favoriteIssue = favoriteIssues.find(fav => fav.key === issueKey);
		const displayText = favoriteIssue?.alias || issueKey;

		// Pad the display text to a fixed width (e.g. 12 characters for consistency)
		const paddedDisplayText = displayText.padEnd(12, ' ');

		return isFavoriteIssue(issueKey)
			? `${paddedDisplayText} ${figures.star}`
			: paddedDisplayText;
	};

	// Helper function to format group total with desired amount comparison
	const formatGroupTotal = (group: IssueGroup): string => {
		const totalHours = formatHours(group.totalHours);

		if (group.group?.desiredAmount) {
			const desired = group.group.desiredAmount;
			const actual = group.totalHours;
			const status = actual >= desired ? '✓' : '⚠️';
			return `${totalHours}/${desired} ${status}`;
		}

		// Return hours without 'h' suffix for group totals
		return totalHours;
	};

	const tableWidth = 2 + 20 + 5 * 12 + 8; // Group + Issue + 5 weekdays (wider) + Total = 90

	// Set initial focus to first row and current day when component loads
	useEffect(() => {
		if (focusedCell === null && isActive) {
			const focusableItems = FocusableItemCalculator.calculateFocusableItems({
				attendanceManager,
				issueGroups,
			});

			// Calculate preferred column index (today's weekday)
			const today = new Date();
			const todayDayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
			const todayColumnIndex =
				todayDayOfWeek >= 1 && todayDayOfWeek <= 5
					? todayDayOfWeek - 1 // Monday=0, Tuesday=1, ..., Friday=4
					: 0; // Default to Monday for weekends

			const initialItem = GridNavigationService.findInitialFocusItem(
				focusableItems,
				todayColumnIndex,
			);

			if (initialItem) {
				focus(initialItem.focusId);
			}
		}
	}, [focusedCell, isActive, attendanceManager, issueGroups, focus]);

	// CONDITIONAL RENDERING AFTER ALL HOOKS
	if (isLoading) {
		return (
			<Box
				flexDirection="column"
				paddingX={1}
				alignItems="center"
				minHeight={MIN_HEIGHT}
			>
				<Box
					flexDirection="column"
					alignItems="center"
					justifyContent="center"
					flexGrow={1}
				>
					<Spinner label="Loading worklogs..." />
				</Box>
			</Box>
		);
	}

	if (!data) {
		return (
			<Box
				flexDirection="column"
				paddingX={1}
				alignItems="center"
				minHeight={MIN_HEIGHT}
			>
				<Box
					flexDirection="column"
					alignItems="center"
					justifyContent="center"
					flexGrow={1}
				>
					<Text color="gray">No data available</Text>
				</Box>
			</Box>
		);
	}

	if (data.dailySummaries.length === 0 && favoriteIssues.length === 0) {
		return (
			<Box
				flexDirection="column"
				paddingX={1}
				alignItems="center"
				minHeight={MIN_HEIGHT}
			>
				<Box
					flexDirection="column"
					alignItems="center"
					justifyContent="center"
					flexGrow={1}
				>
					<Text color="yellow">No worklogs found for this week</Text>
				</Box>
			</Box>
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
				<Box key={group.group?.id || 'ungrouped'} flexDirection="column">
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
										key={`header-${String(group.group?.id || 'null')}-${index}`}
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
											group.group?.id || 'null',
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
						const isRowHighlighted = focusedCell?.issueKey === issueKey;
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
											{formatIssueKey(issueKey)}
										</Text>
									</Box>
									{/* Day columns */}
									{weekDates.map((date, index) =>
										isActive ? (
											<FocusableCell
												key={`${issueKey}-focusable-cell-${index}`}
												value={formatHours(
													issueData.dailyHours[formatLocalDateKey(date)] || 0,
												)}
												focusId={`issue-${issueKey}-${index}`}
												isActive={true}
												issueKey={issueKey}
												columnIndex={index}
												onFocusChange={handleFocusChange}
												width={12}
											/>
										) : (
											<Box
												key={`${issueKey}-static-cell-${index}`}
												width={12}
												justifyContent="flex-end"
											>
												<Text>
													{formatHours(
														issueData.dailyHours[formatLocalDateKey(date)] || 0,
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
									<Text color="gray" dimColor>
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
										key={`sep-${String(group.group?.id || 'null')}-${index}`}
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
						{formatHours(data.weekTotal)}
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

function generateWeekDates(weekStart: Date): Date[] {
	const dates: Date[] = [];
	const current = new Date(weekStart);

	// Get Monday of the week (same logic as AttendanceCalculations.getWeekDates)
	const day = current.getDay();
	const diff = current.getDate() - day + (day === 0 ? -6 : 1);
	current.setDate(diff);

	// Only generate weekdays (Monday to Friday)
	for (let i = 0; i < 5; i++) {
		const date = new Date(current);
		dates.push(date);
		current.setDate(current.getDate() + 1);
	}
	return dates;
}

interface IssueData {
	summary: string;
	dailyHours: Record<string, number>;
	weekTotal: number;
}

function buildIssueMap(data: WeeklyWorklogSummary): Record<string, IssueData> {
	const issueMap: Record<string, IssueData> = {};

	// Process all worklog data (includes favorites with 0 hours from WeeklyWorklogSummaryUseCase)
	data.dailySummaries.forEach(dailySummary => {
		const dateKey = formatLocalDateKey(dailySummary.date);

		dailySummary.issues.forEach(issue => {
			if (!issueMap[issue.issueKey]) {
				issueMap[issue.issueKey] = {
					summary: issue.issueSummary,
					dailyHours: {},
					weekTotal: 0,
				};
			}

			issueMap[issue.issueKey]!.dailyHours[dateKey] =
				(issueMap[issue.issueKey]!.dailyHours[dateKey] || 0) + issue.hours;
			issueMap[issue.issueKey]!.weekTotal += issue.hours;
		});
	});

	return issueMap;
}

function buildIssueMapFromFavorites(
	favoriteIssues: FavoriteIssue[],
): Record<string, IssueData> {
	const issueMap: Record<string, IssueData> = {};

	favoriteIssues.forEach(favorite => {
		issueMap[favorite.key] = {
			summary: `Favorite: ${favorite.key}`,
			dailyHours: {},
			weekTotal: 0,
		};
	});

	return issueMap;
}
