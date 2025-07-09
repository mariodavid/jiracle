import React from 'react';
import {Text, Box} from 'ink';
import {Alert} from '@inkjs/ui';
import type {JiraIssue} from '../jira-client.js';

type WorklogSummaryProps = {
	variant: 'success' | 'submitting';
	selectedIssue?: JiraIssue | null;
	selectedTime?: string;
	comment?: string;
	selectedDate?: string;
};

export default function WorklogSummary({
	variant,
	selectedIssue,
	selectedTime,
	comment,
	selectedDate,
}: WorklogSummaryProps) {
	if (variant === 'submitting') {
		return <Text>Submitting worklog...</Text>;
	}

	if (variant === 'success' && selectedIssue) {
		return (
			<Box flexDirection="column">
				<Alert variant="success">✓ Worklog successfully added!</Alert>
				<Text> </Text>
				<Text>Issue: {selectedIssue.key}</Text>
				<Text>Time: {selectedTime}</Text>
				<Text>Comment: {comment || 'Worked on this issue'}</Text>
				<Text>Date: {selectedDate?.split('T')[0]}</Text>
				<Text> </Text>
				<Text color="gray">Returning to main menu...</Text>
			</Box>
		);
	}

	return null;
}
