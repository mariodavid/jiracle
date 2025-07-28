import React from 'react';
import {Box, Text} from 'ink';
import {LocalDate} from '../domain/LocalDate.js';
import {WeekRange} from '../domain/WeekRange.js';

export type WeekNavigatorProps = {
	currentWeek: Date;
	onPreviousWeek: () => void;
	onNextWeek: () => void;
	onCurrentWeek: () => void;
	activeArea: 'prev-week' | 'timetable' | 'next-week';
};

// Helper function to get week title - exported for use in TitleBar
export function getWeekTitle(currentWeek: Date): string {
	const localDate = LocalDate.fromDate(currentWeek);
	const weekRange = WeekRange.fromDate(localDate);
	const weekNumber = weekRange.getWeekNumber();
	return `Week ${weekNumber} (${weekRange.toDisplayString()})`;
}

export function WeekNavigator({activeArea}: WeekNavigatorProps) {
	const isPreviousFocused = activeArea === 'prev-week';
	const isNextFocused = activeArea === 'next-week';

	return (
		<Box justifyContent="space-between" paddingX={1}>
			<Text
				color={isPreviousFocused ? 'black' : 'blue'}
				backgroundColor={isPreviousFocused ? 'blue' : undefined}
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
