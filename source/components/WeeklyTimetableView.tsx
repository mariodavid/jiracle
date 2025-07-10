import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {WeekNavigator} from './WeekNavigator.js';
import {TimetableGrid} from './TimetableGrid.js';
import {useWeeklyWorklogSummary} from '../hooks/useWeeklyWorklogSummary.js';
import type {JiraConfig} from '../jira-client.js';
import type {WeeklyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';

export interface WeeklyTimetableViewProps {
	onBack: () => void;
	onLogWork?: () => void;
	config: JiraConfig;
	preloadedData?: WeeklyWorklogSummary | null;
	userEmail?: string | null;
}

export function WeeklyTimetableView({
	onBack,
	onLogWork,
	config,
	preloadedData,
	userEmail,
}: WeeklyTimetableViewProps) {
	const [currentWeek, setCurrentWeek] = useState(new Date());

	const weekStart = getStartOfWeek(currentWeek);
	const weekEnd = getEndOfWeek(currentWeek);

	// Check if current week matches preloaded data
	const isCurrentWeek =
		preloadedData &&
		new Date(preloadedData.weekStart).getTime() === weekStart.getTime();

	const {data, isLoading, error, refresh} = useWeeklyWorklogSummary(
		weekStart,
		weekEnd,
		config,
		!!isCurrentWeek, // Skip auto-load if we have preloaded data for current week
		userEmail || undefined,
	);

	// Use preloaded data for current week, otherwise use hook data
	const displayData = isCurrentWeek ? preloadedData : data;
	const displayLoading = isCurrentWeek ? false : isLoading;

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

	useInput((input, key) => {
		if (input === 'q' || key.escape) {
			onBack();
		} else if (input === 't') {
			handleCurrentWeek();
		} else if (input === 'r') {
			refresh();
		} else if (input === 'l' && onLogWork) {
			onLogWork();
		}
		// Note: Arrow keys are now handled by TimetableGrid for cell navigation
		// Shift+Arrow keys are handled by TimetableGrid for week navigation
	});

	return (
		<Box flexDirection="column">
			{/* Header */}
			<Box justifyContent="center" paddingY={1}>
				<Text bold color="white">
					JIRACLE - Weekly Worklog Overview
				</Text>
			</Box>

			{/* Week Navigator */}
			<WeekNavigator
				currentWeek={currentWeek}
				onPreviousWeek={navigateToPreviousWeek}
				onNextWeek={navigateToNextWeek}
				onCurrentWeek={handleCurrentWeek}
			/>

			{/* Error Display */}
			{error && (
				<Box justifyContent="center" paddingY={1}>
					<Text color="red">Error: {error}</Text>
				</Box>
			)}

			{/* Timetable Grid */}
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
			/>

			{/* Footer with keyboard shortcuts */}
			<Box justifyContent="center" paddingY={1}>
				<Text color="gray">
					[↑↓←→] Navigate Cells [Shift+←→] Week Navigation [L] Log Work [T]
					Today [R] Refresh [Q] Quit
				</Text>
			</Box>
		</Box>
	);
}

function getStartOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function getEndOfWeek(date: Date): Date {
	const start = getStartOfWeek(date);
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	end.setHours(23, 59, 59, 999);
	return end;
}
