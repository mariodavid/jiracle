import React, {useEffect, useState} from 'react';
import {Text, Box} from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import {JiraClient} from './jira-client.js';
import type {JiraIssue, JiraConfig, WorklogRequest} from './jira-client.js';
import {readFileSync} from 'fs';
import {homedir} from 'os';
import {join} from 'path';

type Props = {
	name: string | undefined;
};

type Step = 'loading' | 'issue-selection' | 'time-selection' | 'comment-input' | 'date-selection' | 'submitting' | 'success' | 'error';

export default function App({name = 'Stranger'}: Props) {
	const [issues, setIssues] = useState<JiraIssue[]>([]);
	const [client, setClient] = useState<JiraClient | null>(null);
	const [step, setStep] = useState<Step>('loading');
	const [error, setError] = useState<string | null>(null);
	
	// Selection state
	const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null);
	const [selectedTime, setSelectedTime] = useState<string>('');
	const [comment, setComment] = useState<string>('');
	const [selectedDate, setSelectedDate] = useState<string>('');

	useEffect(() => {
		async function fetchIssues() {
			try {
				// Load config from ~/.config/timesheets.json
				const configPath = join(homedir(), '.config', 'timesheets.json');
				const configData = readFileSync(configPath, 'utf8');
				const config: JiraConfig = JSON.parse(configData);

				const jiraClient = new JiraClient(config);
				const fetchedIssues = await jiraClient.fetchAssignedIssues();
				setIssues(fetchedIssues);
				setClient(jiraClient);
				setStep('issue-selection');
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error');
				setStep('error');
			}
		}

		fetchIssues();
	}, []);

	const handleIssueSelect = (item: {label: string; value: string}) => {
		const issue = issues.find(i => i.key === item.value);
		if (issue) {
			setSelectedIssue(issue);
			setStep('time-selection');
		}
	};

	const handleTimeSelect = (item: {label: string; value: string}) => {
		setSelectedTime(item.value);
		setStep('comment-input');
	};

	const handleCommentSubmit = () => {
		setStep('date-selection');
	};

	const handleDateSelect = async (item: {label: string; value: string}) => {
		setSelectedDate(item.value);
		setStep('submitting');
		
		try {
			if (client && selectedIssue) {
				// Convert to proper Jira format: yyyy-MM-dd'T'HH:mm:ss.SSSZ
				const selectedDateTime = new Date(item.value);
				const formattedStarted = selectedDateTime.toISOString().replace('Z', '+0000');
				
				const worklogData: WorklogRequest = {
					timeSpent: selectedTime,
					comment: comment || 'Worked on this issue',
					started: formattedStarted
				};
				
				await client.addWorklog(selectedIssue.key, worklogData);
				setStep('success');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error');
			setStep('error');
		}
	};

	const issueItems = issues.map(issue => ({
		label: `${issue.key} - ${issue.fields.summary}`,
		value: issue.key
	}));

	const timeItems = [
		{label: '1 hour', value: '1h'},
		{label: '2 hours', value: '2h'},
		{label: '4 hours', value: '4h'},
		{label: '6 hours', value: '6h'},
		{label: '8 hours', value: '8h'}
	];

	const today = new Date().toISOString().split('T')[0];
	const dateItems = [
		{label: `Today (${today})`, value: new Date().toISOString()},
		{label: 'Yesterday', value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()},
		{label: 'Day before yesterday', value: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()}
	];

	if (step === 'loading') {
		return <Text>Loading issues...</Text>;
	}

	if (step === 'error') {
		return <Text color="red">Error: {error}</Text>;
	}

	if (step === 'issue-selection') {
		return (
			<Box flexDirection="column">
				<Text>
					Hello, <Text color="green">{name}</Text>
				</Text>
				<Text> </Text>
				<Text color="blue">Select an issue to log time:</Text>
				<Text> </Text>
				<SelectInput items={issueItems} onSelect={handleIssueSelect} />
			</Box>
		);
	}

	if (step === 'time-selection') {
		return (
			<Box flexDirection="column">
				<Text color="green">Selected: {selectedIssue?.key}</Text>
				<Text> </Text>
				<Text color="blue">Select time to log:</Text>
				<Text> </Text>
				<SelectInput items={timeItems} onSelect={handleTimeSelect} />
			</Box>
		);
	}

	if (step === 'comment-input') {
		return (
			<Box flexDirection="column">
				<Text color="green">Selected: {selectedIssue?.key} - {selectedTime}</Text>
				<Text> </Text>
				<Text color="blue">Enter comment (optional, press Enter to continue):</Text>
				<Text> </Text>
				<TextInput 
					value={comment}
					onChange={setComment}
					onSubmit={handleCommentSubmit}
					placeholder="Worked on this issue"
				/>
			</Box>
		);
	}

	if (step === 'date-selection') {
		return (
			<Box flexDirection="column">
				<Text color="green">Selected: {selectedIssue?.key} - {selectedTime}</Text>
				<Text color="gray">Comment: {comment || 'Worked on this issue'}</Text>
				<Text> </Text>
				<Text color="blue">Select date:</Text>
				<Text> </Text>
				<SelectInput items={dateItems} onSelect={handleDateSelect} />
			</Box>
		);
	}

	if (step === 'submitting') {
		return <Text>Submitting worklog...</Text>;
	}

	if (step === 'success') {
		return (
			<Box flexDirection="column">
				<Text color="green">✓ Worklog successfully added!</Text>
				<Text> </Text>
				<Text>Issue: {selectedIssue?.key}</Text>
				<Text>Time: {selectedTime}</Text>
				<Text>Comment: {comment || 'Worked on this issue'}</Text>
				<Text>Date: {selectedDate.split('T')[0]}</Text>
			</Box>
		);
	}

	return null;
}
