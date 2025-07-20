import React from 'react';
import {Box, Text} from 'ink';
import {formatLocalDateKey} from '../utils/date.js';
import {formatHours} from '../utils/TimetableCalculations.js';
import {AttendanceCalculations} from '../attendance/AttendanceCalculations.js';
import type {WeeklyAttendance} from '../attendance/types.js';

interface AttendanceFooterRowsProps {
	weekDates: Date[];
	weeklyAttendance: WeeklyAttendance;
	dailyLoggedHours: Record<string, number>;
}

export function AttendanceFooterRows({
	weekDates,
	weeklyAttendance,
	dailyLoggedHours,
}: AttendanceFooterRowsProps) {
	// Get working hours cell value (numeric hours only)
	const getWorkingHoursCellValue = (dateKey: string): string => {
		const attendance = weeklyAttendance[dateKey];
		if (!attendance) {
			return '-'; // Show dash when no data exists
		}

		const workingHours = attendance.totalHours || 0;
		return workingHours > 0 ? formatHours(workingHours) : '-';
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
							{formatHours(
								Object.values(weeklyAttendance).reduce(
									(sum, att) => sum + (att?.totalHours || 0),
									0,
								),
							)}
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
				? '0'
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
