import React from 'react';
import {Box, Text} from 'ink';
import {WeeklyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';

export interface TimetableGridProps {
	data: WeeklyWorklogSummary | null;
	isLoading: boolean;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TimetableGrid({data, isLoading}: TimetableGridProps) {
	if (isLoading) {
		return (
			<Box justifyContent="center" paddingY={2}>
				<Text>Loading worklogs...</Text>
			</Box>
		);
	}

	if (!data) {
		return (
			<Box justifyContent="center" paddingY={2}>
				<Text color="gray">No data available</Text>
			</Box>
		);
	}

	if (data.dailySummaries.length === 0) {
		return (
			<Box justifyContent="center" paddingY={2}>
				<Text color="gray">No worklogs found for this week</Text>
			</Box>
		);
	}

	// Transform data into a grid structure
	const weekStart = new Date(data.weekStart);
	const weekDates = generateWeekDates(weekStart);
	const issueMap = buildIssueMap(data);
	const dailyTotals = calculateDailyTotals(data, weekDates);

	const tableWidth = 20 + 7 * 8 + 8; // Issue + 7 days + Total = 84

	return (
		<Box flexDirection="column" paddingX={1} alignItems="center">
			{/* Header */}
			<Box flexDirection="row">
				<Box width={20}>
					<Text bold color="white">
						Issue
					</Text>
				</Box>
				{DAYS.map(day => (
					<Box key={day} width={8} justifyContent="flex-end">
						<Text bold color="white">
							{day}
						</Text>
					</Box>
				))}
				<Box width={8} justifyContent="flex-end">
					<Text bold color="white">
						Total
					</Text>
				</Box>
			</Box>

			{/* Separator */}
			<Box width={tableWidth}>
				<Text color="gray">{'─'.repeat(tableWidth)}</Text>
			</Box>

			{/* Issue rows */}
			{Object.entries(issueMap).map(([issueKey, issueData]) => (
				<Box key={issueKey} flexDirection="column">
					<Box flexDirection="row">
						<Box width={20}>
							<Text bold color="cyan">
								{issueKey}
							</Text>
						</Box>
						{weekDates.map((date, index) => (
							<Box key={index} width={8} justifyContent="flex-end">
								<Text>
									{formatHours(issueData.dailyHours[formatDateKey(date)] || 0)}
								</Text>
							</Box>
						))}
						<Box width={8} justifyContent="flex-end">
							<Text bold>{formatHours(issueData.weekTotal)}</Text>
						</Box>
					</Box>
					<Box paddingLeft={1}>
						<Text color="gray" dimColor>
							{truncateText(issueData.summary, 50)}
						</Text>
					</Box>
				</Box>
			))}

			{/* Separator */}
			<Box width={tableWidth}>
				<Text color="gray">{'─'.repeat(tableWidth)}</Text>
			</Box>

			{/* Daily totals */}
			<Box flexDirection="row">
				<Box width={20}>
					<Text bold color="yellow">
						Daily Total
					</Text>
				</Box>
				{dailyTotals.map((total, index) => (
					<Box key={index} width={8} justifyContent="flex-end">
						<Text bold color="yellow">
							{formatHours(total)}
						</Text>
					</Box>
				))}
				<Box width={8} justifyContent="flex-end">
					<Text bold color="green">
						{formatHours(data.weekTotal)}
					</Text>
				</Box>
			</Box>
		</Box>
	);
}

function generateWeekDates(weekStart: Date): Date[] {
	const dates: Date[] = [];
	for (let i = 0; i < 7; i++) {
		const date = new Date(weekStart);
		date.setDate(weekStart.getDate() + i);
		dates.push(date);
	}
	return dates;
}

interface IssueData {
	summary: string;
	dailyHours: Record<string, number>;
	weekTotal: number;
}

function buildIssueMap(data: WeeklyWorklogSummary): Record<string, IssueData> {
	const issueMap: Record<string, IssueData> = {};

	data.dailySummaries.forEach(dailySummary => {
		const dateKey = formatDateKey(dailySummary.date);

		dailySummary.issues.forEach(issue => {
			if (!issueMap[issue.issueKey]) {
				issueMap[issue.issueKey] = {
					summary: issue.issueSummary,
					dailyHours: {},
					weekTotal: 0,
				};
			}

			issueMap[issue.issueKey]!.dailyHours[dateKey] =
				(issueMap[issue.issueKey]!.dailyHours[dateKey] || 0) + issue.hours;
			issueMap[issue.issueKey]!.weekTotal += issue.hours;
		});
	});

	return issueMap;
}

function calculateDailyTotals(
	data: WeeklyWorklogSummary,
	weekDates: Date[],
): number[] {
	const totals: number[] = new Array(7).fill(0);

	data.dailySummaries.forEach(dailySummary => {
		const dateKey = formatDateKey(dailySummary.date);
		const dayIndex = weekDates.findIndex(
			date => formatDateKey(date) === dateKey,
		);

		if (dayIndex >= 0) {
			totals[dayIndex] = dailySummary.totalHours;
		}
	});

	return totals;
}

function formatDateKey(date: Date): string {
	return date.toISOString().split('T')[0]!;
}

function formatHours(hours: number): string {
	if (hours === 0) {
		return '-';
	}

	return hours.toFixed(1);
}

function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}

	return text.substring(0, maxLength - 3) + '...';
}
