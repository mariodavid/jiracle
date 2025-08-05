import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {Select} from '@inkjs/ui';

export type MonthYearSelection = {
	year: number;
	month: number;
};

type MonthYearSelectorProps = {
	initialSelection?: MonthYearSelection;
	onSelect: (selection: MonthYearSelection) => void;
	onCancel: () => void;
};

const MONTHS = [
	{label: 'January (1)', value: '1'},
	{label: 'February (2)', value: '2'},
	{label: 'March (3)', value: '3'},
	{label: 'April (4)', value: '4'},
	{label: 'May (5)', value: '5'},
	{label: 'June (6)', value: '6'},
	{label: 'July (7)', value: '7'},
	{label: 'August (8)', value: '8'},
	{label: 'September (9)', value: '9'},
	{label: 'October (10)', value: '10'},
	{label: 'November (11)', value: '11'},
	{label: 'December (12)', value: '12'},
];

const generateYears = (
	currentYear: number,
): Array<{label: string; value: string}> => {
	const years = [];

	for (let year = currentYear - 2; year <= currentYear + 1; year++) {
		years.push({label: year.toString(), value: year.toString()});
	}

	return years;
};

export function MonthYearSelector({
	initialSelection,
	onSelect,
	onCancel,
}: MonthYearSelectorProps) {
	const currentDate = new Date();
	const [selectedYear, setSelectedYear] = useState(
		initialSelection?.year ?? currentDate.getFullYear(),
	);
	const [selectedMonth, setSelectedMonth] = useState(
		initialSelection?.month ?? currentDate.getMonth() + 1,
	);
	const [focusField, setFocusField] = useState<'year' | 'month'>('year');

	const years = generateYears(currentDate.getFullYear());

	useInput((input, key) => {
		if (input === 'q' || key.escape) {
			onCancel();
			return;
		}

		if (key.return) {
			onSelect({year: selectedYear, month: selectedMonth});
			return;
		}

		if (key.tab) {
			setFocusField(focusField === 'year' ? 'month' : 'year');
		}
	});

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold>Select Export Period</Text>
			</Box>

			<Box flexDirection="column" gap={1}>
				<Box flexDirection="row" alignItems="center" gap={2}>
					<Text>Year:</Text>
					<Box width={10}>
						{focusField === 'year' ? (
							<Select
								options={years}
								defaultValue={selectedYear.toString()}
								onChange={value => {
									setSelectedYear(Number.parseInt(value, 10));
								}}
							/>
						) : (
							<Text>{selectedYear}</Text>
						)}
					</Box>
				</Box>

				<Box flexDirection="row" alignItems="center" gap={2}>
					<Text>Month:</Text>
					<Box width={20}>
						{focusField === 'month' ? (
							<Select
								options={MONTHS}
								defaultValue={selectedMonth.toString()}
								onChange={value => {
									setSelectedMonth(Number.parseInt(value, 10));
								}}
							/>
						) : (
							<Text>
								{
									MONTHS.find(
										m => Number.parseInt(m.value, 10) === selectedMonth,
									)?.label
								}
							</Text>
						)}
					</Box>
				</Box>
			</Box>

			<Box marginTop={2}>
				<Text dimColor>[Tab] Switch field [Enter] Continue [Q] Cancel</Text>
			</Box>
		</Box>
	);
}
