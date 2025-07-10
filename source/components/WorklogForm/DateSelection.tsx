import React from 'react';
import {Text, Box} from 'ink';
import {Select} from '@inkjs/ui';
import {getDateItems} from '../../constants/index.js';
import type {JiraIssue} from '../../jira-client.js';

type DateSelectionProps = {
	selectedIssue: JiraIssue;
	selectedTime: string;
	comment: string;
	onSelect: (value: string) => void;
};

export default function DateSelection({
	selectedIssue,
	selectedTime,
	comment,
	onSelect,
}: DateSelectionProps) {
	const dateItems = getDateItems();

	return (
		<Box flexDirection="column" height={40}>
			<Text color="green">
				Selected: {selectedIssue.key} - {selectedIssue.fields.summary}
			</Text>
			<Text color="gray">Time: {selectedTime}</Text>
			<Text color="gray">Comment: {comment || 'Worked on this issue'}</Text>
			<Text> </Text>
			<Text color="cyan">Select date:</Text>
			<Text> </Text>
			<Select options={dateItems} onChange={onSelect} />
			<Text> </Text>
			<Text color="redBright" wrap="wrap">
				{' '}
			</Text>
			<Text color="gray">Press ESC to go back to comment input</Text>
		</Box>
	);
}
