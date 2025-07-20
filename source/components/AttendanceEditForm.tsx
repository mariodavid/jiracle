import React, {useState} from 'react';
import {Box, Text, useInput, useFocus} from 'ink';
import TimeInputField from './TimeInputField.js';
import DurationInput from './WorklogForm/DurationInput.js';
import {Duration} from '../utils/Duration.js';
import type {Attendance} from '../attendance/types.js';

interface AttendanceEditFormProps {
	date: Date;
	initialData?: Attendance;
	onSubmit: (data: Attendance) => void;
	onCancel: () => void;
	config?: any;
}

export function AttendanceEditForm({
	date,
	initialData,
	onSubmit,
	onCancel,
	config,
}: AttendanceEditFormProps) {
	// Use defaults from config only if no initial data exists
	const getDefaultCheckIn = () => {
		if (initialData?.checkIn) return initialData.checkIn;
		return (config?.attendance?.defaultCheckIn as string) || '08:00';
	};

	const getDefaultCheckOut = () => {
		if (initialData?.checkOut) return initialData.checkOut;
		return (config?.attendance?.defaultCheckOut as string) || '17:00';
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

	const formatDate = (date: Date) => {
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
		return `${days[date.getDay()]}, ${date.getDate()}. ${
			months[date.getMonth()]
		}`;
	};

	const handleSubmit = () => {
		// Use local date format to avoid timezone issues
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const localDateString = `${year}-${month}-${day}`;

		// Parse break minutes using Duration class
		const parseBreakMinutes = (timeStr: string): number => {
			return new Duration(timeStr).toMinutes();
		};

		const attendanceData: Attendance = {
			date: localDateString,
			checkIn: checkIn || undefined,
			checkOut: checkOut || undefined,
			breakMinutes: parseBreakMinutes(breakMinutes),
		};
		onSubmit(attendanceData);
	};

	useInput(
		(_, key) => {
			if (!isFocused) return;

			// Escape to cancel
			if (key.escape) {
				onCancel();
				return;
			}

			// Tab navigation between areas
			if (key.tab) {
				if (key.shift) {
					// Shift+Tab for reverse navigation
					switch (focusArea) {
						case 'checkIn': {
							setFocusArea('cancel');
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
						case 'submit': {
							setFocusArea('break');
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
				} else {
					// Regular Tab for forward navigation
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
		},
		{isActive: isFocused},
	);

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
							onChange={setCheckIn}
							onSubmit={() => setFocusArea('checkOut')}
							compact={true}
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
							onChange={setCheckOut}
							onSubmit={() => setFocusArea('break')}
							compact={true}
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
							onChange={setBreakMinutes}
							onSubmit={() => setFocusArea('submit')}
							compact={true}
							allowedUnits={['h', 'm']}
							incrementMinutes={15}
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
