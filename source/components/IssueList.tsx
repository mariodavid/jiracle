import React from 'react';
import {Text, Box} from 'ink';
import {Select} from '@inkjs/ui';
import type {JiraIssue} from '../jira-client.js';

type IssueListProps = {
	issues: JiraIssue[];
	title: string;
	onSelect: (key: string) => void;
};

export default function IssueList({issues, title, onSelect}: IssueListProps) {
	const issueItems = issues.map(issue => ({
		label: `${issue.key} - ${issue.fields.summary}`,
		value: issue.key,
	}));

	return (
		<Box flexDirection="column" height={40}>
			<Text color="cyan">{title}</Text>
			<Text> </Text>
			<Select options={issueItems} onChange={onSelect} />
			<Text> </Text>
			<Text color="redBright" wrap="wrap">
				{' '}
			</Text>
			<Text color="gray">Press ESC to go back to issue selection mode</Text>
		</Box>
	);
}
