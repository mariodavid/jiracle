import React from 'react';
import {Box, Text, useInput} from 'ink';
import {VacationService} from '../domain/VacationService.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {VacationEntry} from '../domain/VacationEntry.js';
import type {LocalDate} from '../domain/LocalDate.js';
import {ContentWrapper} from './ContentWrapper.js';

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

	const totalDays = VacationService.calculateTotalDays(vacationEntries);

	return (
		<ContentWrapper>
			{/* Title */}
			<Box justifyContent="center" paddingY={1}>
				<Text bold color="cyan">
					Vacation Days {currentYear}
				</Text>
			</Box>

			{/* Separator */}
			<Box paddingY={1} justifyContent="center">
				<Text color="gray">{'═'.repeat(60)}</Text>
			</Box>

			{/* Table Header */}
			<Box paddingY={1}>
				<Box width={35}>
					<Text bold>Period</Text>
				</Box>
				<Text bold>Days</Text>
			</Box>

			{/* Separator */}
			<Box justifyContent="center">
				<Text color="gray">{'─'.repeat(60)}</Text>
			</Box>

			{/* Vacation Entries */}
			{vacationEntries.length === 0 ? (
				<Box paddingY={2} justifyContent="center">
					<Text color="yellow">
						No vacation days recorded for {currentYear}
					</Text>
				</Box>
			) : (
				<Box flexDirection="column">
					{vacationEntries.map((entry, index) => (
						<Box key={index} paddingY={0}>
							<Box width={35}>
								<Text>{entry.formatDateRange()}</Text>
							</Box>
							<Text>{entry.getWeekdayCount()}</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Separator */}
			<Box paddingY={1} justifyContent="center">
				<Text color="gray">{'─'.repeat(60)}</Text>
			</Box>

			{/* Total */}
			<Box>
				<Box width={35}>
					<Text bold>Total</Text>
				</Box>
				<Text bold>{totalDays} days</Text>
			</Box>

			{/* Help Text - Footer */}
			<Box
				height={7}
				justifyContent="center"
				flexDirection="column"
				alignItems="center"
			>
				<Text color="gray">
					[A]dd vacation {onRemoveVacation ? '[R]emove ' : ''}[Q]uit
				</Text>
			</Box>
		</ContentWrapper>
	);
}

export const {groupVacationDates} = VacationService;
