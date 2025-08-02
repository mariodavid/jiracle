import React, {useState, useEffect, useMemo} from 'react';
import {Box, Text, useInput} from 'ink';
import {Alert} from '@inkjs/ui';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import {JiraClient, type JiraConfig} from '../jira-client.js';
import {AttendanceManager} from '../attendance/AttendanceManager.js';
import {
	StatisticsUseCase,
	type YearlyStatistics,
} from '../use-cases/StatisticsUseCase.js';
import {NotificationBar} from './NotificationBar.js';
import {TitleBar} from './TitleBar.js';

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

		return new StatisticsUseCase(jiraClient, attendanceManager);
	}, [jiraClient, attendanceManager]);

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
			<Box flexDirection="column">
				<TitleBar title="Statistics" />
				<Box alignItems="center" height={10} justifyContent="center">
					<Text>Loading statistics...</Text>
				</Box>
			</Box>
		);
	}

	// Render error state
	if (error) {
		return (
			<Box flexDirection="column">
				<TitleBar title="Statistics" />
				<Box marginY={1}>
					<Alert variant="error">Error: {error}</Alert>
				</Box>
				<Box marginTop={1}>
					<Text dimColor>
						Press ESC or &apos;q&apos; to return to main view
					</Text>
				</Box>
			</Box>
		);
	}

	// Render statistics table
	if (!statistics) {
		return (
			<Box flexDirection="column">
				<TitleBar title="Statistics" />
				<Box marginY={1}>
					<Text>No statistics available</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<TitleBar title={`Statistics ${statistics.year}`} />

			<Box marginY={1}>
				<Gradient name="rainbow">
					<BigText text="STATISTICS" />
				</Gradient>
			</Box>

			<Box flexDirection="column" marginY={1}>
				{/* Table Header */}
				<Box>
					<Text bold>
						{'Month'.padEnd(12)}
						{' | '}
						{'Worklog Days'.padStart(12)}
						{' | '}
						{'Attendance Days'.padStart(15)}
					</Text>
				</Box>
				<Box>
					<Text dimColor>-------------|--------------|----------------</Text>
				</Box>

				{/* Monthly Rows */}
				{statistics.monthlyStats.map(month => (
					<Box key={month.month}>
						<Text>
							{month.month.padEnd(12)}
							{' |'}
							{month.worklogDays.toString().padStart(12)}
							{' |'}
							{month.attendanceDays.toString().padStart(15)}
						</Text>
					</Box>
				))}

				{/* Separator */}
				<Box>
					<Text dimColor>-------------|--------------|----------------</Text>
				</Box>

				{/* Total Row */}
				<Box>
					<Text bold>
						{'Total'.padEnd(12)}
						{' |'}
						{statistics.totalWorklogDays.toString().padStart(12)}
						{' |'}
						{statistics.totalAttendanceDays.toString().padStart(15)}
					</Text>
				</Box>
			</Box>

			<Box marginTop={1}>
				<NotificationBar notifications={[]} />
			</Box>

			<Box marginTop={1}>
				<Text dimColor>Press ESC or &apos;q&apos; to return to main view</Text>
			</Box>
		</Box>
	);
}
