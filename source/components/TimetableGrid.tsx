import React, {useEffect, useState} from 'react';
import {Box, Text, useFocusManager, useInput} from 'ink';
import {Spinner} from '@inkjs/ui';
import {WeeklyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';
import {FocusableCell} from './FocusableCell.js';
import {formatLocalDateKey} from '../utils/date.js';

export interface TimetableGridProps {
	data: WeeklyWorklogSummary | null;
	isLoading: boolean;
	onWeekChange?: (direction: 'prev' | 'next') => void;
	onCellWorklog?: (data: {issueKey: string; date: Date}) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function TimetableGrid({
	data,
	isLoading,
	onWeekChange,
	onCellWorklog,
}: TimetableGridProps) {
	// Fixed minimum height container for all states
	const MIN_HEIGHT = 15;

	// CALL ALL HOOKS FIRST (before any conditional returns)
	const {focus} = useFocusManager();
	const [currentFocus, setCurrentFocus] = useState({
		row: 0,
		col: getCurrentDayIndex(),
	});

	// Calculate values that depend on data (with safe defaults)
	const weekStart = data ? new Date(data.weekStart) : new Date();
	const weekDates = generateWeekDates(weekStart);
	const issueMap = data ? buildIssueMap(data) : {};
	const dailyTotals = data ? calculateDailyTotals(data, weekDates) : [];
	const defaultFocusId = data ? getDefaultFocusId(issueMap) : null;

	const tableWidth = 20 + 5 * 8 + 8; // Issue + 5 weekdays + Total = 68

	// Calculate grid dimensions
	const issueKeys = Object.keys(issueMap);
	const numRows = issueKeys.length; // Only issue rows are focusable
	const numCols = 6; // 5 weekdays + total

	// Set default focus when component mounts
	useEffect(() => {
		if (defaultFocusId) {
			focus(defaultFocusId);
		}
	}, [defaultFocusId, focus]);

	// Arrow key navigation
	useInput((_input, key) => {
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

		if (key.leftArrow) {
			const newCol = Math.max(0, currentFocus.col - 1);
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
			const newCol = Math.min(numCols - 1, currentFocus.col + 1);
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
			const newRow = Math.max(0, currentFocus.row - 1);
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
			const newRow = Math.min(numRows - 1, currentFocus.row + 1);
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

	if (data.dailySummaries.length === 0) {
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

			{/* Issue rows */}
			{Object.entries(issueMap).map(([issueKey, issueData]) => (
				<Box key={issueKey} flexDirection="column">
					<Box flexDirection="row">
						<Box width={20}>
							<Text bold color="cyan">
								{issueKey}
							</Text>
						</Box>
						{weekDates.map((date, index) => (
							<FocusableCell
								key={index}
								value={formatHours(
									issueData.dailyHours[formatLocalDateKey(date)] || 0,
								)}
								focusId={`issue-${issueKey}-${index}`}
							/>
						))}
						<FocusableCell
							value={formatHours(issueData.weekTotal)}
							focusId={`issue-${issueKey}-total`}
							isTotal={true}
						/>
					</Box>
					<Box paddingLeft={1}>
						<Text color="gray" dimColor>
							{truncateText(issueData.summary, 50)}
						</Text>
					</Box>
				</Box>
			))}

			{/* Separator */}
			<Box width={tableWidth}>
				<Text color="gray">{'─'.repeat(tableWidth)}</Text>
			</Box>

			{/* Daily totals */}
			<Box flexDirection="row">
				<Box width={20}>
					<Text bold color="yellow">
						Daily Total
					</Text>
				</Box>
				{dailyTotals.map((total, index) => (
					<Box key={index} width={8}>
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
	if (row < issueKeys.length) {
		const issueKey = issueKeys[row];
		if (col === 5) {
			return `issue-${issueKey}-total`;
		}
		return `issue-${issueKey}-${col}`;
	}

	return null;
}
