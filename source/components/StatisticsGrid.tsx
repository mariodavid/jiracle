import React from 'react';
import {Box, Text} from 'ink';
import type {YearlyStatistics} from '../use-cases/StatisticsUseCase.js';
import type {BonusConfig} from '../jira/types.js';

export type StatisticsGridProps = {
	statistics: YearlyStatistics;
	bonusConfig?: BonusConfig;
};

// Helper functions
function getEfficiencyColor(efficiency?: number): string {
	if (!efficiency) return 'white';
	if (efficiency >= 90) return 'green';
	if (efficiency >= 70) return 'yellow';
	return 'red';
}

function getTargetIndicator(
	bonusDays?: number,
	bonusConfig?: BonusConfig,
): string {
	if (!bonusDays || !bonusConfig?.targets) return '';
	const monthlyTarget = bonusConfig.targetDays / 12;
	return bonusDays >= monthlyTarget ? '✓' : '✗';
}

function getTargetColor(totalBonusDays?: number, targetValue?: number): string {
	return totalBonusDays && targetValue && totalBonusDays >= targetValue
		? 'green'
		: 'red';
}

function getTargetStatus(
	totalBonusDays?: number,
	targetValue?: number,
): string {
	return totalBonusDays && targetValue && totalBonusDays >= targetValue
		? '✓'
		: '✗';
}

type MonthRowProps = {
	month: {
		month: string;
		worklogDays: number;
		attendanceDays: number;
		totalHours?: number;
		billableHours?: number;
		nonBillableHours?: number;
		potentialHours?: number;
		businessDays?: number;
		bonusDays?: number;
		efficiency?: number;
		vacationDays?: number;
	};
	showBonus: boolean | undefined;
	bonusConfig?: BonusConfig;
};

function MonthRow({month, showBonus, bonusConfig}: MonthRowProps) {
	return (
		<Box flexDirection="row">
			<Box width={2}>
				<Text> </Text>
			</Box>
			<Box width={12}>
				<Text bold color="cyan">
					{month.month}
				</Text>
			</Box>
			{showBonus && (
				<>
					<Box width={12} justifyContent="flex-end">
						<Text>{month.businessDays ?? '-'}</Text>
					</Box>
					<Box width={12} justifyContent="flex-end">
						<Text color="green">
							{month.billableHours !== undefined &&
							bonusConfig?.hoursPerBonusDay
								? `${(
										month.billableHours / bonusConfig.hoursPerBonusDay
								  ).toFixed(1)}`
								: '-'}
						</Text>
					</Box>
					<Box width={14} justifyContent="flex-end">
						<Text color="red">
							{month.nonBillableHours !== undefined &&
							bonusConfig?.hoursPerBonusDay
								? `${(
										month.nonBillableHours / bonusConfig.hoursPerBonusDay
								  ).toFixed(1)}`
								: '-'}
						</Text>
					</Box>
					<Box width={10} justifyContent="flex-end">
						<Text color="magenta">{month.vacationDays ?? '-'}</Text>
					</Box>
					<Box width={10} justifyContent="flex-end">
						<Text color={getEfficiencyColor(month.efficiency)}>
							{month.efficiency?.toFixed(1) ?? '-'}%
						</Text>
					</Box>
					<Box width={8} justifyContent="flex-end">
						<Text
							color={
								getTargetIndicator(month.bonusDays, bonusConfig) === '✓'
									? 'green'
									: 'red'
							}
						>
							{getTargetIndicator(month.bonusDays, bonusConfig)}
						</Text>
					</Box>
				</>
			)}
			<Box width={8} justifyContent="flex-end">
				<Text> </Text>
			</Box>
		</Box>
	);
}

type TargetSummaryProps = {
	totalBonusDays?: number;
	targets: {
		minimum: {days: number; label: string; percentage: number};
		standard: {days: number; label: string; percentage: number};
		stretch: {days: number; label: string; percentage: number};
		maximum: {days: number; label: string; percentage: number};
	};
};

