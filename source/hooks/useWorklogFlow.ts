import {useState, useEffect} from 'react';
import {
	JiraClient,
	normalizeTimeFormat,
	extractIssueKeyFromInput,
	getFavoriteDefaultComment,
} from '../jira-client.js';
import type {JiraIssue, JiraConfig, WorklogRequest} from '../jira-client.js';
import {readFileSync} from 'fs';
import {homedir} from 'os';
import {join} from 'path';
import type {Step, IssueSelectionMode} from '../types/index.js';

export function useWorklogFlow(config?: JiraConfig) {
	const [favoriteIssues, setFavoriteIssues] = useState<JiraIssue[]>([]);
	const [assignedIssues, setAssignedIssues] = useState<JiraIssue[]>([]);
	const [client, setClient] = useState<JiraClient | null>(null);
	const [currentConfig, setCurrentConfig] = useState<JiraConfig | null>(null);
	const [step, setStep] = useState<Step>('loading');
	const [error, setError] = useState<string | null>(null);

	// Selection state
	const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null);
	const [selectedTime, setSelectedTime] = useState<string>('');
	const [comment, setComment] = useState<string>('');
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [issueSelectionMode, setIssueSelectionMode] =
		useState<IssueSelectionMode>(null);
	const [manualIssueKey, setManualIssueKey] = useState<string>('');
	const [inputError, setInputError] = useState<string>('');

	// Handle auto-reset after success
	useEffect(() => {
		if (step === 'success') {
			const timer = setTimeout(() => {
				setSelectedIssue(null);
				setSelectedTime('');
				setComment('');
				setSelectedDate('');
				setIssueSelectionMode(null);
				setManualIssueKey('');
				setInputError('');
				setStep('main-menu');
			}, 2000);

			return () => clearTimeout(timer);
		}
		return undefined;
	}, [step]);

	useEffect(() => {
		async function loadConfigAndIssues() {
			try {
				// Add a minimum delay for the banner/loading effect
				await new Promise(resolve => setTimeout(resolve, 2000));

				let parsedConfig: JiraConfig;

				if (config) {
					// Use provided config (for tests)
					parsedConfig = config;
				} else {
					// Load config from ~/.config/jiracle.json
					const configPath = join(homedir(), '.config', 'jiracle.json');
					const configData = readFileSync(configPath, 'utf8');
					parsedConfig = JSON.parse(configData);
				}

				const jiraClient = new JiraClient(parsedConfig);
				setClient(jiraClient);
				setCurrentConfig(parsedConfig);

				// Preload both favorites and assigned issues
				const [favorites, assigned] = await Promise.all([
					jiraClient.fetchFavoriteIssues(parsedConfig.favorites || []),
					jiraClient.fetchAssignedIssues(),
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
	}, [config]);

	const handleIssueSelect = (value: string) => {
		const allIssues = [...favoriteIssues, ...assignedIssues];
		const issue = allIssues.find(i => i.key === value);
		if (issue) {
			setSelectedIssue(issue);

			// Set default comment if this is a favorite issue and has a configured comment
			if (issueSelectionMode === 'favorites' && currentConfig) {
				const defaultComment = getFavoriteDefaultComment(
					currentConfig.favorites || [],
					value,
				);
				if (defaultComment) {
					setComment(defaultComment);
				}
			}

			setStep('time-selection');
		}
	};

	const handleTimeSelect = (value: string) => {
		if (value === 'custom') {
			setStep('custom-time-input');
		} else {
			setSelectedTime(value);

			// Set default comment if this is a favorite issue and comment is empty
			if (
				issueSelectionMode === 'favorites' &&
				currentConfig &&
				selectedIssue &&
				!comment
			) {
				const defaultComment = getFavoriteDefaultComment(
					currentConfig.favorites || [],
					selectedIssue.key,
				);
				if (defaultComment) {
					setComment(defaultComment);
				}
			}

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
		setSelectedDate('');

		// Reset comment to default if this is a favorite issue with a configured comment
		if (issueSelectionMode === 'favorites' && currentConfig && selectedIssue) {
			const defaultComment = getFavoriteDefaultComment(
				currentConfig.favorites || [],
				selectedIssue.key,
			);
			setComment(defaultComment || '');
		} else {
			setComment('');
		}

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

	const handleMainMenuSelect = (value: string) => {
		if (value === 'log-work') {
			setStep('issue-selection-mode');
		} else if (value === 'week-overview') {
			// TODO: Implement week overview
			setError('Week overview not implemented yet');
			setStep('error');
		} else if (value === 'settings') {
			// TODO: Implement settings
			setError('Settings not implemented yet');
			setStep('error');
		}
	};

	const handleIssueSelectionModeSelect = (value: string) => {
		if (value === 'favorites') {
			setIssueSelectionMode('favorites');
			setStep('issue-selection');
		} else if (value === 'assigned') {
			setIssueSelectionMode('assigned');
			setStep('issue-selection');
		} else if (value === 'other') {
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
		if (normalizedTime) {
			setSelectedTime(normalizedTime);
			setStep('comment-input');
		} else {
			// Show error for invalid time format
			setError('Invalid time format. Examples: 2h, 30m, 1.5h, 2h 30m');
			setStep('error');
		}
	};

	const handleCommentSubmit = () => {
		setStep('date-selection');
	};

	const handleDateSelect = async (value: string) => {
		setSelectedDate(value);
		setStep('submitting');

		try {
			if (client && selectedIssue) {
				// Convert to proper Jira format: yyyy-MM-dd'T'HH:mm:ss.SSSZ
				const selectedDateTime = new Date(value);
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

	return {
		// State
		favoriteIssues,
		assignedIssues,
		step,
		error,
		selectedIssue,
		selectedTime,
		comment,
		selectedDate,
		issueSelectionMode,
		manualIssueKey,
		inputError,

		// State setters (for controlled components)
		setSelectedTime,
		setComment,
		setManualIssueKey,
		setInputError,

		// Handlers
		handleIssueSelect,
		handleTimeSelect,
		handleBackToIssueSelection,
		handleBackToTimeSelection,
		handleBackToCommentInput,
		handleBackToMainMenu,
		handleBackToIssueSelectionMode,
		handleMainMenuSelect,
		handleIssueSelectionModeSelect,
		handleManualIssueSubmit,
		handleCustomTimeSubmit,
		handleCommentSubmit,
		handleDateSelect,
	};
}
