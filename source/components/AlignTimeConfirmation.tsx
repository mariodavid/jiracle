import React from 'react';
import {Box, Text} from 'ink';
import {ConfirmInput} from '@inkjs/ui';
import type {
	AlignmentResult,
	CreateWorklogsResult,
} from '../services/RemainingTimeAlignment.js';

interface AlignTimeConfirmationProps {
	dayLabel: string;
	attendanceHours: number;
	currentLoggedHours: number;
	remainingHours: number;
	strategy: 'even' | 'proportional';
	mode: 'update' | 'create';
	previewResult?: AlignmentResult;
	createResult?: CreateWorklogsResult;
	onConfirm: (confirmed: boolean) => void;
}

export function AlignTimeConfirmation({
	dayLabel,
	attendanceHours,
	currentLoggedHours,
	remainingHours,
	strategy,
	mode,
	previewResult,
	createResult,
	onConfirm,
}: AlignTimeConfirmationProps) {
	const strategyName = strategy === 'even' ? 'evenly' : 'proportionally';
	const sign = remainingHours >= 0 ? '+' : '';

	// Format hours without unnecessary decimals
	const formatHours = (hours: number) => {
		const rounded = Math.round(hours * 100) / 100; // Round to 2 decimals
		return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
	};

	if (mode === 'create' && createResult) {
		// Mode: Create new worklogs from default stories
		return (
			<Box flexDirection="column">
				<Text bold>Fill Time with Default Stories - {dayLabel}</Text>
				<Text> </Text>
				<Text>
					Attendance: {formatHours(attendanceHours)}h, Logged:{' '}
					{formatHours(currentLoggedHours)}h
				</Text>
				<Text> </Text>
				<Text>
					Will create {createResult.createdWorklogs.length} new worklogs from
					default stories:
				</Text>
				<Text> </Text>
				{createResult.createdWorklogs.map(worklog => (
					<Text key={worklog.issueKey}>
						{worklog.issueKey}: {formatHours(worklog.hours)}h (
						{worklog.percentage}%)
						{worklog.comment && <Text color="gray"> - {worklog.comment}</Text>}
					</Text>
				))}
				<Text> </Text>
				<Text>Total: {formatHours(createResult.totalDistributed)}h</Text>
				<Text> </Text>
				<ConfirmInput
					submitOnEnter={false}
					onConfirm={() => onConfirm(true)}
					onCancel={() => onConfirm(false)}
				/>
			</Box>
		);
	}

	if (mode === 'update' && previewResult) {
		// Mode: Update existing worklogs
		return (
			<Box flexDirection="column">
				<Text bold>Align Remaining Time - {dayLabel}</Text>
				<Text> </Text>
				<Text>
					Attendance: {formatHours(attendanceHours)}h, Logged:{' '}
					{formatHours(currentLoggedHours)}h, Remaining:{' '}
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
						{issue.issueKey}: {formatHours(issue.oldHours)}h →{' '}
						{formatHours(issue.newHours)}h (
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

	// Fallback for invalid props
	return (
		<Box flexDirection="column">
			<Text bold color="red">
				Invalid alignment configuration
			</Text>
			<ConfirmInput
				submitOnEnter={false}
				onConfirm={() => onConfirm(false)}
				onCancel={() => onConfirm(false)}
			/>
		</Box>
	);
}
