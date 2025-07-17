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
		<Box flexDirection="column" height={50}>
			<Text key="title" color="cyan">
				{title}
			</Text>
			<Text key="spacer-1"> </Text>
			<Select key="select" options={issueItems} onChange={onSelect} />
			<Text key="spacer-2"> </Text>
			<Text key="empty" color="redBright" wrap="wrap">
				{' '}
			</Text>
			<Text key="help" color="gray">
				Press ESC to go back to issue selection mode
			</Text>
		</Box>
	);
}
