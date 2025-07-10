import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {WeekNavigator} from './WeekNavigator.js';
import {TimetableGrid} from './TimetableGrid.js';
import {useWeeklyWorklogSummary} from '../hooks/useWeeklyWorklogSummary.js';
import type {JiraConfig} from '../jira-client.js';
import type {WeeklyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';

export interface WeeklyTimetableViewProps {
	onBack: () => void;
	config: JiraConfig;
	preloadedData?: WeeklyWorklogSummary | null;
	userEmail?: string | null;
}

export function WeeklyTimetableView({
	onBack,
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

	const handlePreviousWeek = () => {
		const newWeek = new Date(currentWeek);
		newWeek.setDate(currentWeek.getDate() - 7);
		setCurrentWeek(newWeek);
	};

	const handleNextWeek = () => {
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
		} else if (key.leftArrow) {
			handlePreviousWeek();
		} else if (key.rightArrow) {
			handleNextWeek();
		} else if (input === 't') {
			handleCurrentWeek();
		} else if (input === 'r') {
			refresh();
		}
	});

	return (
		<Box flexDirection="column">
			{/* Header */}
			<Box justifyContent="center" paddingY={1}>
				<Text bold color="white">
					JIRACLE - Weekly Timetable
				</Text>
			</Box>

			{/* Week Navigator */}
			<WeekNavigator
				currentWeek={currentWeek}
				onPreviousWeek={handlePreviousWeek}
				onNextWeek={handleNextWeek}
				onCurrentWeek={handleCurrentWeek}
			/>

			{/* Error Display */}
			{error && (
				<Box justifyContent="center" paddingY={1}>
					<Text color="red">Error: {error}</Text>
				</Box>
			)}

			{/* Timetable Grid */}
			<TimetableGrid data={displayData} isLoading={displayLoading} />

			{/* Footer with keyboard shortcuts */}
			<Box justifyContent="center" paddingY={1}>
				<Text color="gray">
					[←] Previous Week [→] Next Week [T] Today [R] Refresh [Q] Back
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
