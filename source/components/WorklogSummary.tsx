import React from 'react';
import {Text, Box} from 'ink';
import {Alert} from '@inkjs/ui';
import type {JiraIssue} from '../jira-client.js';

type WorklogSummaryProps = {
	variant: 'success' | 'submitting';
	selectedIssue?: JiraIssue | undefined;
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
				<Alert key="alert" variant="success">
					✓ Worklog successfully added!
				</Alert>
				<Text key="spacer-1"> </Text>
				<Text key="issue">Issue: {selectedIssue.key}</Text>
				<Text key="time">Time: {selectedTime}</Text>
				<Text key="comment">Comment: {comment || 'Worked on this issue'}</Text>
				<Text key="date">Date: {selectedDate?.split('T')[0]}</Text>
				<Text key="spacer-2"> </Text>
				<Text key="return-message" color="gray">
					Returning to main menu...
				</Text>
			</Box>
		);
	}

	return null;
}
