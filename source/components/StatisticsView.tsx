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
import {Duration} from '../domain/Duration.js';
import {NotificationBar} from './NotificationBar.js';
import {StatisticsGrid} from './StatisticsGrid.js';

export type StatisticsViewProps = {
	onBack: () => void;
	config: JiraConfig;
	onBonusTabChange?: (showBonusTab: boolean) => void;
};

type StatisticsTab = 'monthly' | 'bonus';

export function StatisticsView({
	onBack,
	config,
	onBonusTabChange,
}: StatisticsViewProps) {
	const [statistics, setStatistics] = useState<YearlyStatistics | undefined>(
		undefined,
	);
	const [bonusProgress, setBonusProgress] = useState<BonusProgress | undefined>(
		undefined,
	);
	const [tierVisualizations, setTierVisualizations] = useState<
		TierVisualization[]
	>([]);
	const [activeTab, setActiveTab] = useState<StatisticsTab>('monthly');
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

	// Load statistics data
	useEffect(() => {
		async function loadStatistics() {
			if (!statisticsUseCase) {
				setError('Attendance tracking is not enabled in configuration');
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);
				setError(undefined);
				const stats = await statisticsUseCase.execute();
				setStatistics(stats);

				// Load bonus data if calculator is available
				if (bonusCalculator && stats.totalHours) {
					const totalHoursDuration = Duration.fromHours(stats.totalHours);
					const progress =
						bonusCalculator.calculateBonusProgress(totalHoursDuration);
					setBonusProgress(progress);

					const visualizations = bonusCalculator.getTierVisualizations(
						progress.currentBonusDays,
					);
					setTierVisualizations(visualizations);
				}
			} catch (error_: unknown) {
				const message =
					error_ instanceof Error ? error_.message : String(error_);
				setError(message);
			} finally {
				setIsLoading(false);
			}
		}

		void loadStatistics();
	}, [statisticsUseCase, bonusCalculator]);

	// Notify parent about bonus tab availability
	useEffect(() => {
		const showBonusTab = Boolean(bonusCalculator && bonusProgress);
		onBonusTabChange?.(showBonusTab);
	}, [bonusCalculator, bonusProgress, onBonusTabChange]);

	// Handle keyboard input
	useInput((input, key) => {
		if (key.escape || input === 'q') {
			onBack();
		} else if (key.tab || key.leftArrow || key.rightArrow) {
			// Switch between tabs
			setActiveTab(currentTab =>
				currentTab === 'monthly' ? 'bonus' : 'monthly',
			);
		} else if (input === '1') {
			setActiveTab('monthly');
		} else if (input === '2' && bonusCalculator) {
			setActiveTab('bonus');
		}
	});

	// Render loading state
	if (isLoading) {
		return (
			<Box alignItems="center" height={10} justifyContent="center">
				<Text>Loading statistics...</Text>
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

	// Render statistics table
	if (!statistics) {
		return (
			<Box marginY={1}>
				<Text>No statistics available</Text>
			</Box>
		);
	}

	const showBonusTab = Boolean(bonusCalculator && bonusProgress);

	return (
		<Box flexDirection="column">
			{/* Tab Navigation */}
			<Box marginBottom={1} justifyContent="center">
				<Box marginRight={2}>
					<Text
						color={activeTab === 'monthly' ? 'cyan' : 'gray'}
						bold={activeTab === 'monthly'}
					>
						{activeTab === 'monthly'
							? '[ 1. Monthly Stats ]'
							: '  1. Monthly Stats  '}
					</Text>
				</Box>
				{showBonusTab && (
					<Box>
						<Text
							color={activeTab === 'bonus' ? 'cyan' : 'gray'}
							bold={activeTab === 'bonus'}
						>
							{activeTab === 'bonus'
								? '[ 2. Bonus Overview ]'
								: '  2. Bonus Overview  '}
						</Text>
					</Box>
				)}
			</Box>

			{/* Tab Content */}
			{activeTab === 'monthly' ? (
				<StatisticsGrid statistics={statistics} bonusConfig={config.bonus} />
			) : (
				showBonusTab && renderBonusOverview()
			)}

			<Box marginTop={1}>
				<NotificationBar notifications={[]} />
			</Box>
		</Box>
	);

	function renderBonusOverview() {
		if (!bonusProgress || !config.bonus) {
			return null;
		}

		const targetYear = new Date().getFullYear();

		return (
			<Box flexDirection="column" justifyContent="center" alignItems="center">
				{/* Centered Content Container */}
				<Box flexDirection="column">
					{/* Current Status */}
					<Box flexDirection="column" marginBottom={1}>
						<Box justifyContent="center" marginBottom={1}>
							<Text bold color="cyan">
								Bonus Progress {targetYear}
							</Text>
						</Box>
						<Box justifyContent="center" marginBottom={1}>
							<Text>═══════════════════════════════════════════════════</Text>
						</Box>
					</Box>

					<Box flexDirection="column" marginBottom={1}>
						<Text>
							Current Status:{' '}
							<Text bold>{bonusProgress.currentBonusDays.toNumber()}</Text>{' '}
							Bonus Days
						</Text>
						<Text>
							├─ Target Progress:{' '}
							<Text bold>
								{bonusProgress.currentBonusDays.toNumber()} /{' '}
								{config.bonus.targetDays} (
								{Math.round(
									(bonusProgress.currentBonusDays.toNumber() /
										config.bonus.targetDays) *
										100,
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
									(bonusProgress.projectedYearEnd / config.bonus.targetDays) *
										100,
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
						<Box flexDirection="column" marginLeft={2}>
							{config.bonus.tiers?.map((tier, index) => {
								if (!tier.endDay || index === 0) return null; // Skip first tier and open-ended tiers
								const isCompleted =
									bonusProgress.currentBonusDays.toNumber() >= tier.endDay;
								const nextTierName =
									config.bonus?.tiers?.[index + 1]?.name ?? 'Final Tier';
								return (
									<Text key={tier.name}>
										{isCompleted ? '✓' : '•'} {tier.endDay} days -{' '}
										{nextTierName} starts
										{!isCompleted &&
											` (${
												Math.round(
													(tier.endDay -
														bonusProgress.currentBonusDays.toNumber()) *
														10,
												) / 10
											} days to go)`}
									</Text>
								);
							})}
							<Text>
								{bonusProgress.currentBonusDays.toNumber() >=
								config.bonus.targetDays
									? '✓'
									: '•'}{' '}
								{config.bonus.targetDays} days - 100% Target
								{bonusProgress.currentBonusDays.toNumber() <
									config.bonus.targetDays &&
									` (${
										Math.round(
											(config.bonus.targetDays -
												bonusProgress.currentBonusDays.toNumber()) *
												10,
										) / 10
									} days to go)`}
							</Text>
						</Box>
					</Box>
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
}
