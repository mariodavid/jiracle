import React, {useEffect, useState} from 'react';
import {Text, Box, useInput} from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import {Alert, Spinner} from '@inkjs/ui';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import {
	JiraClient,
	normalizeTimeFormat,
	extractIssueKeyFromInput,
} from './jira-client.js';
import type {JiraIssue, JiraConfig, WorklogRequest} from './jira-client.js';
import {readFileSync} from 'fs';
import {homedir} from 'os';
import {join} from 'path';

type Props = {};

type Step =
	| 'loading'
	| 'main-menu'
	| 'issue-selection-mode'
	| 'issue-selection'
	| 'manual-issue-input'
	| 'time-selection'
	| 'custom-time-input'
	| 'comment-input'
	| 'date-selection'
	| 'submitting'
	| 'success'
	| 'error';

export default function App({}: Props) {
	const [favoriteIssues, setFavoriteIssues] = useState<JiraIssue[]>([]);
	const [assignedIssues, setAssignedIssues] = useState<JiraIssue[]>([]);
	const [client, setClient] = useState<JiraClient | null>(null);
	const [step, setStep] = useState<Step>('loading');
	const [error, setError] = useState<string | null>(null);

	// Selection state
	const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null);
	const [selectedTime, setSelectedTime] = useState<string>('');
	const [comment, setComment] = useState<string>('');
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [issueSelectionMode, setIssueSelectionMode] = useState<
		'favorites' | 'assigned' | 'other' | null
	>(null);
	const [manualIssueKey, setManualIssueKey] = useState<string>('');
	const [inputError, setInputError] = useState<string>('');

	// ESC key handling for navigation
	useInput((_, key) => {
		if (key.escape) {
			if (step === 'issue-selection-mode') {
				handleBackToMainMenu();
			} else if (step === 'issue-selection') {
				handleBackToIssueSelectionMode();
			} else if (step === 'manual-issue-input') {
				handleBackToIssueSelectionMode();
			} else if (step === 'time-selection') {
				if (issueSelectionMode === 'other') {
					handleBackToIssueSelectionMode();
				} else {
					handleBackToIssueSelection();
				}
			} else if (step === 'custom-time-input') {
				handleBackToTimeSelection();
			} else if (step === 'comment-input') {
				handleBackToTimeSelection();
			} else if (step === 'date-selection') {
				handleBackToCommentInput();
			}
		}
	});

	useEffect(() => {
		async function loadConfigAndIssues() {
			try {
				// Add a minimum delay for the banner/loading effect
				await new Promise(resolve => setTimeout(resolve, 2000));

				// Load config from ~/.config/jiracle.json
				const configPath = join(homedir(), '.config', 'jiracle.json');
				const configData = readFileSync(configPath, 'utf8');
				const parsedConfig: JiraConfig = JSON.parse(configData);

				const jiraClient = new JiraClient(parsedConfig);
				setClient(jiraClient);

				// Preload both favorites and assigned issues
				const [favorites, assigned] = await Promise.all([
					jiraClient.fetchFavoriteIssues(parsedConfig.favorites || []),
					jiraClient.fetchAssignedIssues()
				]);

				setFavoriteIssues(favorites);
				setAssignedIssues(assigned);
				setStep('main-menu');
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error');
				setStep('error');
			}
		}

		loadConfigAndIssues();
	}, []);

	const handleIssueSelect = (item: {label: string; value: string}) => {
		const allIssues = [...favoriteIssues, ...assignedIssues];
		const issue = allIssues.find(i => i.key === item.value);
		if (issue) {
			setSelectedIssue(issue);
			setStep('time-selection');
		}
	};

	const handleTimeSelect = (item: {label: string; value: string}) => {
		if (item.value === 'custom') {
			setStep('custom-time-input');
		} else {
			setSelectedTime(item.value);
			setStep('comment-input');
		}
	};

	const handleBackToIssueSelection = () => {
		setSelectedIssue(null);
		setSelectedTime('');
		setComment('');
		setSelectedDate('');
		if (issueSelectionMode === 'other') {
			setStep('issue-selection-mode');
		} else {
			setStep('issue-selection');
		}
	};

	const handleBackToTimeSelection = () => {
		setSelectedTime('');
		setComment('');
		setSelectedDate('');
		setStep('time-selection');
	};

	const handleBackToCommentInput = () => {
		setSelectedDate('');
		setStep('comment-input');
	};

	const handleBackToMainMenu = () => {
		setIssueSelectionMode(null);
		setStep('main-menu');
	};

	const handleBackToIssueSelectionMode = () => {
		setSelectedIssue(null);
		setManualIssueKey('');
		setInputError('');
		setStep('issue-selection-mode');
	};

	const handleMainMenuSelect = (item: {label: string; value: string}) => {
		if (item.value === 'log-work') {
			setStep('issue-selection-mode');
		} else if (item.value === 'week-overview') {
			// TODO: Implement week overview
			setError('Week overview not implemented yet');
			setStep('error');
		} else if (item.value === 'settings') {
			// TODO: Implement settings
			setError('Settings not implemented yet');
			setStep('error');
		}
	};

	const handleIssueSelectionModeSelect = (item: {
		label: string;
		value: string;
	}) => {
		if (item.value === 'favorites') {
			setIssueSelectionMode('favorites');
			setStep('issue-selection');
		} else if (item.value === 'assigned') {
			setIssueSelectionMode('assigned');
			setStep('issue-selection');
		} else if (item.value === 'other') {
			setIssueSelectionMode('other');
			setInputError('');
			setStep('manual-issue-input');
		}
	};


	const handleManualIssueSubmit = async () => {
		setInputError(''); // Clear any previous errors
		
		if (!client || !manualIssueKey.trim()) {
			return;
		}

		const issueKey = extractIssueKeyFromInput(manualIssueKey.trim());

		if (!issueKey) {
			setInputError('Invalid format. Use: JTS-1234 or Jira URL');
			return;
		}

		try {
			const issue = await client.fetchIssue(issueKey);
			setSelectedIssue(issue);
			setStep('time-selection');
		} catch (err) {
			let errorMessage = 'Unknown error';
			if (err instanceof Error) {
				if (err.message.includes('404')) {
					errorMessage = `Issue not found. Please check that the issue key exists and you have permission to view it.`;
				} else if (err.message.includes('401')) {
					errorMessage =
						'Authentication failed. Please check your Jira credentials.';
				} else if (err.message.includes('403')) {
					errorMessage =
						'Access denied. You may not have permission to view this issue.';
				} else {
					errorMessage = err.message;
				}
			}
			setInputError(errorMessage);
		}
	};

	const handleCustomTimeSubmit = () => {
		// Normalize time format for Jira API
		const normalizedTime = normalizeTimeFormat(selectedTime);
		setSelectedTime(normalizedTime);
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
				const formattedStarted = selectedDateTime
					.toISOString()
					.replace('Z', '+0000');

				const worklogData: WorklogRequest = {
					timeSpent: selectedTime,
					comment: comment || 'Worked on this issue',
					started: formattedStarted,
				};

				await client.addWorklog(selectedIssue.key, worklogData);
				setStep('success');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error');
			setStep('error');
		}
	};

	// Create issue items based on selected mode
	const currentIssues = issueSelectionMode === 'favorites' ? favoriteIssues : assignedIssues;
	const issueItems = currentIssues.map(issue => ({
		label: `${issue.key} - ${issue.fields.summary}`,
		value: issue.key,
	}));

	// Main menu items
	const mainMenuItems = [
		{label: 'Log Work', value: 'log-work'},
		{label: 'Week Overview', value: 'week-overview'},
		{label: 'Settings', value: 'settings'},
	];

	// Issue selection mode items
	const issueSelectionModeItems = [
		{label: 'Favorites', value: 'favorites'},
		{label: 'Assigned Issues', value: 'assigned'},
		{label: 'Other (Enter Issue Key)', value: 'other'},
	];

	const timeItems = [
		{label: '1 hour', value: '1h'},
		{label: '2 hours', value: '2h'},
		{label: '4 hours', value: '4h'},
		{label: '6 hours', value: '6h'},
		{label: '8 hours', value: '8h'},
		{label: 'Custom time...', value: 'custom'},
	];

	const today = new Date().toISOString().split('T')[0];
	const dateItems = [
		{label: `Today (${today})`, value: new Date().toISOString()},
		{
			label: 'Yesterday',
			value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
		},
		{
			label: 'Day before yesterday',
			value: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
		},
	];

	if (step === 'loading') {
		return (
			<Box flexDirection="column" alignItems="center" justifyContent="center">
				<Text> </Text>
				<Gradient name="rainbow">
					<BigText text="JIRACLE" />
				</Gradient>
				<Text> </Text>
				<Spinner label="Loading configuration and issues..." />
				<Text> </Text>
			</Box>
		);
	}


	if (step === 'error') {
		return <Alert variant="error">Error: {error}</Alert>;
	}

	if (step === 'main-menu') {
		return (
			<Box flexDirection="column">
				<Text color="cyan">What would you like to do?</Text>
				<Text> </Text>
				<SelectInput items={mainMenuItems} onSelect={handleMainMenuSelect} />
				<Text> </Text>
				<Text color="redBright" wrap="wrap">
					{' '}
				</Text>
			</Box>
		);
	}

	if (step === 'issue-selection-mode') {
		return (
			<Box flexDirection="column">
				<Text color="cyan">How would you like to select an issue?</Text>
				<Text> </Text>
				<SelectInput
					items={issueSelectionModeItems}
					onSelect={handleIssueSelectionModeSelect}
				/>
				<Text> </Text>
				<Text color="redBright" wrap="wrap">
					{' '}
				</Text>
				<Text color="gray">Press ESC to go back to main menu</Text>
			</Box>
		);
	}

	if (step === 'manual-issue-input') {
		return (
			<Box flexDirection="column">
				<Text color="cyan">Enter issue key or URL:</Text>
				<Text color="gray">
					Examples: JTS-1234 or https://jira.example.com/browse/JTS-1234
				</Text>
				<Text> </Text>
				<TextInput
					value={manualIssueKey}
					onChange={(value) => {
						setManualIssueKey(value);
						if (inputError) {
							setInputError(''); // Clear error when user starts typing
						}
					}}
					onSubmit={handleManualIssueSubmit}
					placeholder="JTS-1234 or https://jira.example.com/browse/JTS-1234"
				/>
				<Text> </Text>
				{inputError ? (
					<Alert variant="error">{inputError}</Alert>
				) : (
					<Text> </Text>
				)}
				<Text color="gray">Press ESC to go back to issue selection mode</Text>
			</Box>
		);
	}

	if (step === 'issue-selection') {
		const modeTitle =
			issueSelectionMode === 'favorites'
				? 'Favorite Issues'
				: 'Assigned Issues';

		return (
			<Box flexDirection="column">
				<Text color="cyan">
					{modeTitle}
				</Text>
				<Text> </Text>
				<SelectInput items={issueItems} onSelect={handleIssueSelect} />
				<Text> </Text>
				<Text color="redBright" wrap="wrap">
					{' '}
				</Text>
				<Text color="gray">Press ESC to go back to issue selection mode</Text>
			</Box>
		);
	}

	if (step === 'time-selection') {
		return (
			<Box flexDirection="column">
				<Text color="green">
					Selected: {selectedIssue?.key} - {selectedIssue?.fields.summary}
				</Text>
				<Text> </Text>
				<Text color="cyan">Select time to log:</Text>
				<Text> </Text>
				<SelectInput items={timeItems} onSelect={handleTimeSelect} />
				<Text> </Text>
				<Text color="redBright" wrap="wrap">
					{' '}
				</Text>
				<Text color="gray">Press ESC to go back to issue selection</Text>
			</Box>
		);
	}

	if (step === 'custom-time-input') {
		return (
			<Box flexDirection="column">
				<Text color="green">
					Selected: {selectedIssue?.key} - {selectedIssue?.fields.summary}
				</Text>
				<Text> </Text>
				<Text color="cyan">
					Enter custom time (e.g., 1h, 30m, 2h30m, 2,5h):
				</Text>
				<Text> </Text>
				<TextInput
					value={selectedTime}
					onChange={setSelectedTime}
					onSubmit={handleCustomTimeSubmit}
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

	if (step === 'comment-input') {
		return (
			<Box flexDirection="column">
				<Text color="green">
					Selected: {selectedIssue?.key} - {selectedIssue?.fields.summary}
				</Text>
				<Text color="gray">Time: {selectedTime}</Text>
				<Text> </Text>
				<Text color="cyan">
					Enter comment (optional, press Enter to continue):
				</Text>
				<Text> </Text>
				<TextInput
					value={comment}
					onChange={setComment}
					onSubmit={handleCommentSubmit}
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

	if (step === 'date-selection') {
		return (
			<Box flexDirection="column">
				<Text color="green">
					Selected: {selectedIssue?.key} - {selectedIssue?.fields.summary}
				</Text>
				<Text color="gray">Time: {selectedTime}</Text>
				<Text color="gray">Comment: {comment || 'Worked on this issue'}</Text>
				<Text> </Text>
				<Text color="cyan">Select date:</Text>
				<Text> </Text>
				<SelectInput items={dateItems} onSelect={handleDateSelect} />
				<Text> </Text>
				<Text color="redBright" wrap="wrap">
					{' '}
				</Text>
				<Text color="gray">Press ESC to go back to comment input</Text>
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
