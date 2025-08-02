import React from 'react';
import {Box, Text} from 'ink';
import type {YearlyStatistics} from '../use-cases/StatisticsUseCase.js';

export type StatisticsGridProps = {
	statistics: YearlyStatistics;
};

export function StatisticsGrid({statistics}: StatisticsGridProps) {
	const monthData = statistics.monthlyStats;
	const tableWidth = 2 + 20 + 12 + 18 + 8; // Adjusted for wider attendance column

	return (
		<Box flexDirection="column" paddingX={1} alignItems="center" minHeight={25}>
			{/* Header Row */}
			<Box flexDirection="row">
				<Box width={2}>
					<Text bold color="white">
						{' '}
					</Text>
				</Box>
				<Box width={20}>
					<Text bold color="white">
						{' '}
					</Text>
				</Box>
				<Box width={12} justifyContent="flex-end">
					<Text bold color="white">
						Worklog Days
					</Text>
				</Box>
				<Box width={18} justifyContent="flex-end">
					<Text bold color="white">
						Attendance Days (Hours)
					</Text>
				</Box>
				<Box width={8} justifyContent="flex-end">
					<Text bold color="white">
						{' '}
					</Text>
				</Box>
			</Box>

			{/* Separator */}
			<Box width={tableWidth}>
				<Text color="gray">{'─'.repeat(tableWidth)}</Text>
			</Box>

			{/* Data Rows */}
			{monthData.map(month => (
				<Box key={month.month} flexDirection="row">
					<Box width={2}>
						<Text> </Text>
					</Box>
					<Box width={20}>
						<Text bold color="cyan">
							{month.month}
						</Text>
					</Box>
					<Box width={12} justifyContent="flex-end">
						<Text>{month.worklogDays}</Text>
					</Box>
					<Box width={18} justifyContent="flex-end">
						<Text>
							{month.attendanceDays} ({month.attendanceDays * 8}h)
						</Text>
					</Box>
					<Box width={8} justifyContent="flex-end">
						<Text> </Text>
					</Box>
				</Box>
			))}

			{/* Total Separator */}
			<Box width={tableWidth}>
				<Text color="gray">{'─'.repeat(tableWidth)}</Text>
			</Box>

			{/* Total Row */}
			<Box flexDirection="row">
				<Box width={2}>
					<Text> </Text>
				</Box>
				<Box width={20}>
					<Text bold color="yellow">
						Total
					</Text>
				</Box>
				<Box width={12} justifyContent="flex-end">
					<Text bold color="yellow">
						{statistics.totalWorklogDays}
					</Text>
				</Box>
				<Box width={18} justifyContent="flex-end">
					<Text bold color="yellow">
						{statistics.totalAttendanceDays} (
						{statistics.totalAttendanceDays * 8}h)
					</Text>
				</Box>
				<Box width={8} justifyContent="flex-end">
					<Text> </Text>
				</Box>
			</Box>
		</Box>
	);
}
