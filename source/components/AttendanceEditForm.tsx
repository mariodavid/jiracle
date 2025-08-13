import React, {useState} from 'react';
import {Box, Text, useInput, useFocus} from 'ink';
import {Duration} from '../domain/Duration.js';
import type {LocalDate} from '../domain/LocalDate.js';
import type {Attendance} from '../attendance/types.js';
import type {WeeklyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';
import TimeInputField from './TimeInputField.js';
import DurationInput from './WorklogForm/DurationInput.js';

type AttendanceEditFormProps = {
	date: LocalDate;
	initialData?: Attendance;
	onSubmit: (data: Attendance) => void;
	onCancel: () => void;
	config?: any;
	worklogData?: WeeklyWorklogSummary;
};

export function AttendanceEditForm({
	date,
	initialData,
	onSubmit,
	onCancel,
	config,
	worklogData,
}: AttendanceEditFormProps) {
	// Calculate already logged hours for this date
	const getLoggedHoursForDate = (): number => {
		if (!worklogData) return 0;

		// Find the daily summary for this specific date
		const dailySummary = worklogData.dailySummaries.find(summary =>
			summary.date.equals(date),
		);

		// Return the total hours for this date, or 0 if no data found
		return dailySummary?.totalHours ?? 0;
	};

	// Use defaults from config only if no initial data exists
	const getDefaultCheckIn = () => {
		if (initialData?.checkIn) return initialData.checkIn;
		return (config?.attendance?.defaultCheckIn as string) ?? '08:00';
	};

	const getDefaultCheckOut = () => {
		if (initialData?.checkOut) return initialData.checkOut;

		// Calculate intelligent default based on already logged hours
		const loggedHours = getLoggedHoursForDate();
		const targetDailyHours =
			(config?.attendance?.targetDailyHours as number) ?? 8;
		const remainingHours = Math.max(0, targetDailyHours - loggedHours);

		// Parse check-in time to calculate check-out time
		const checkInTime = getDefaultCheckIn();
		const [checkInHour, checkInMinute] = checkInTime.split(':').map(Number);

		// Calculate check-out time: check-in + remaining hours + break time
		const breakMinutes = 30; // Default break time
		const checkInMinutes = (checkInHour ?? 0) * 60 + (checkInMinute ?? 0);
		const checkOutMinutes = checkInMinutes + remainingHours * 60 + breakMinutes;

		const checkOutHour = Math.floor(checkOutMinutes / 60);
		const checkOutMinute = checkOutMinutes % 60;

		// Format as HH:MM
		const formattedCheckOut = `${String(checkOutHour).padStart(
			2,
			'0',
		)}:${String(checkOutMinute).padStart(2, '0')}`;

		return formattedCheckOut;
	};

	const [checkIn, setCheckIn] = useState(getDefaultCheckIn());
	const [checkOut, setCheckOut] = useState(getDefaultCheckOut());
	const [breakMinutes, setBreakMinutes] = useState(
		initialData?.breakMinutes ? `${initialData.breakMinutes}m` : '30m',
	);
	const [focusArea, setFocusArea] = useState<
		'checkIn' | 'checkOut' | 'break' | 'submit' | 'cancel'
	>('checkIn');

	const {isFocused} = useFocus({autoFocus: true});

	const formatDate = (date: LocalDate) => {
		// Convert LocalDate to Date for display formatting
		const jsDate = new Date(date.toISOString());
		const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
		const months = [
			'Jan',
			'Feb',
			'Mar',
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
		return `${String(days[jsDate.getDay()])}, ${jsDate.getDate()}. ${String(
			months[jsDate.getMonth()],
		)}`;
	};

	const handleSubmit = () => {
		// Use LocalDate for consistent date handling
		const localDateString = date.toISOString();

		// Parse break minutes using Duration class
		const parseBreakMinutes = (timeString: string): number => {
			return new Duration(timeString).toMinutes();
		};

		const attendanceData: Attendance = {
			date: localDateString,
			type: 'WORK',
			checkIn,
			checkOut,
			breakMinutes: parseBreakMinutes(breakMinutes),
			totalHours: undefined,
			notes: undefined,
		};
		onSubmit(attendanceData);
	};

	const handleKeyInput = (_input: string, key: any) => {
		// Escape to cancel - always allow regardless of focus state for better reliability
		if (key.escape) {
			onCancel();
			return;
		}

		// Other inputs require focus
		if (!isFocused) return;

		// Ignore arrow keys when TimeInputField, DurationInput, or buttons are focused
		// Let these components handle arrow keys themselves, or prevent interference
		if (
			(key.upArrow || key.downArrow) &&
			(focusArea === 'checkIn' ||
				focusArea === 'checkOut' ||
				focusArea === 'break' ||
				focusArea === 'submit' ||
				focusArea === 'cancel')
		) {
			return;
		}

		// Tab navigation between areas
		if (key.tab) {
			if (key.shift) {
				handleShiftTabNavigation();
			} else {
				handleTabNavigation();
			}

			return;
		}

		// Handle enter in specific areas
		if (key.return) {
			if (focusArea === 'submit') {
				handleSubmit();
			} else if (focusArea === 'cancel') {
				onCancel();
			} else {
				// From time fields, move to submit
				setFocusArea('submit');
			}
		}

		// Break field input is handled by CustomTimeInput
	};

	const handleShiftTabNavigation = () => {
		switch (focusArea) {
			case 'checkIn': {
				setFocusArea('cancel');
				break;
			}

			case 'submit': {
				setFocusArea('break');
				break;
			}

			case 'checkOut': {
				setFocusArea('checkIn');
				break;
			}

			case 'break': {
				setFocusArea('checkOut');
				break;
			}

			case 'cancel': {
				setFocusArea('submit');
				break;
			}

			default: {
				break;
			}
		}
	};

	const handleTabNavigation = () => {
		switch (focusArea) {
			case 'checkIn': {
				setFocusArea('checkOut');
				break;
			}

			case 'checkOut': {
				setFocusArea('break');
				break;
			}

			case 'break': {
				setFocusArea('submit');
				break;
			}

			case 'submit': {
				setFocusArea('cancel');
				break;
			}

			case 'cancel': {
				setFocusArea('checkIn');
				break;
			}

			default: {
				break;
			}
		}
	};

	useInput(handleKeyInput, {isActive: isFocused});

	return (
		<Box flexDirection="column" padding={1}>
			<Box marginBottom={1}>
				<Text bold color="cyan">
					Anwesenheit bearbeiten - {formatDate(date)}
				</Text>
			</Box>

			<Box flexDirection="column">
				{/* Beginn Field */}
				<Box marginBottom={1} flexDirection="column">
					<Text color="yellow">Beginn:</Text>
					{focusArea === 'checkIn' ? (
						<TimeInputField
							label=""
							value={checkIn}
							compact={true}
							isActive={focusArea === 'checkIn'}
							onChange={setCheckIn}
							onSubmit={() => {
								setFocusArea('checkOut');
							}}
						/>
					) : (
						<Text color="gray">{checkIn}</Text>
					)}
				</Box>

				{/* Ende Field */}
				<Box marginBottom={1} flexDirection="column">
					<Text color="yellow">Ende:</Text>
					{focusArea === 'checkOut' ? (
						<TimeInputField
							label=""
							value={checkOut}
							compact={true}
							isActive={focusArea === 'checkOut'}
							onChange={setCheckOut}
							onSubmit={() => {
								setFocusArea('break');
							}}
						/>
					) : (
						<Text color="gray">{checkOut}</Text>
					)}
				</Box>

				{/* Pause Field */}
				<Box marginBottom={2} flexDirection="column">
					<Text color="yellow">Pause:</Text>
					{focusArea === 'break' ? (
						<DurationInput
							value={breakMinutes}
							compact={true}
							allowedUnits={['h', 'm']}
							incrementMinutes={15}
							isActive={focusArea === 'break'}
							onChange={setBreakMinutes}
							onSubmit={() => {
								setFocusArea('submit');
							}}
						/>
					) : (
						<Text color="gray">{breakMinutes}</Text>
					)}
				</Box>
				{/* Buttons */}
				<Box justifyContent="flex-end">
					<Box gap={2}>
						<Text
							color={focusArea === 'submit' ? 'black' : 'blue'}
							{...(focusArea === 'submit' ? {backgroundColor: 'blue'} : {})}
						>
							{' [Speichern] '}
						</Text>
						<Text
							color={focusArea === 'cancel' ? 'black' : 'blue'}
							{...(focusArea === 'cancel' ? {backgroundColor: 'blue'} : {})}
						>
							{' [Abbrechen] '}
						</Text>
					</Box>
				</Box>
			</Box>

			<Box marginTop={1}>
				<Text color="gray">
					[Tab] Feld wechseln [Shift+Tab] Zurück [Enter] Speichern [Esc]
					Abbrechen
				</Text>
			</Box>
		</Box>
	);
}
