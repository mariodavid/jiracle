import React from 'react';
import {Text, Box} from 'ink';
import {TextInput} from '@inkjs/ui';
import type {JiraIssue} from '../../jira-client.js';

type CustomTimeInputProps = {
	selectedIssue: JiraIssue;
	value: string;
	onChange: (value: string) => void;
	onSubmit: (value: string) => void;
};

export default function CustomTimeInput({
	selectedIssue,
	value,
	onChange,
	onSubmit,
}: CustomTimeInputProps) {
	return (
		<Box flexDirection="column" height={40}>
			<Text color="green">
				Selected: {selectedIssue.key} - {selectedIssue.fields.summary}
			</Text>
			<Text> </Text>
			<Text color="cyan">Enter custom time (e.g., 1h, 30m, 2h30m, 2,5h):</Text>
			<Text> </Text>
			<TextInput
				defaultValue={value}
				onChange={onChange}
				onSubmit={onSubmit}
				placeholder="1h"
			/>
			<Text> </Text>
			<Text color="redBright" wrap="wrap">
				{' '}
			</Text>
			<Text color="gray">Press ESC to go back to time selection</Text>
		</Box>
	);
}
