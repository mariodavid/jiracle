import React from 'react';
import {Box, Text} from 'ink';
import {formatLocalDateKey} from '../utils/date.js';
import {formatHours} from '../utils/TimetableCalculations.js';
import {AttendanceCalculations} from '../attendance/AttendanceCalculations.js';
import {Duration} from '../utils/Duration.js';
import type {WeeklyAttendance} from '../attendance/types.js';
import type {JiraConfig} from '../jira-client.js';

type AttendanceFooterRowsProps = {
	weekDates: Date[];
	weeklyAttendance: WeeklyAttendance;
	dailyLoggedHours: Record<string, number>;
	config?: JiraConfig;
};

export function AttendanceFooterRows({
	weekDates,
	weeklyAttendance,
	dailyLoggedHours,
	config,
}: AttendanceFooterRowsProps) {
	// Get working hours cell value (with proper break time calculation)
	const getWorkingHoursCellValue = (dateKey: string): string => {
		const attendance = weeklyAttendance[dateKey];
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

	// Render attendance hours row
	const renderAttendanceHoursRow = () => {
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
						return (
							<Box
								key={`attendance-hours-${index}`}
								width={12}
								justifyContent="flex-end"
							>
								<Text color="yellow">{cellValue}</Text>
							</Box>
						);
					})}
					{/* Total column - calculate total attendance hours */}
					<Box width={8} justifyContent="flex-end">
						<Text bold color="yellow">
							{(() => {
								let totalHours = 0;
								for (const date of weekDates) {
									const cellValue = getWorkingHoursCellValue(
										formatLocalDateKey(date),
									);
									const hours =
										cellValue === '-' ? 0 : Number.parseFloat(cellValue);
									totalHours += hours;
								}
								return formatHours(totalHours);
							})()}
						</Text>
					</Box>
				</Box>
			</Box>
		);
	};

	// Render delta row
	const renderDeltaRow = () => {
		// Calculate deltas once for the entire week
		const weekDateKeys = weekDates.map(date => formatLocalDateKey(date));
		const dailyDeltas = AttendanceCalculations.calculateDailyDeltas(
			weeklyAttendance,
			dailyLoggedHours,
			weekDateKeys,
		);

		const getDeltaCellValue = (dateKey: string): string => {
			const delta = dailyDeltas[dateKey];
			if (delta === undefined || delta === null) {
				return '-'; // Show dash when no data available
			}

			const formattedDelta = formatHours(Math.abs(delta));
			return delta === 0
				? '0.0'
				: delta > 0
				? `+${formattedDelta}`
				: `-${formattedDelta}`;
		};

		const getDeltaCellColor = (dateKey: string): string => {
			const delta = dailyDeltas[dateKey];
			if (delta === undefined || delta === null) {
				return 'gray'; // Gray for missing data
			}

			return delta === 0 ? 'green' : 'red'; // Green for exact match, red for any difference
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
		<>
			{/* Attendance hours row */}
			{renderAttendanceHoursRow()}
			{/* Delta row */}
			{renderDeltaRow()}
		</>
	);
}
