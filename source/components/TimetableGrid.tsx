import React, {useEffect, useState, useCallback} from 'react';
import {Box, Text, useFocusManager, useInput} from 'ink';
import {Spinner} from '@inkjs/ui';
import figures from 'figures';
import {WeeklyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';
import {FocusableCell} from './FocusableCell.js';
import {formatLocalDateKey} from '../utils/date.js';
import type {FavoriteIssue, JiraConfig, Group} from '../jira-client.js';
import {resolveDefaults} from '../jira-client.js';
import {openInBrowser, generateJiraIssueUrl} from '../utils/browser.js';

export interface TimetableGridProps {
	data: WeeklyWorklogSummary | null;
	isLoading: boolean;
	onWeekChange?: (direction: 'prev' | 'next') => void;
	onCellWorklog?: (data: {issueKey: string; date: Date}) => void;
	onCellDelete?: (data: {issueKey: string; date: Date}) => void;
	isActive?: boolean;
	shouldFocusCell?: boolean;
	onCellFocused?: () => void;
	favoriteIssues?: FavoriteIssue[];
	config?: JiraConfig;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function TimetableGrid({
	data,
	isLoading,
	onWeekChange,
	onCellWorklog,
	onCellDelete,
	isActive = true,
	shouldFocusCell = false,
	onCellFocused,
	favoriteIssues = [],
	config,
}: TimetableGridProps) {
	// Fixed minimum height container for all states
	const MIN_HEIGHT = 15;

	// Track focused cell for row/column highlighting
	const [focusedCell, setFocusedCell] = useState<{
		issueKey: string;
		columnIndex: number;
	} | null>(null);

	const handleFocusChange = useCallback(
		(issueKey: string, columnIndex: number, isFocused: boolean) => {
			if (isFocused) {
				setFocusedCell({issueKey, columnIndex});
			}
			// Don't clear on blur - only update when we get a new focus
		},
		[],
	);

	// CALL ALL HOOKS FIRST (before any conditional returns)
	const {focus} = useFocusManager();
	const [currentFocus, setCurrentFocus] = useState({
		row: 0,
		col: getCurrentDayIndex(),
	});

	// Calculate values that depend on data (with safe defaults)
	const weekStart = data ? new Date(data.weekStart) : new Date();
	const weekDates = generateWeekDates(weekStart);
	const issueMap =
		data && data.dailySummaries.length > 0
			? buildIssueMap(data)
			: buildIssueMapFromFavorites(favoriteIssues);
	const dailyTotals = data ? calculateDailyTotals(data, weekDates) : [];
	const defaultFocusId =
		data || Object.keys(issueMap).length > 0
			? getDefaultFocusId(issueMap)
			: null;

	// Group issues by their resolved groups
	interface IssueGroup {
		group: Group | null;
		issues: Array<[string, any]>;
		totalHours: number;
	}

	const groupIssuesByResolvedGroup = (
		issues: Array<[string, any]>,
	): IssueGroup[] => {
		if (!config) {
			// Fallback: treat all issues as ungrouped
			return [
				{
					group: null,
					issues: sortIssuesByKey(issues),
					totalHours: issues.reduce(
						(sum, [, issueData]) => sum + issueData.weekTotal,
						0,
					),
				},
			];
		}

		const groupMap = new Map<string, IssueGroup>();
		const ungroupedIssues: Array<[string, any]> = [];

		for (const [issueKey, issueData] of issues) {
			const resolved = resolveDefaults(config, issueKey);
			const group = resolved.group;

			if (group) {
				const groupId = group.id;
				if (!groupMap.has(groupId)) {
					groupMap.set(groupId, {
						group,
						issues: [],
						totalHours: 0,
					});
				}
				groupMap.get(groupId)!.issues.push([issueKey, issueData]);
				groupMap.get(groupId)!.totalHours += issueData.weekTotal;
			} else {
				ungroupedIssues.push([issueKey, issueData]);
			}
		}

		const groups = Array.from(groupMap.values());

		// Sort issues within each group by issue key
		for (const group of groups) {
			group.issues = sortIssuesByKey(group.issues);
		}

		// Sort groups by group name
		groups.sort((a, b) => {
			if (!a.group || !b.group) return 0;
			return a.group.name.localeCompare(b.group.name);
		});

		// Add ungrouped issues at the end if any
		if (ungroupedIssues.length > 0) {
			groups.push({
				group: null,
				issues: sortIssuesByKey(ungroupedIssues),
				totalHours: ungroupedIssues.reduce(
					(sum, [, issueData]) => sum + issueData.weekTotal,
					0,
				),
			});
		}

		return groups;
	};

	// Sort issues by project prefix and number (helper function)
	const sortIssuesByKey = (issues: Array<[string, any]>) => {
		return issues.sort(([aKey], [bKey]) => {
			const aParts = aKey.split('-');
			const bParts = bKey.split('-');

			const aProject = aParts[0] || '';
			const bProject = bParts[0] || '';
			const aNumber = aParts[1] || '0';
			const bNumber = bParts[1] || '0';

			if (aProject !== bProject) {
				return aProject.localeCompare(bProject);
			}

			return parseInt(aNumber, 10) - parseInt(bNumber, 10);
		});
	};

	const issueGroups = groupIssuesByResolvedGroup(Object.entries(issueMap));
	const allSortedIssues = issueGroups.flatMap(group => group.issues);

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
			return `${totalHours}/${desired}h ${status}`.padStart(10) + ' ';
		}

		return `${totalHours}h`.padStart(10) + ' ';
	};

	const tableWidth = 2 + 20 + 5 * 8 + 8; // Group + Issue + 5 weekdays + Total = 70

	// Calculate grid dimensions
	const issueKeys = allSortedIssues.map(([issueKey]) => issueKey);
	const numRows = issueKeys.length; // Only issue rows are focusable
	const numCols = 5; // 5 weekdays only (total column not selectable)

	// Set default focus when component mounts
	useEffect(() => {
		if (defaultFocusId) {
			focus(defaultFocusId);
		}
	}, [defaultFocusId, focus]);

	// Focus a cell when table becomes active
	useEffect(() => {
		if (shouldFocusCell && data && issueKeys.length > 0) {
			// Focus the first available cell (first issue, today's column or Monday)
			const todayCol = getCurrentDayIndex();
			const focusId = getFocusIdForPosition(0, todayCol, issueKeys);
			if (focusId) {
				focus(focusId);
				setCurrentFocus({row: 0, col: todayCol});
				onCellFocused?.();
			}
		}
	}, [shouldFocusCell, data, issueKeys, focus, onCellFocused]);

	// Arrow key navigation
	useInput((_input, key) => {
		// Only handle input when table is active
		if (!isActive) {
			return;
		}

		// Always handle week navigation (even when no data)
		if (key.shift && key.leftArrow && onWeekChange) {
			onWeekChange('prev');
			return;
		}

		if (key.shift && key.rightArrow && onWeekChange) {
			onWeekChange('next');
			return;
		}

		// Only handle other input if we have data
		if (!data || isLoading || data.dailySummaries.length === 0) {
			return;
		}

		if (key.return && onCellWorklog) {
			// Get current focus info
			const issueKey = issueKeys[currentFocus.row];
			const date = weekDates[currentFocus.col];

			// Only trigger on weekday cells (not total column) and valid issue
			if (currentFocus.col < 5 && issueKey && date) {
				onCellWorklog({issueKey, date});
			}
			return;
		}

		// Handle 'd' key for delete
		if (_input === 'd' && onCellDelete) {
			// Get current focus info
			const issueKey = issueKeys[currentFocus.row];
			const date = weekDates[currentFocus.col];

			// Only trigger on weekday cells (not total column) and valid issue
			if (currentFocus.col < 5 && issueKey && date) {
				onCellDelete({issueKey, date});
			}
			return;
		}

		// Handle 'o' key for opening issue in browser
		if (_input === 'o' && config?.jiraUrl) {
			// Get current focus info
			const issueKey = issueKeys[currentFocus.row];

			// Only trigger if valid issue is selected
			if (issueKey) {
				const jiraUrl = generateJiraIssueUrl(config.jiraUrl, issueKey);
				openInBrowser(jiraUrl).catch(error => {
					console.error('Failed to open browser:', error);
				});
			}
			return;
		}

		if (key.leftArrow) {
			// Wrap around: if at first column (Monday), go to last column (Friday)
			const newCol =
				currentFocus.col === 0 ? numCols - 1 : currentFocus.col - 1;
			const newFocusId = getFocusIdForPosition(
				currentFocus.row,
				newCol,
				issueKeys,
			);
			if (newFocusId) {
				focus(newFocusId);
				setCurrentFocus({row: currentFocus.row, col: newCol});
			}
		}

		if (key.rightArrow) {
			// Wrap around: if at last column (Friday), go to first column (Monday)
			const newCol =
				currentFocus.col === numCols - 1 ? 0 : currentFocus.col + 1;
			const newFocusId = getFocusIdForPosition(
				currentFocus.row,
				newCol,
				issueKeys,
			);
			if (newFocusId) {
				focus(newFocusId);
				setCurrentFocus({row: currentFocus.row, col: newCol});
			}
		}

		if (key.upArrow) {
			// Wrap around: if at first row, go to last row
			const newRow =
				currentFocus.row === 0 ? numRows - 1 : currentFocus.row - 1;
			const newFocusId = getFocusIdForPosition(
				newRow,
				currentFocus.col,
				issueKeys,
			);
			if (newFocusId) {
				focus(newFocusId);
				setCurrentFocus({row: newRow, col: currentFocus.col});
			}
		}

		if (key.downArrow) {
			// Wrap around: if at last row, go to first row
			const newRow =
				currentFocus.row === numRows - 1 ? 0 : currentFocus.row + 1;
			const newFocusId = getFocusIdForPosition(
				newRow,
				currentFocus.col,
				issueKeys,
			);
			if (newFocusId) {
				focus(newFocusId);
				setCurrentFocus({row: newRow, col: currentFocus.col});
			}
		}
	});

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
						Issue
					</Text>
				</Box>
				{DAYS.map(day => (
					<Box key={day} width={8}>
						<Text bold color="white">
							{day.padStart(7) + ' '}
						</Text>
					</Box>
				))}
				<Box width={8}>
					<Text bold color="white">
						{'Total'.padStart(7) + ' '}
					</Text>
				</Box>
			</Box>

			{/* Separator */}
			<Box width={tableWidth}>
				<Text color="gray">{'─'.repeat(tableWidth)}</Text>
			</Box>

			{/* Issue rows grouped by resolved groups */}
			{issueGroups.map(group => (
				<Box key={group.group?.id || 'ungrouped'} flexDirection="column">
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
												width={8}
											/>
										) : (
											<Box key={`${issueKey}-static-cell-${index}`} width={8}>
												<Text>
													{formatHours(
														issueData.dailyHours[formatLocalDateKey(date)] || 0,
													).padStart(7) + ' '}
												</Text>
											</Box>
										),
									)}
									{/* Total column - always show individual issue total */}
									<Box width={8}>
										<Text bold color="yellow">
											{formatHours(issueData.weekTotal).padStart(7) + ' '}
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
							<Box width={tableWidth}>
								<Text color="gray">{'─'.repeat(tableWidth)}</Text>
							</Box>
							{/* Group total row */}
							<Box flexDirection="row">
								<Box width={2}>
									<Text> </Text>
								</Box>
								<Box width={20}>
									<Text bold color="green">
										{group.group.name} Total
									</Text>
								</Box>
								{weekDates.map((_, index) => (
									<Box
										key={`group-total-${group.group?.id}-${index}`}
										width={8}
									>
										<Text> </Text>
									</Box>
								))}
								<Box width={11}>
									<Text bold color="green">
										{formatGroupTotal(group)}
									</Text>
								</Box>
							</Box>
							{/* Additional spacing after group total */}
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
						Daily Total
					</Text>
				</Box>
				{dailyTotals.map((total, index) => (
					<Box key={`daily-total-${index}`} width={8}>
						<Text bold color="yellow">
							{formatHours(total).padStart(7) + ' '}
						</Text>
					</Box>
				))}
				<Box width={8}>
					<Text bold color="green">
						{formatHours(data.weekTotal).padStart(7) + ' '}
					</Text>
				</Box>
			</Box>
		</Box>
	);
}

