import React from 'react';
import {Box, Text} from 'ink';

export interface WeekNavigatorProps {
	currentWeek: Date;
	onPreviousWeek: () => void;
	onNextWeek: () => void;
	onCurrentWeek: () => void;
}

export function WeekNavigator({currentWeek}: WeekNavigatorProps) {
	const weekStart = getStartOfWeek(currentWeek);
	const weekEnd = getEndOfWeek(currentWeek);
	const weekNumber = getWeekNumber(currentWeek);

	const formatDateRange = (start: Date, end: Date): string => {
		const startFormatted = formatDate(start);
		const endFormatted = formatDate(end);

		if (
			start.getMonth() === end.getMonth() &&
			start.getFullYear() === end.getFullYear()
		) {
			// Same month: "Jan 6-12, 2025"
			const monthName = start.toLocaleDateString('en-US', {month: 'short'});
			return `${monthName} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
		} else if (start.getFullYear() === end.getFullYear()) {
			// Same year: "Dec 30 - Jan 5, 2025"
			const startMonth = start.toLocaleDateString('en-US', {month: 'short'});
			const endMonth = end.toLocaleDateString('en-US', {month: 'short'});
			return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
		} else {
			// Different years: "Dec 30, 2024 - Jan 5, 2025"
			return `${startFormatted} - ${endFormatted}`;
		}
	};

	return (
		<Box justifyContent="space-between" paddingX={1}>
			<Text color="blue">← Previous Week</Text>
			<Text>
				Week {weekNumber} ({formatDateRange(weekStart, weekEnd)})
			</Text>
			<Text color="blue">Next Week →</Text>
		</Box>
	);
}

function getStartOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
	return new Date(d.setDate(diff));
}

function getEndOfWeek(date: Date): Date {
	const start = getStartOfWeek(date);
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	return end;
}

function getWeekNumber(date: Date): number {
	const d = new Date(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
	);
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatDate(date: Date): string {
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}
