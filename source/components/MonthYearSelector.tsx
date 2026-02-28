import React, {useState, useRef} from 'react';
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
	const selectedYearRef = useRef(selectedYear);
	const selectedMonthRef = useRef(selectedMonth);
	const pendingSubmitRef = useRef(false);
	const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	selectedYearRef.current = selectedYear;
	selectedMonthRef.current = selectedMonth;

	const years = generateYears(currentDate.getFullYear());

	useInput((input, key) => {
		if (input === 'q' || key.escape) {
			onCancel();
			return;
		}

		if (key.return) {
			pendingSubmitRef.current = true;
			if (submitTimeoutRef.current) {
				clearTimeout(submitTimeoutRef.current);
			}

			submitTimeoutRef.current = setTimeout(() => {
				if (!pendingSubmitRef.current) {
					return;
				}

				pendingSubmitRef.current = false;
				onSelect({
					year: selectedYearRef.current,
					month: selectedMonthRef.current,
				});
			}, 10);
			return;
		}

		if (key.tab) {
			setFocusField(focusField === 'year' ? 'month' : 'year');
			pendingSubmitRef.current = false;
			if (submitTimeoutRef.current) {
				clearTimeout(submitTimeoutRef.current);
			}
		}
	});

	return (
		<Box justifyContent="center">
			<Box flexDirection="column" width={40}>
				<Box marginBottom={1} justifyContent="center">
					<Text bold>Select Export Period</Text>
				</Box>

				<Box flexDirection="column" gap={1}>
					<Box flexDirection="row" alignItems="center" gap={2}>
						<Box width={6}>
							<Text>Year:</Text>
						</Box>
						<Box width={10}>
							{focusField === 'year' ? (
								<Select
									options={years}
									defaultValue={selectedYear.toString()}
									onChange={value => {
										const nextYear = Number.parseInt(value, 10);
										setSelectedYear(nextYear);
										// Cancel any pending submit when year changes
										pendingSubmitRef.current = false;
										if (submitTimeoutRef.current) {
											clearTimeout(submitTimeoutRef.current);
										}
									}}
								/>
							) : (
								<Text>{selectedYear}</Text>
							)}
						</Box>
					</Box>

					<Box flexDirection="row" alignItems="center" gap={2}>
						<Box width={6}>
							<Text>Month:</Text>
						</Box>
						<Box width={18}>
							{focusField === 'month' ? (
								<Select
									options={MONTHS}
									defaultValue={selectedMonth.toString()}
									onChange={value => {
										const nextMonth = Number.parseInt(value, 10);
										setSelectedMonth(nextMonth);
										// Cancel any pending submit when month changes
										pendingSubmitRef.current = false;
										if (submitTimeoutRef.current) {
											clearTimeout(submitTimeoutRef.current);
										}
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

				<Box marginTop={1} justifyContent="center">
					<Text dimColor>
						Tab: Switch fields • Enter: Confirm • q/Esc: Cancel
					</Text>
				</Box>
			</Box>
		</Box>
	);
}
