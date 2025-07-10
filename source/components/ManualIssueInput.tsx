import React from 'react';
import {Text, Box} from 'ink';
import {Alert, TextInput} from '@inkjs/ui';

type ManualIssueInputProps = {
	value: string;
	error?: string;
	onChange: (value: string) => void;
	onSubmit: (value: string) => void;
};

export default function ManualIssueInput({
	value,
	error,
	onChange,
	onSubmit,
}: ManualIssueInputProps) {
	return (
		<Box flexDirection="column" height={40}>
			<Text color="cyan">Enter issue key or URL:</Text>
			<Text color="gray">
				Examples: JTS-1234 or https://jira.example.com/browse/JTS-1234
			</Text>
			<Text> </Text>
			<TextInput
				defaultValue={value}
				onChange={onChange}
				onSubmit={onSubmit}
				placeholder="JTS-1234 or https://jira.example.com/browse/JTS-1234"
			/>
			<Text> </Text>
			{error ? <Alert variant="error">{error}</Alert> : <Text> </Text>}
			<Text color="gray">Press ESC to go back to issue selection mode</Text>
		</Box>
	);
}
