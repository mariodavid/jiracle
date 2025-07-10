import React from 'react';
import {Text, Box} from 'ink';
import {Select} from '@inkjs/ui';
import {issueSelectionModeItems} from '../constants/index.js';

type IssueSelectionModeProps = {
	onSelect: (value: string) => void;
};

export default function IssueSelectionMode({
	onSelect,
}: IssueSelectionModeProps) {
	return (
		<Box flexDirection="column" height={40}>
			<Text color="cyan">How would you like to select an issue?</Text>
			<Text> </Text>
			<Select options={issueSelectionModeItems} onChange={onSelect} />
			<Text> </Text>
			<Text color="redBright" wrap="wrap">
				{' '}
			</Text>
			<Text color="gray">Press ESC to go back to main menu</Text>
		</Box>
	);
}
