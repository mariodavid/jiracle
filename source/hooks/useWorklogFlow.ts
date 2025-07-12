import {useState, useEffect} from 'react';
import {JiraClient} from '../jira-client.js';
import type {JiraIssue, JiraConfig} from '../jira-client.js';
import {readFileSync} from 'fs';
import {homedir} from 'os';
import {join} from 'path';
import type {Step} from '../types/index.js';
import {WeeklyWorklogSummaryUseCase} from '../use-cases/WeeklyWorklogSummaryUseCase.js';
import type {WeeklyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';
import {ReminderService} from '../services/ReminderService.js';

export function useWorklogFlow(config?: JiraConfig) {
	const [currentWeekWorklog, setCurrentWeekWorklog] =
		useState<WeeklyWorklogSummary | null>(null);
	const [currentUser, setCurrentUser] = useState<string | null>(null);
	const [, setClient] = useState<JiraClient | null>(null);
	const [currentConfig, setCurrentConfig] = useState<JiraConfig | null>(null);
	const [step, setStep] = useState<Step>('loading');
	const [error, setError] = useState<string | null>(null);
	const [reminderService, setReminderService] =
		useState<ReminderService | null>(null);

	// No longer needed for manual flow - only keep what inline form needs

	// No longer needed - inline form doesn't use success state

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

				const [, , currentWeekData] = await Promise.all([
					Promise.resolve([]), // Skip fetching favorites
					Promise.resolve([]), // Skip fetching assigned issues
					userEmail
						? worklogUseCase
								.execute(currentWeekStart, currentWeekEnd, userEmail)
								.catch(() => null)
						: Promise.resolve(null), // Don't try worklog if user fetch failed
				]);

				// No longer need to set favorite/assigned issues
				setCurrentWeekWorklog(currentWeekData);
				setCurrentUser(userEmail);

				// Start reminder service if enabled
				if (parsedConfig.reminders?.enabled) {
					const reminder = new ReminderService(
						jiraClient,
						parsedConfig.reminders,
					);
					reminder.start();
					setReminderService(reminder);
				}

				setStep('weekly-timetable');
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error');
				setStep('error');
			}
		}

		loadConfigAndIssues();
	}, [config]);

	// Cleanup reminder service on unmount
	useEffect(() => {
		return () => {
			if (reminderService) {
				reminderService.stop();
			}
		};
	}, [reminderService]);

	const handleBackFromTimetable = () => {
		// No back from timetable since it's the main view now
		// Could potentially exit the app or do nothing
	};

	const startWorklogWithPrefilledData = (_issue: JiraIssue, _date: Date) => {
		// This function is still used by inline form to prefill data
		// But it doesn't need to set step since inline form handles its own flow
		// For now, keep it for compatibility
	};

	return {
		// State
		step,
		error,
		currentConfig,
		currentWeekWorklog,
		currentUser,

		// Handlers
		handleBackFromTimetable,
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
