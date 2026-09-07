import React, {useState, useRef, useCallback} from 'react';
import {Box, Text, useInput} from 'ink';

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

	const handleYearChange = useCallback(
		(delta: number) => {
			const currentIndex = years.findIndex(
				y => y.value === selectedYear.toString(),
			);
			const newIndex = Math.max(
				0,
				Math.min(years.length - 1, currentIndex + delta),
			);
			setSelectedYear(Number.parseInt(years[newIndex]!.value, 10));
			pendingSubmitRef.current = false;
			if (submitTimeoutRef.current) {
				clearTimeout(submitTimeoutRef.current);
			}
		},
		[years, selectedYear],
	);

	const handleMonthChange = useCallback(
		(delta: number) => {
			let newMonth = selectedMonth + delta;
			if (newMonth < 1) {
				newMonth = 12;
				setSelectedYear(selectedYear - 1);
			} else if (newMonth > 12) {
				newMonth = 1;
				setSelectedYear(selectedYear + 1);
			} else {
				setSelectedMonth(newMonth);
			}
			pendingSubmitRef.current = false;
			if (submitTimeoutRef.current) {
				clearTimeout(submitTimeoutRef.current);
			}
		},
		[selectedMonth, selectedYear],
	);

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
			}, 50);
			return;
		}

		if (key.tab) {
			setFocusField(focusField === 'year' ? 'month' : 'year');
			pendingSubmitRef.current = false;
			if (submitTimeoutRef.current) {
				clearTimeout(submitTimeoutRef.current);
			}
		}

		// Handle arrow keys for year/month navigation when focused
		if (focusField === 'year') {
			if (key.upArrow) {
				handleYearChange(-1);
			} else if (key.downArrow) {
				handleYearChange(1);
			}
		} else if (focusField === 'month') {
			if (key.upArrow) {
				handleMonthChange(-1);
			} else if (key.downArrow) {
				handleMonthChange(1);
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
								<Box flexDirection="row" alignItems="center" gap={1}>
									<Text bold>{'◀'}</Text>
									<Text bold>{selectedYear}</Text>
									<Text bold>{'▶'}</Text>
								</Box>
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
								<Box flexDirection="row" alignItems="center" gap={1}>
									<Text bold>{'◀'}</Text>
									<Text bold>
										{
											MONTHS.find(
												m => Number.parseInt(m.value, 10) === selectedMonth,
											)?.label
										}
									</Text>
									<Text bold>{'▶'}</Text>
								</Box>
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
						↑↓: Change value • Tab: Switch fields • Enter: Confirm • q/Esc:
						Cancel
					</Text>
				</Box>
			</Box>
		</Box>
	);
}
