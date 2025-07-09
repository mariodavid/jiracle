import React from 'react';
import {Text, Box} from 'ink';
import {TextInput} from '@inkjs/ui';
import type {JiraIssue} from '../../jira-client.js';

type CommentInputProps = {
	selectedIssue: JiraIssue;
	selectedTime: string;
	value: string;
	onChange: (value: string) => void;
	onSubmit: (value: string) => void;
};

export default function CommentInput({
	selectedIssue,
	selectedTime,
	value,
	onChange,
	onSubmit,
}: CommentInputProps) {
	return (
		<Box flexDirection="column">
			<Text color="green">
				Selected: {selectedIssue.key} - {selectedIssue.fields.summary}
			</Text>
			<Text color="gray">Time: {selectedTime}</Text>
			<Text> </Text>
			<Text color="cyan">
				Enter comment (optional, press Enter to continue):
			</Text>
			<Text> </Text>
			<TextInput
				defaultValue={value}
				onChange={onChange}
				onSubmit={onSubmit}
				placeholder="Worked on this issue"
			/>
			<Text> </Text>
			<Text color="redBright" wrap="wrap">
				{' '}
			</Text>
			<Text color="gray">Press ESC to go back to time selection</Text>
		</Box>
	);
}
