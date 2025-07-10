import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import {WeekNavigator} from './WeekNavigator.js';
import {TimetableGrid} from './TimetableGrid.js';
import {useWeeklyWorklogSummary} from '../hooks/useWeeklyWorklogSummary.js';
import type {JiraConfig} from '../jira-client.js';

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
	onCellWorklog,
	config,
	userEmail,
}: WeeklyTimetableViewProps) {
	const [currentWeek, setCurrentWeek] = useState(new Date());

	const weekStart = getStartOfWeek(currentWeek);
	const weekEnd = getEndOfWeek(currentWeek);

	const {data, isLoading, error, refresh} = useWeeklyWorklogSummary(
		weekStart,
		weekEnd,
		config,
		false, // Always load fresh data when component mounts
		userEmail || undefined,
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

	useInput((input, _key) => {
		if (input === 'q') {
			onBack();
		} else if (input === 't') {
			handleCurrentWeek();
		} else if (input === 'r') {
			refresh();
		} else if (input === 'l' && onLogWork) {
			onLogWork();
		}
		// Note: ESC key is handled by App.tsx to avoid conflicts
		// Note: Arrow keys are now handled by TimetableGrid for cell navigation
		// Shift+Arrow keys are handled by TimetableGrid for week navigation
	});

	return (
		<Box flexDirection="column" height={40}>
			{/* JIRACLE Rainbow Banner */}
			<Box justifyContent="center" paddingY={1}>
				<Gradient name="rainbow">
					<BigText text="JIRACLE" font="tiny" />
				</Gradient>
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
				onCellWorklog={onCellWorklog}
			/>

			{/* Footer with keyboard shortcuts */}
			<Box justifyContent="center" paddingY={2}>
				<Text color="gray">
					[↑↓←→] Navigate Cells [Enter] Log Work [Shift+←→] Week Navigation [L]
					Log Work [T] Today [R] Refresh [Q] Quit
				</Text>
			</Box>

			{/* Extra spacing to make app taller */}
			<Box paddingY={3}>
				<Text color="gray" dimColor>
					{/* Empty space for better visual layout */}
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
