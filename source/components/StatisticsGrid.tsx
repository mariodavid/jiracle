import React from 'react';
import {Box, Text} from 'ink';
import type {YearlyStatistics} from '../use-cases/StatisticsUseCase.js';
import type {BonusConfig} from '../jira/types.js';

export type StatisticsGridProps = {
	statistics: YearlyStatistics;
	bonusConfig?: BonusConfig;
};

export function StatisticsGrid({statistics, bonusConfig}: StatisticsGridProps) {
	const monthData = statistics.monthlyStats;
	const showBonus = bonusConfig?.enabled && statistics.totalHours !== undefined;
	const baseWidth = 2 + 20 + 12 + 18; // Margin + Month + Worklog Days + Attendance Days
	const bonusWidth = showBonus ? 12 + 12 + 10 + 10 : 0; // Total Hours + Bonus Days + Efficiency + Extra
	const tableWidth = baseWidth + bonusWidth + 8;

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
				{showBonus && (
					<>
						<Box width={12} justifyContent="flex-end">
							<Text bold color="white">
								Total Hours
							</Text>
						</Box>
						<Box width={12} justifyContent="flex-end">
							<Text bold color="white">
								Bonus Days
							</Text>
						</Box>
						<Box width={10} justifyContent="flex-end">
							<Text bold color="white">
								Efficiency%
							</Text>
						</Box>
						<Box width={10} justifyContent="flex-end">
							<Text bold color="white">
								Target
							</Text>
						</Box>
					</>
				)}
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
			{monthData.map(month => {
				const getEfficiencyColor = (efficiency?: number) => {
					if (!efficiency) return 'white';
					if (efficiency >= 90) return 'green';
					if (efficiency >= 70) return 'yellow';
					return 'red';
				};

				const getTargetIndicator = (bonusDays?: number) => {
					if (!bonusDays || !bonusConfig?.targets) return '';
					const monthlyTarget = bonusConfig.targetDays / 12;
					return bonusDays >= monthlyTarget ? '✓' : '✗';
				};

				return (
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
						{showBonus && (
							<>
								<Box width={12} justifyContent="flex-end">
									<Text>{month.totalHours?.toFixed(1) ?? '-'}</Text>
								</Box>
								<Box width={12} justifyContent="flex-end">
									<Text>{month.bonusDays?.toFixed(1) ?? '-'}</Text>
								</Box>
								<Box width={10} justifyContent="flex-end">
									<Text color={getEfficiencyColor(month.efficiency)}>
										{month.efficiency?.toFixed(0) ?? '-'}%
									</Text>
								</Box>
								<Box width={10} justifyContent="flex-end">
									<Text
										color={
											getTargetIndicator(month.bonusDays) === '✓'
												? 'green'
												: 'red'
										}
									>
										{getTargetIndicator(month.bonusDays)}
									</Text>
								</Box>
							</>
						)}
						<Box width={8} justifyContent="flex-end">
							<Text> </Text>
						</Box>
					</Box>
				);
			})}

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
				{showBonus && (
					<>
						<Box width={12} justifyContent="flex-end">
							<Text bold color="yellow">
								{statistics.totalHours?.toFixed(1) ?? '-'}
							</Text>
						</Box>
						<Box width={12} justifyContent="flex-end">
							<Text bold color="yellow">
								{statistics.totalBonusDays?.toFixed(1) ?? '-'}
							</Text>
						</Box>
						<Box width={10} justifyContent="flex-end">
							<Text bold color="yellow">
								{statistics.yearToDateEfficiency?.toFixed(0) ?? '-'}%
							</Text>
						</Box>
						<Box width={10} justifyContent="flex-end">
							<Text
								bold
								color={
									statistics.totalBonusDays &&
									bonusConfig?.targetDays &&
									statistics.totalBonusDays >= bonusConfig.targetDays
										? 'green'
										: 'red'
								}
							>
								{statistics.totalBonusDays &&
								bonusConfig?.targetDays &&
								statistics.totalBonusDays >= bonusConfig.targetDays
									? '✓'
									: '✗'}
							</Text>
						</Box>
					</>
				)}
				<Box width={8} justifyContent="flex-end">
					<Text> </Text>
				</Box>
			</Box>
		</Box>
	);
}
