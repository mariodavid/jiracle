import {useState, useEffect} from 'react';
import {
	JiraClient,
	normalizeTimeFormat,
	extractIssueKeyFromInput,
	resolveDefaults,
} from '../jira-client.js';
import {formatLocalDateKey} from '../utils/date.js';
import type {JiraIssue, JiraConfig, WorklogRequest} from '../jira-client.js';
import {readFileSync} from 'fs';
import {homedir} from 'os';
import {join} from 'path';
import type {Step, IssueSelectionMode} from '../types/index.js';
import {WeeklyWorklogSummaryUseCase} from '../use-cases/WeeklyWorklogSummaryUseCase.js';
import type {WeeklyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';

export function useWorklogFlow(config?: JiraConfig) {
	const [favoriteIssues, setFavoriteIssues] = useState<JiraIssue[]>([]);
	const [assignedIssues, setAssignedIssues] = useState<JiraIssue[]>([]);
	const [currentWeekWorklog, setCurrentWeekWorklog] =
		useState<WeeklyWorklogSummary | null>(null);
	const [currentUser, setCurrentUser] = useState<string | null>(null);
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
				setStep('weekly-timetable');
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

				// Preload favorites, assigned issues, and current week worklog
				const currentWeekStart = getStartOfWeek(new Date());
				const currentWeekEnd = getEndOfWeek(new Date());

				// Get current user email first
				const userResponse = await jiraClient
					.getCurrentUser()
					.catch(() => null);
				const userEmail = userResponse?.emailAddress || null;

				const worklogUseCase = new WeeklyWorklogSummaryUseCase(jiraClient);

				const [favorites, assigned, currentWeekData] = await Promise.all([
					jiraClient.fetchFavoriteIssues(parsedConfig.favorites || []),
					jiraClient.fetchAssignedIssues(),
					userEmail
						? worklogUseCase
								.execute(currentWeekStart, currentWeekEnd, userEmail)
								.catch(() => null)
						: Promise.resolve(null), // Don't try worklog if user fetch failed
				]);

				setFavoriteIssues(favorites);
				setAssignedIssues(assigned);
				setCurrentWeekWorklog(currentWeekData);
				setCurrentUser(userEmail);
				setStep('weekly-timetable');
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

			// Set default comment using hierarchical resolution
			if (currentConfig) {
				const defaults = resolveDefaults(currentConfig, value);
				if (defaults.comment) {
					setComment(defaults.comment);
				}
			}

			setStep('time-selection');
		}
	};

	const handleTimeSelect = (timeValue?: string) => {
		// Use the passed value or the current state
		const timeToValidate = timeValue || selectedTime;
		// Normalize time format for Jira API
		const normalizedTime = normalizeTimeFormat(timeToValidate);
		if (normalizedTime) {
			setSelectedTime(normalizedTime);

			// Set default comment if this is a favorite issue and comment is empty
			if (currentConfig && selectedIssue && !comment) {
				const defaults = resolveDefaults(currentConfig, selectedIssue.key);
				if (defaults.comment) {
					setComment(defaults.comment);
				}
			}

			setStep('comment-input');
		} else {
			// Show error for invalid time format
			setError('Invalid time format. Examples: 2h, 30m, 1.5h, 2h 30m');
			// Stay on time selection
			setStep('time-selection');
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

		// Reset comment to default using hierarchical resolution
		if (currentConfig && selectedIssue) {
			const defaults = resolveDefaults(currentConfig, selectedIssue.key);
			setComment(defaults.comment);
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
		setStep('weekly-timetable');
	};

	const handleBackFromTimetable = () => {
		// No back from timetable since it's the main view now
		// Could potentially exit the app or do nothing
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
			setStep('weekly-timetable');
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

	const handleCommentSubmit = async () => {
		// If we have a pre-selected date (from timetable), skip date selection and submit directly
		if (selectedDate) {
			setStep('submitting');

			try {
				if (client && selectedIssue) {
					// Convert to proper Jira format: yyyy-MM-dd'T'HH:mm:ss.SSSZ
					const selectedDateTime = new Date(selectedDate);
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
		} else {
			setStep('date-selection');
		}
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

	const startWorklogWithPrefilledData = (issue: JiraIssue, date: Date) => {
		// Check if this issue is a favorite
		const isFavorite = currentConfig?.favorites?.some(
			fav => fav.key === issue.key,
		);
		const defaultComment = currentConfig
			? resolveDefaults(currentConfig, issue.key).comment
			: undefined;

		// Reset all state
		setSelectedIssue(issue);
		setSelectedTime('');
		setComment(defaultComment || '');
		setSelectedDate(formatLocalDateKey(date));
		setIssueSelectionMode(isFavorite ? 'favorites' : null);
		setManualIssueKey('');
		setInputError('');

		// Skip to time selection
		setStep('time-selection');
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
		currentConfig,
		currentWeekWorklog,
		currentUser,

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
		handleBackFromTimetable,
		handleBackToIssueSelectionMode,
		handleMainMenuSelect,
		handleIssueSelectionModeSelect,
		handleManualIssueSubmit,
		handleCommentSubmit,
		handleDateSelect,
		startWorklogWithPrefilledData,
	};
}

function getStartOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function getEndOfWeek(date: Date): Date {
	const start = getStartOfWeek(date);
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	end.setHours(23, 59, 59, 999);
	return end;
}
