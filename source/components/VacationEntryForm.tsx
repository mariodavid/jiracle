import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {LocalDate} from '../domain/LocalDate.js';

export type VacationEntryFormProps = {
	onSave: (startDate: LocalDate, endDate: LocalDate) => void;
	onCancel: () => void;
};

type ActiveField = 'startDate' | 'endDate';

export function VacationEntryForm({onSave, onCancel}: VacationEntryFormProps) {
	const [startDate, setStartDate] = useState(LocalDate.today());
	const [endDate, setEndDate] = useState(LocalDate.today());
	const [activeField, setActiveField] = useState<ActiveField>('startDate');

	useInput((_input, key) => {
		if (key.return) {
			// Validate and save
			if (startDate.toISOString() > endDate.toISOString()) {
				// Invalid range - could show error
				return;
			}

			onSave(startDate, endDate);
			return;
		}

		if (key.escape) {
			onCancel();
			return;
		}

		if (key.tab) {
			setActiveField(activeField === 'startDate' ? 'endDate' : 'startDate');
			return;
		}

		if (key.upArrow) {
			if (activeField === 'startDate') {
				setStartDate(startDate.addDays(1));
			} else {
				setEndDate(endDate.addDays(1));
			}

			return;
		}

		if (key.downArrow) {
			if (activeField === 'startDate') {
				setStartDate(startDate.addDays(-1));
			} else {
				setEndDate(endDate.addDays(-1));
			}

			return;
		}

		if (key.pageUp) {
			if (activeField === 'startDate') {
				setStartDate(startDate.addDays(7));
			} else {
				setEndDate(endDate.addDays(7));
			}

			return;
		}

		if (key.pageDown) {
			if (activeField === 'startDate') {
				setStartDate(startDate.addDays(-7));
			} else {
				setEndDate(endDate.addDays(-7));
			}
		}
	});

	const calculateDays = (): number => {
		if (startDate.toISOString() > endDate.toISOString()) {
			return 0;
		}

		let count = 0;
		let currentDate = startDate;

		while (currentDate.toISOString() <= endDate.toISOString()) {
			count++;
			currentDate = currentDate.addDays(1);
		}

		return count;
	};

	const getDayOfWeek = (date: LocalDate): string => {
		const dayNames = ['Son', 'Mon', 'Die', 'Mit', 'Don', 'Fre', 'Sam'];
		return dayNames[date.toDate().getDay()] ?? 'Unknown';
	};

	const formatDateWithDay = (date: LocalDate): string => {
		return `${date.toISOString()} (${getDayOfWeek(date)})`;
	};

	const days = calculateDays();
	const isValidRange = startDate.toISOString() <= endDate.toISOString();
	const hasWeekends = checkForWeekends(startDate, endDate);

	return (
		<Box flexDirection="column" paddingX={2}>
			{/* Title */}
			<Box justifyContent="center" paddingY={1}>
				<Text bold color="cyan">
					Add Vacation Days
				</Text>
			</Box>

			{/* Separator */}
			<Box paddingY={1}>
				<Text color="gray">{'═'.repeat(50)}</Text>
			</Box>

			{/* Form Fields */}
			<Box paddingY={1}>
				<Box width={15}>
					<Text>Start Date:</Text>
				</Box>
				<Text
					color={activeField === 'startDate' ? 'cyan' : 'white'}
					bold={activeField === 'startDate'}
				>
					{formatDateWithDay(startDate)}
				</Text>
			</Box>

			<Box paddingY={1}>
				<Box width={15}>
					<Text>End Date:</Text>
				</Box>
				<Text
					color={activeField === 'endDate' ? 'cyan' : 'white'}
					bold={activeField === 'endDate'}
				>
					{formatDateWithDay(endDate)}
				</Text>
			</Box>

			{/* Preview */}
			<Box paddingY={1}>
				<Text>
					Preview: {isValidRange ? `${days} days` : 'Invalid date range'}
				</Text>
			</Box>

			{/* Warnings */}
			{hasWeekends && isValidRange && (
				<Box paddingY={1}>
					<Text color="yellow">⚠️ Includes weekends</Text>
				</Box>
			)}

			{!isValidRange && (
				<Box paddingY={1}>
					<Text color="red">
						❌ Start date must be before or equal to end date
					</Text>
				</Box>
			)}

			{/* Help Text */}
			<Box paddingY={2}>
				<Text color="gray">
					[↑/↓] Change date [PgUp/PgDn] ±1 week [Tab] Switch field [Enter] Save
					[Esc] Cancel
				</Text>
			</Box>
		</Box>
	);
}

function checkForWeekends(startDate: LocalDate, endDate: LocalDate): boolean {
	if (startDate.toISOString() > endDate.toISOString()) {
		return false;
	}

	let currentDate = startDate;

	while (currentDate.toISOString() <= endDate.toISOString()) {
		const dayOfWeek = currentDate.toDate().getDay();

		if (dayOfWeek === 0 || dayOfWeek === 6) {
			// Sunday or Saturday
			return true;
		}

		currentDate = currentDate.addDays(1);
	}

	return false;
}
