import React from 'react';
import {Box, Text} from 'ink';
import figures from 'figures';
import type {YearlyStatistics} from '../use-cases/StatisticsUseCase.js';

export type StatisticsGridProps = {
	statistics: YearlyStatistics;
};

export function StatisticsGrid({statistics}: StatisticsGridProps) {
	const monthData = statistics.monthlyStats;

	return (
		<Box flexDirection="column">
			{/* Header Row */}
			<Box>
				<Box width={20}>
					<Text bold>Month</Text>
				</Box>
				<Box width={15} justifyContent="center">
					<Text bold>Worklog Days</Text>
				</Box>
				<Box width={15} justifyContent="center">
					<Text bold>Attendance Days</Text>
				</Box>
			</Box>

			{/* Separator */}
			<Box>
				<Box width={20}>
					<Text dimColor>{figures.line.repeat(18)}</Text>
				</Box>
				<Box width={15} justifyContent="center">
					<Text dimColor>{figures.line.repeat(13)}</Text>
				</Box>
				<Box width={15} justifyContent="center">
					<Text dimColor>{figures.line.repeat(13)}</Text>
				</Box>
			</Box>

			{/* Data Rows */}
			{monthData.map(month => (
				<Box key={month.month}>
					<Box width={20}>
						<Text>{month.month}</Text>
					</Box>
					<Box width={15} justifyContent="center">
						<Text>{month.worklogDays}</Text>
					</Box>
					<Box width={15} justifyContent="center">
						<Text>{month.attendanceDays}</Text>
					</Box>
				</Box>
			))}

			{/* Total Separator */}
			<Box>
				<Box width={20}>
					<Text dimColor>{figures.line.repeat(18)}</Text>
				</Box>
				<Box width={15} justifyContent="center">
					<Text dimColor>{figures.line.repeat(13)}</Text>
				</Box>
				<Box width={15} justifyContent="center">
					<Text dimColor>{figures.line.repeat(13)}</Text>
				</Box>
			</Box>

			{/* Total Row */}
			<Box>
				<Box width={20}>
					<Text bold>Total</Text>
				</Box>
				<Box width={15} justifyContent="center">
					<Text bold>{statistics.totalWorklogDays}</Text>
				</Box>
				<Box width={15} justifyContent="center">
					<Text bold>{statistics.totalAttendanceDays}</Text>
				</Box>
			</Box>
		</Box>
	);
}