function TargetSummary({totalBonusDays, targets}: TargetSummaryProps) {
	return (
		<>
			<Box marginTop={1}>
				<Text> </Text>
			</Box>
			<Box flexDirection="row" justifyContent="center">
				<Text>Targets: </Text>
				<Text color={getTargetColor(totalBonusDays, targets.minimum.days)}>
					Minimum ({targets.minimum.days}){' '}
					{getTargetStatus(totalBonusDays, targets.minimum.days)}
				</Text>
				<Text> | </Text>
				<Text color={getTargetColor(totalBonusDays, targets.standard.days)}>
					Standard ({targets.standard.days}){' '}
					{getTargetStatus(totalBonusDays, targets.standard.days)}
				</Text>
				<Text> | </Text>
				<Text color={getTargetColor(totalBonusDays, targets.stretch.days)}>
					Stretch ({targets.stretch.days}){' '}
					{getTargetStatus(totalBonusDays, targets.stretch.days)}
				</Text>
			</Box>
		</>
	);
}

export function StatisticsGrid({statistics, bonusConfig}: StatisticsGridProps) {
	const monthData = statistics.monthlyStats;
	const showBonus = bonusConfig?.enabled && statistics.totalHours !== undefined;

	// New layout: Month + Work Days + Billable + Non-Bill + Vacation + % + Target
	const baseWidth = 2 + 12; // Margin + Month
	const bonusWidth = showBonus ? 12 + 12 + 14 + 10 + 10 + 8 : 0; // Work Days + Billable + Non-Bill + Vacation + % + Target
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
				<Box width={12}>
					<Text bold color="white">
						Month
					</Text>
				</Box>
				{showBonus && (
					<>
						<Box width={12} justifyContent="flex-end">
							<Text bold color="white">
								Work Days
							</Text>
						</Box>
						<Box width={12} justifyContent="flex-end">
							<Text bold color="white">
								Billable
							</Text>
						</Box>
						<Box width={14} justifyContent="flex-end">
							<Text bold color="white">
								Non-Bill
							</Text>
						</Box>
						<Box width={10} justifyContent="flex-end">
							<Text bold color="white">
								Vacation
							</Text>
						</Box>
						<Box width={10} justifyContent="flex-end">
							<Text bold color="white">
								%
							</Text>
						</Box>
						<Box width={8} justifyContent="flex-end">
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
			{monthData.map(month => (
				<MonthRow
					key={month.month}
					month={month}
					showBonus={showBonus}
					bonusConfig={bonusConfig}
				/>
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
				<Box width={12}>
					<Text bold color="yellow">
						YTD Total
					</Text>
				</Box>
				{showBonus && (
					<>
						<Box width={12} justifyContent="flex-end">
							<Text bold color="yellow">
								{monthData.reduce(
									(sum, month) => sum + (month.businessDays ?? 0),
									0,
								)}
							</Text>
						</Box>
						<Box width={12} justifyContent="flex-end">
							<Text bold color="green">
								{bonusConfig?.hoursPerBonusDay
									? (
											monthData.reduce(
												(sum, month) => sum + (month.billableHours ?? 0),
												0,
											) / bonusConfig.hoursPerBonusDay
									  ).toFixed(1)
									: '-'}
							</Text>
						</Box>
						<Box width={14} justifyContent="flex-end">
							<Text bold color="red">
								{bonusConfig?.hoursPerBonusDay
									? (
											monthData.reduce(
												(sum, month) => sum + (month.nonBillableHours ?? 0),
												0,
											) / bonusConfig.hoursPerBonusDay
									  ).toFixed(1)
									: '-'}
							</Text>
						</Box>
						<Box width={10} justifyContent="flex-end">
							<Text bold color="magenta">
								{statistics.totalVacationDays ?? '-'}
							</Text>
						</Box>
						<Box width={10} justifyContent="flex-end">
							<Text bold color="yellow">
								{statistics.yearToDateEfficiency?.toFixed(1) ?? '-'}%
							</Text>
						</Box>
						<Box width={8} justifyContent="flex-end">
							<Text bold color="yellow">
								{' '}
							</Text>
						</Box>
					</>
				)}
				<Box width={8} justifyContent="flex-end">
					<Text> </Text>
				</Box>
			</Box>

			{/* Target Summary Row */}
			{showBonus && bonusConfig?.targets && (
				<TargetSummary
					totalBonusDays={statistics.totalBonusDays}
					targets={bonusConfig.targets}
				/>
			)}
		</Box>
	);
}
