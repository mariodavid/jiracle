import React, {useState, useEffect, useMemo} from 'react';
import {Box, Text, useInput} from 'ink';
import {Alert} from '@inkjs/ui';
import {JiraClient, type JiraConfig} from '../jira-client.js';
import {AttendanceManager} from '../attendance/AttendanceManager.js';
import {
	StatisticsUseCase,
	type YearlyStatistics,
} from '../use-cases/StatisticsUseCase.js';
import {
	BonusCalculator,
	type BonusProgress,
	type TierVisualization,
} from '../bonus/BonusCalculator.js';
import {NotificationBar} from './NotificationBar.js';

export type BonusOverviewViewProps = {
	onBack: () => void;
	config: JiraConfig;
	year?: number;
};

export function BonusOverviewView({
	onBack,
	config,
	year,
}: BonusOverviewViewProps) {
	const [statistics, setStatistics] = useState<YearlyStatistics | undefined>(
		undefined,
	);
	const [bonusProgress, setBonusProgress] = useState<BonusProgress | undefined>(
		undefined,
	);
	const [tierVisualizations, setTierVisualizations] = useState<
		TierVisualization[]
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | undefined>(undefined);

	// Create service instances (memoized)
	const jiraClient = useMemo(() => new JiraClient(config), [config]);

	const attendanceManager = useMemo(() => {
		if (!config.attendance?.enabled) {
			return undefined;
		}

		return new AttendanceManager(config.attendance);
	}, [config.attendance]);

	const statisticsUseCase = useMemo(() => {
		if (!attendanceManager) {
			return undefined;
		}

		return new StatisticsUseCase(jiraClient, attendanceManager, config.bonus);
	}, [jiraClient, attendanceManager, config.bonus]);

	const bonusCalculator = useMemo(() => {
		if (!config.bonus?.enabled) {
			return undefined;
		}

		return new BonusCalculator(config.bonus);
	}, [config.bonus]);

	// Load statistics and bonus data
	useEffect(() => {
		async function loadBonusData() {
			if (!statisticsUseCase || !bonusCalculator) {
				setError(
					'Bonus tracking or attendance tracking is not enabled in configuration',
				);
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);
				setError(undefined);
				const stats = await statisticsUseCase.execute(year);
				setStatistics(stats);

				const totalHours = stats.totalHours ?? 0;
				const progress = bonusCalculator.calculateBonusProgress(totalHours);
				setBonusProgress(progress);

				const visualizations = bonusCalculator.getTierVisualizations(
					progress.currentBonusDays,
				);
				setTierVisualizations(visualizations);
			} catch (error_: unknown) {
				const message =
					error_ instanceof Error ? error_.message : String(error_);
				setError(message);
			} finally {
				setIsLoading(false);
			}
		}

		void loadBonusData();
	}, [statisticsUseCase, bonusCalculator, year]);

	// Handle keyboard input
	useInput((input, key) => {
		if (key.escape || input === 'q') {
			onBack();
		}
	});

	// Render loading state
	if (isLoading) {
		return (
			<Box alignItems="center" height={10} justifyContent="center">
				<Text>Loading bonus overview...</Text>
			</Box>
		);
	}

	// Render error state
	if (error) {
		return (
			<Box flexDirection="column">
				<Box marginY={1}>
					<Alert variant="error">Error: {error}</Alert>
				</Box>
			</Box>
		);
	}

	// Render bonus overview
	if (!statistics || !bonusProgress) {
		return (
			<Box marginY={1}>
				<Text>No bonus data available</Text>
			</Box>
		);
	}

	const targetYear = year ?? new Date().getFullYear();

	return (
		<Box flexDirection="column">
			{/* Header */}
			<Box marginBottom={1}>
				<Text bold color="cyan">
					Bonus Progress {targetYear}
				</Text>
			</Box>

			{/* Current Status */}
			<Box flexDirection="column" marginBottom={1}>
				<Text>
					Current Status: <Text bold>{bonusProgress.currentBonusDays}</Text>{' '}
					Bonus Days
				</Text>
				<Text>
					├─ Target Progress:{' '}
					<Text bold>
						{bonusProgress.currentBonusDays} / {config.bonus!.targetDays} (
						{Math.round(
							(bonusProgress.currentBonusDays / config.bonus!.targetDays) * 100,
						)}
						%)
					</Text>
				</Text>
				<Text>
					├─ Current Tier:{' '}
					<Text bold color="yellow">
						{bonusProgress.currentTier.name}
					</Text>{' '}
					({(bonusProgress.currentTier.rate * 100).toFixed(1)}% per day)
				</Text>
				<Text>
					├─ Earned Bonus:{' '}
					<Text bold color="green">
						{bonusProgress.earnedBonusPercentage.toFixed(2)}%
					</Text>
				</Text>
				<Text>
					└─ Projected Year-End:{' '}
					<Text bold>
						{bonusProgress.projectedYearEnd} days (
						{Math.round(
							(bonusProgress.projectedYearEnd / config.bonus!.targetDays) * 100,
						)}
						%)
					</Text>
				</Text>
			</Box>

			{/* Tier Progress */}
			<Box flexDirection="column" marginBottom={1}>
				<Text bold>Tier Progress:</Text>
				<Box flexDirection="column" marginLeft={2}>
					{tierVisualizations.map(viz => (
						<Box key={viz.tier.name} marginBottom={0}>
							<Text>
								{viz.tier.name}{' '}
								{renderProgressBar(viz.percentage, viz.isCurrent)}{' '}
								{viz.isCompleted ? (
									<Text color="green">✓ Complete</Text>
								) : (
									<Text>
										{viz.progress.toFixed(1)}/
										{viz.total === Number.POSITIVE_INFINITY
											? `${viz.tier.startDay}+`
											: viz.total}{' '}
										({viz.percentage.toFixed(0)}%)
									</Text>
								)}
							</Text>
						</Box>
					))}
				</Box>
			</Box>

			{/* Next Milestone */}
			{bonusProgress.nextMilestone && (
				<Box flexDirection="column" marginBottom={1}>
					<Text bold>Next Milestone:</Text>
					<Box marginLeft={2}>
						<Text>
							• {bonusProgress.nextMilestone.targetDays} days -{' '}
							{bonusProgress.nextMilestone.name} (
							<Text color="yellow">
								{bonusProgress.nextMilestone.daysRemaining} days to go
							</Text>
							)
						</Text>
					</Box>
				</Box>
			)}

			{/* Key Milestones Summary */}
			<Box flexDirection="column" marginBottom={1}>
				<Text bold>Key Milestones:</Text>
				<Box marginLeft={2}>
					<Text>
						{bonusProgress.currentBonusDays >= 120 ? '✓' : '•'} 120 days - Tier
						2 starts
						{bonusProgress.currentBonusDays < 120 &&
							` (${
								Math.round((120 - bonusProgress.currentBonusDays) * 10) / 10
							} days to go)`}
					</Text>
					<Text>
						{bonusProgress.currentBonusDays >= 160 ? '✓' : '•'} 160 days - Tier
						3 starts
						{bonusProgress.currentBonusDays < 160 &&
							` (${
								Math.round((160 - bonusProgress.currentBonusDays) * 10) / 10
							} days to go)`}
					</Text>
					<Text>
						{bonusProgress.currentBonusDays >= config.bonus!.targetDays
							? '✓'
							: '•'}{' '}
						{config.bonus!.targetDays} days - 100% Target
						{bonusProgress.currentBonusDays < config.bonus!.targetDays &&
							` (${
								Math.round(
									(config.bonus!.targetDays - bonusProgress.currentBonusDays) *
										10,
								) / 10
							} days to go)`}
					</Text>
				</Box>
			</Box>

			<Box marginTop={1}>
				<NotificationBar notifications={[]} />
			</Box>
		</Box>
	);
}

function renderProgressBar(
	percentage: number,
	isCurrent: boolean,
	width = 20,
): string {
	const filled = Math.round((percentage / 100) * width);
	const empty = width - filled;

	const filledChar = isCurrent ? '█' : '▓';
	const emptyChar = '░';

	return `[${filledChar.repeat(filled)}${emptyChar.repeat(empty)}]`;
}
