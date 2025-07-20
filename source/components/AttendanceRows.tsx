import React from 'react';
import {Box, Text} from 'ink';
import {FocusableCell} from './FocusableCell.js';
import {formatLocalDateKey} from '../utils/date.js';
import type {WeeklyAttendance} from '../attendance/types.js';

interface AttendanceRowsProps {
	weekDates: Date[];
	weeklyAttendance: WeeklyAttendance;
	isActive: boolean;
	onFocusChange: (
		issueKey: string,
		columnIndex: number,
		isFocused: boolean,
	) => void;
}

export function AttendanceRows({
	weekDates,
	weeklyAttendance,
	isActive,
	onFocusChange,
}: AttendanceRowsProps) {
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
				const h = Number.parseInt(hours || '0', 10);
				const m = Number.parseInt(minutes || '0', 10);
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
			{/* Render the attendance row (time ranges only) */}
			{renderAttendanceRow()}
		</Box>
	);
}
