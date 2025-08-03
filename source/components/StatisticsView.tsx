import React, {useState, useEffect, useMemo} from 'react';
import {Box, Text, useInput} from 'ink';
import {Alert} from '@inkjs/ui';
import {JiraClient, type JiraConfig} from '../jira-client.js';
import {AttendanceManager} from '../attendance/AttendanceManager.js';
import {
	StatisticsUseCase,
	type YearlyStatistics,
} from '../use-cases/StatisticsUseCase.js';
import {NotificationBar} from './NotificationBar.js';
import {StatisticsGrid} from './StatisticsGrid.js';

export type StatisticsViewProps = {
	onBack: () => void;
	config: JiraConfig;
};

export function StatisticsView({onBack, config}: StatisticsViewProps) {
	const [statistics, setStatistics] = useState<YearlyStatistics | undefined>(
		undefined,
	);
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
			} catch (error_: unknown) {
				const message =
					error_ instanceof Error ? error_.message : String(error_);
				setError(message);
			} finally {
				setIsLoading(false);
			}
		}

		void loadStatistics();
	}, [statisticsUseCase]);

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

	return (
		<Box flexDirection="column">
			<StatisticsGrid statistics={statistics} bonusConfig={config.bonus} />

			<Box marginTop={1}>
				<NotificationBar notifications={[]} />
			</Box>
		</Box>
	);
}
