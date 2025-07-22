import React from 'react';
import {Box, Text} from 'ink';
import {getStartOfWeek, getEndOfWeek} from '../utils/date.js';

export type WeekNavigatorProps = {
	currentWeek: Date;
	onPreviousWeek: () => void;
	onNextWeek: () => void;
	onCurrentWeek: () => void;
	activeArea: 'prev-week' | 'timetable' | 'next-week';
};

// Helper function to get week title - exported for use in TitleBar
export function getWeekTitle(currentWeek: Date): string {
	const weekStart = getStartOfWeek(currentWeek);
	const weekEnd = getEndOfWeek(currentWeek);
	const weekNumber = getWeekNumber(currentWeek);
	return `Week ${weekNumber} (${formatDateRange(weekStart, weekEnd)})`;
}

export function WeekNavigator({activeArea}: WeekNavigatorProps) {
	const isPrevFocused = activeArea === 'prev-week';
	const isNextFocused = activeArea === 'next-week';

	return (
		<Box justifyContent="space-between" paddingX={1}>
			<Text
				color={isPrevFocused ? 'black' : 'blue'}
				backgroundColor={isPrevFocused ? 'blue' : undefined}
			>
				{' ← Previous Week '}
			</Text>
			<Box flexGrow={1} />
			<Text
				color={isNextFocused ? 'black' : 'blue'}
				backgroundColor={isNextFocused ? 'blue' : undefined}
			>
				{' Next Week → '}
			</Text>
		</Box>
	);
}

function formatDateRange(start: Date, end: Date): string {
	const startFormatted = formatDate(start);
	const endFormatted = formatDate(end);

	if (
		start.getMonth() === end.getMonth() &&
		start.getFullYear() === end.getFullYear()
	) {
		// Same month: "Jan 6-12, 2025"
		const monthName = start.toLocaleDateString('en-US', {month: 'short'});
		return `${monthName} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
	}

	if (start.getFullYear() === end.getFullYear()) {
		// Same year: "Dec 30 - Jan 5, 2025"
		const startMonth = start.toLocaleDateString('en-US', {month: 'short'});
		const endMonth = end.toLocaleDateString('en-US', {month: 'short'});
		return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
	}

	// Different years: "Dec 30, 2024 - Jan 5, 2025"
	return `${startFormatted} - ${endFormatted}`;
}

function getWeekNumber(date: Date): number {
	const d = new Date(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
	);
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

function formatDate(date: Date): string {
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}