function generateWeekDates(weekStart: Date): Date[] {
	const dates: Date[] = [];
	// Only generate weekdays (Monday to Friday)
	for (let i = 0; i < 5; i++) {
		const date = new Date(weekStart);
		date.setDate(weekStart.getDate() + i);
		dates.push(date);
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

function calculateDailyTotals(
	data: WeeklyWorklogSummary,
	weekDates: Date[],
): number[] {
	const totals: number[] = new Array(5).fill(0);

	data.dailySummaries.forEach(dailySummary => {
		const dateKey = formatLocalDateKey(dailySummary.date);
		const dayIndex = weekDates.findIndex(
			date => formatLocalDateKey(date) === dateKey,
		);

		if (dayIndex >= 0) {
			totals[dayIndex] = dailySummary.totalHours;
		}
	});

	return totals;
}

function formatHours(hours: number): string {
	if (hours === 0) {
		return '-';
	}

	return hours.toFixed(1);
}

function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}

	return text.substring(0, maxLength - 3) + '...';
}

function getCurrentDayIndex(): number {
	const today = new Date();
	const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
	return dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0
}

function getDefaultFocusId(issueMap: Record<string, IssueData>): string {
	const currentDayIndex = getCurrentDayIndex();
	const firstIssueKey = Object.keys(issueMap)[0];

	if (firstIssueKey) {
		return `issue-${firstIssueKey}-${currentDayIndex}`;
	}

	// If no issues, return first issue's first day as fallback
	return `issue-placeholder-0`;
}

function getFocusIdForPosition(
	row: number,
	col: number,
	issueKeys: string[],
): string | null {
	// Only issue rows are focusable (daily totals row is not focusable)
	// Only weekday columns are focusable (total column is not focusable)
	if (row < issueKeys.length && col < 5) {
		const issueKey = issueKeys[row];
		return `issue-${issueKey}-${col}`;
	}

	return null;
}
