import React from 'react';
import {Box, Text} from 'ink';
import {FocusableCell} from './FocusableCell.js';
import {formatLocalDateKey} from '../utils/date.js';
import {Duration} from '../utils/Duration.js';
import {AttendanceCalculations} from '../attendance/AttendanceCalculations.js';
import type {WeeklyAttendance} from '../attendance/types.js';
import type {JiraConfig} from '../jira-client.js';

interface AttendanceRowsProps {
	weekDates: Date[];
	weeklyAttendance: WeeklyAttendance;
	dailyLoggedHours: Record<string, number>;
	isActive: boolean;
	config?: JiraConfig;
	onFocusChange: (
		issueKey: string,
		columnIndex: number,
		isFocused: boolean,
	) => void;
}

export function AttendanceRows({
	weekDates,
	weeklyAttendance,
	dailyLoggedHours,
	isActive,
	config,
	onFocusChange,
}: AttendanceRowsProps) {
	// Helper function to calculate working hours cell value
	const getWorkingHoursCellValue = (date: string): string => {
		const attendance = weeklyAttendance[date];

		if (!attendance || (!attendance.checkIn && !attendance.checkOut)) {
			return '-'; // Show dash when no data exists
		}

		// Calculate working hours using Duration class
		const calculateWorkingHours = (
			checkIn: string,
			checkOut: string,
			breakMinutes: number,
		): string => {
			const workingDuration = Duration.calculateWorkingDuration(
				checkIn,
				checkOut,
				breakMinutes,
			);
			return workingDuration.toDecimalHours();
		};

		const breakMinutes =
			attendance.breakMinutes || config?.attendance?.defaultBreakMinutes || 60; // Use configured break time or default to 60 minutes
		const workingHours = calculateWorkingHours(
			attendance.checkIn || '08:00',
			attendance.checkOut || '17:00',
			breakMinutes,
		);

		return workingHours;
	};

	// Render attendance row (time range only)
	const renderAttendanceRow = () => {
		const attendanceRows = [
			{key: 'attendance', label: 'Attendance', type: 'attendance' as const},
		];

		const getTimeRangeCellValue = (date: string): string => {
			const attendance = weeklyAttendance[date];

			if (!attendance || (!attendance.checkIn && !attendance.checkOut)) {
				return '-'; // Show dash when no data exists
			}

			// Format times to compact format (remove leading zeros and :00)
			const formatTime = (time: string) => {
				if (!time) return '';
				const [hours, minutes] = time.split(':');
				const h = parseInt(hours || '0', 10);
				const m = parseInt(minutes || '0', 10);
				return m === 0 ? h.toString() : `${h}:${minutes}`;
			};

			const checkIn = formatTime(attendance.checkIn || '08:00');
			const checkOut = formatTime(attendance.checkOut || '17:00');

			return `${checkIn}-${checkOut}`;
		};

		return (
			<>
				{attendanceRows.map(row => (
					<Box key={`attendance-row-${row.key}`} flexDirection="column">
						<Box flexDirection="row">
							{/* Arrow indicator - empty for attendance rows */}
							<Box width={2}>
								<Text> </Text>
							</Box>
							{/* Row label */}
							<Box width={20}>
								<Text bold color="yellow">
									{row.label}
								</Text>
							</Box>
							{/* Day columns */}
							{weekDates.map((date, index) => {
								const cellValue = getTimeRangeCellValue(
									formatLocalDateKey(date),
								);

								return isActive ? (
									<FocusableCell
										key={`attendance-${row.key}-${index}`}
										value={cellValue}
										focusId={`attendance-${row.key}-${index}`}
										isActive={true}
										issueKey={`attendance-${row.key}`}
										columnIndex={index}
										onFocusChange={onFocusChange}
										width={12}
										rightAlign={true}
									/>
								) : (
									<Box
										key={`attendance-static-${row.key}-${date}`}
										width={12}
										justifyContent="flex-end"
									>
										<Text>{cellValue}</Text>
									</Box>
								);
							})}
							{/* Total column - empty for attendance rows */}
							<Box width={8}>
								<Text> </Text>
							</Box>
						</Box>
					</Box>
				))}
			</>
		);
	};

	// Render hours row (working hours from attendance data)
	const renderHoursRow = () => {
		return (
			<Box flexDirection="column">
				<Box flexDirection="row">
					{/* Arrow indicator - empty for hours row */}
					<Box width={2}>
						<Text> </Text>
					</Box>
					{/* Row label */}
					<Box width={20}>
						<Text bold color="yellow">
							Attendance
						</Text>
					</Box>
					{/* Day columns */}
					{weekDates.map((date, index) => {
						const cellValue = getWorkingHoursCellValue(
							formatLocalDateKey(date),
						);

						// Hours row is not focusable - always render as static text
						return (
							<Box
								key={`hours-static-${index}`}
								width={12}
								justifyContent="flex-end"
							>
								<Text>{cellValue}</Text>
							</Box>
						);
					})}
					{/* Total column - empty for hours row */}
					<Box width={8}>
						<Text> </Text>
					</Box>
				</Box>
			</Box>
		);
	};

	// Render delta row (difference between logged and attendance hours)
	const renderDeltaRow = () => {
		const weekDateKeys = weekDates.map(date => formatLocalDateKey(date));
		const dailyDeltas = AttendanceCalculations.calculateDailyDeltas(
			weeklyAttendance,
			dailyLoggedHours,
			weekDateKeys,
		);

		const getDeltaCellValue = (date: string): string => {
			const delta = dailyDeltas[date];
			if (delta === null || delta === undefined) {
				return '-';
			}
			return delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
		};

		const getDeltaCellColor = (date: string): string => {
			const delta = dailyDeltas[date];
			if (delta === null || delta === undefined) {
				return 'yellow';
			}
			if (delta === 0) {
				return 'green';
			}
			// Any deviation from 0 is problematic
			return 'red';
		};

		return (
			<Box flexDirection="column">
				<Box flexDirection="row">
					{/* Arrow indicator - empty for delta row */}
					<Box width={2}>
						<Text> </Text>
					</Box>
					{/* Row label */}
					<Box width={20}>
						<Text bold color="yellow">
							Delta
						</Text>
					</Box>
					{/* Day columns */}
					{weekDates.map((date, index) => {
						const dateKey = formatLocalDateKey(date);
						return (
							<Box key={`delta-${index}`} width={12} justifyContent="flex-end">
								<Text color={getDeltaCellColor(dateKey)}>
									{getDeltaCellValue(dateKey)}
								</Text>
							</Box>
						);
					})}
					{/* Total column - empty for delta row */}
					<Box width={8}>
						<Text> </Text>
					</Box>
				</Box>
			</Box>
		);
	};

	return (
		<Box flexDirection="column">
			{/* Separator line above attendance */}
			<Box flexDirection="row">
				<Box width={2}>
					<Text color="gray">{'─'.repeat(2)}</Text>
				</Box>
				<Box width={20}>
					<Text color="gray">{'─'.repeat(20)}</Text>
				</Box>
				{weekDates.map((_, index) => (
					<Box key={`attendance-separator-${index}`} width={12}>
						<Text color="gray">{'─'.repeat(12)}</Text>
					</Box>
				))}
				<Box width={8}>
					<Text color="gray">{'─'.repeat(8)}</Text>
				</Box>
			</Box>
			{/* Spacing after separator */}
			<Box>
				<Text> </Text>
			</Box>
			{/* Render the attendance row */}
			{renderAttendanceRow()}
			{/* Hours row */}
			{renderHoursRow()}
			{/* Delta row */}
			{renderDeltaRow()}
		</Box>
	);
}
