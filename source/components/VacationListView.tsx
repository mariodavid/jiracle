import React from 'react';
import {Box, Text, useInput} from 'ink';
import {LocalDate} from '../domain/LocalDate.js';
import type {Attendance} from '../attendance/types.js';

export type VacationEntry = {
	startDate: LocalDate;
	endDate: LocalDate;
	days: number;
};

export type VacationListViewProps = {
	vacationEntries: VacationEntry[];
	currentYear: number;
	onAddVacation: () => void;
	onRemoveVacation?: (startDate: LocalDate) => void;
	onBack: () => void;
};

export function VacationListView({
	vacationEntries,
	currentYear,
	onAddVacation,
	onRemoveVacation,
	onBack,
}: VacationListViewProps) {
	useInput(input => {
		switch (input) {
			case 'q': {
				onBack();
				break;
			}

			case 'a': {
				onAddVacation();
				break;
			}

			case 'r': {
				if (onRemoveVacation && vacationEntries.length > 0) {
					// For now, remove the first entry as example
					// In a full implementation, this would have selection logic
					onRemoveVacation(vacationEntries[0]!.startDate);
				}

				break;
			}

			default: {
				// No action for other keys
				break;
			}
		}
	});

	const totalDays = vacationEntries.reduce((sum, entry) => sum + entry.days, 0);

	const formatDateRange = (entry: VacationEntry): string => {
		const startDate = entry.startDate.toDate();
		const endDate = entry.endDate.toDate();
		const startMonth = getGermanMonth(startDate.getMonth());
		const endMonth = getGermanMonth(endDate.getMonth());

		if (entry.startDate.equals(entry.endDate)) {
			// Single day
			return `${startMonth} ${String(startDate.getDate())}`;
		}

		if (startDate.getMonth() === endDate.getMonth()) {
			// Same month
			return `${startMonth} ${String(startDate.getDate())} - ${String(
				endDate.getDate(),
			)}`;
		}

		// Different months
		return `${startMonth} ${String(startDate.getDate())} - ${endMonth} ${String(
			endDate.getDate(),
		)}`;
	};

	return (
		<Box flexDirection="column" paddingX={2}>
			{/* Title */}
			<Box justifyContent="center" paddingY={1}>
				<Text bold color="cyan">
					Vacation Days {currentYear}
				</Text>
			</Box>

			{/* Separator */}
			<Box paddingY={1}>
				<Text color="gray">{'═'.repeat(50)}</Text>
			</Box>

			{/* Table Header */}
			<Box paddingY={1}>
				<Box width={35}>
					<Text bold>Period</Text>
				</Box>
				<Text bold>Days</Text>
			</Box>

			{/* Separator */}
			<Box>
				<Text color="gray">{'─'.repeat(50)}</Text>
			</Box>

			{/* Vacation Entries */}
			{vacationEntries.length === 0 ? (
				<Box paddingY={2}>
					<Text color="yellow">
						No vacation days recorded for {currentYear}
					</Text>
				</Box>
			) : (
				<Box flexDirection="column">
					{vacationEntries.map((entry, index) => (
						<Box key={index} paddingY={0}>
							<Box width={35}>
								<Text>{formatDateRange(entry)}</Text>
							</Box>
							<Text>{entry.days}</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Separator */}
			<Box paddingY={1}>
				<Text color="gray">{'─'.repeat(50)}</Text>
			</Box>

			{/* Total */}
			<Box>
				<Box width={35}>
					<Text bold>Total</Text>
				</Box>
				<Text bold>{totalDays} days</Text>
			</Box>

			{/* Help Text */}
			<Box paddingY={2}>
				<Text color="gray">
					[A]dd vacation {onRemoveVacation ? '[R]emove ' : ''}[Q]uit
				</Text>
			</Box>
		</Box>
	);
}

function getGermanMonth(monthIndex: number): string {
	const months = [
		'Jan',
		'Feb',
		'Mär',
		'Apr',
		'Mai',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Okt',
		'Nov',
		'Dez',
	];
	return months[monthIndex] ?? 'Unknown';
}

export function groupVacationDates(
	attendanceRecords: Attendance[],
): VacationEntry[] {
	// Filter vacation entries and sort by date
	const vacationDates = attendanceRecords
		.filter(
			record => record.checkIn === 'VACATION' && record.checkOut === 'VACATION',
		)
		.map(record => LocalDate.fromString(record.date))
		.sort((a, b) => a.toISOString().localeCompare(b.toISOString()));

	if (vacationDates.length === 0) {
		return [];
	}

	const groups: VacationEntry[] = [];
	let currentGroup: LocalDate[] = [vacationDates[0]!];

	for (let i = 1; i < vacationDates.length; i++) {
		const currentDate = vacationDates[i]!;
		const lastDate = currentGroup[currentGroup.length - 1]!;

		// Check if current date is consecutive to the last date
		if (currentDate.equals(lastDate.addDays(1))) {
			currentGroup.push(currentDate);
		} else {
			// Start new group
			groups.push({
				startDate: currentGroup[0]!,
				endDate: currentGroup[currentGroup.length - 1]!,
				days: currentGroup.length,
			});
			currentGroup = [currentDate];
		}
	}

	// Add the last group
	groups.push({
		startDate: currentGroup[0]!,
		endDate: currentGroup[currentGroup.length - 1]!,
		days: currentGroup.length,
	});

	return groups;
}
