import React from 'react';
import {Box, Text} from 'ink';
import {ConfirmInput} from '@inkjs/ui';
import type {AlignmentResult} from '../services/RemainingTimeAlignment.js';

interface AlignTimeConfirmationProps {
	dayLabel: string;
	attendanceHours: number;
	currentLoggedHours: number;
	remainingHours: number;
	strategy: 'even' | 'proportional';
	previewResult: AlignmentResult;
	onConfirm: (confirmed: boolean) => void;
}

export function AlignTimeConfirmation({
	dayLabel,
	attendanceHours,
	currentLoggedHours,
	remainingHours,
	strategy,
	previewResult,
	onConfirm,
}: AlignTimeConfirmationProps) {
	const strategyName = strategy === 'even' ? 'evenly' : 'proportionally';
	const sign = remainingHours >= 0 ? '+' : '';

	// Format hours without unnecessary decimals
	const formatHours = (hours: number) => {
		const rounded = Math.round(hours * 100) / 100; // Round to 2 decimals
		return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
	};

	return (
		<Box flexDirection="column">
			<Text bold>Align Remaining Time - {dayLabel}</Text>
			<Text> </Text>
			<Text>
				Attendance: {formatHours(attendanceHours)}h, Logged: {formatHours(currentLoggedHours)}h,
				Remaining:{' '}
				<Text color={remainingHours >= 0 ? 'green' : 'red'}>
					{sign}
					{formatHours(remainingHours)}h
				</Text>
			</Text>
			<Text> </Text>
			<Text>
				Will distribute {sign}
				{formatHours(remainingHours)}h {strategyName} across{' '}
				{previewResult.updatedIssues.length} existing worklogs:
			</Text>
			<Text> </Text>
			{previewResult.updatedIssues.map(issue => (
				<Text key={issue.issueKey}>
					{issue.issueKey}: {formatHours(issue.oldHours)}h → {formatHours(issue.newHours)}h (
					<Text color={issue.diff >= 0 ? 'green' : 'red'}>
						{issue.diff >= 0 ? '+' : ''}
						{formatHours(issue.diff)}h
					</Text>
					)
				</Text>
			))}
			<Text> </Text>
			<ConfirmInput
				submitOnEnter={false}
				onConfirm={() => onConfirm(true)}
				onCancel={() => onConfirm(false)}
			/>
		</Box>
	);
}
