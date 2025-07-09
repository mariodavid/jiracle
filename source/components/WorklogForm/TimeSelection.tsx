import React from 'react';
import {Text, Box} from 'ink';
import {Select} from '@inkjs/ui';
import {timeItems} from '../../constants/index.js';
import type {JiraIssue} from '../../jira-client.js';

type TimeSelectionProps = {
	selectedIssue: JiraIssue;
	onSelect: (value: string) => void;
};

export default function TimeSelection({
	selectedIssue,
	onSelect,
}: TimeSelectionProps) {
	return (
		<Box flexDirection="column">
			<Text color="green">
				Selected: {selectedIssue.key} - {selectedIssue.fields.summary}
			</Text>
			<Text> </Text>
			<Text color="cyan">Select time to log:</Text>
			<Text> </Text>
			<Select options={timeItems} onChange={onSelect} visibleOptionCount={10} />
			<Text> </Text>
			<Text color="redBright" wrap="wrap">
				{' '}
			</Text>
			<Text color="gray">Press ESC to go back to issue selection</Text>
		</Box>
	);
}
