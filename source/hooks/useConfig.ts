import {useState, useEffect} from 'react';
import {JiraClient} from '../jira-client.js';
import type {JiraConfig} from '../jira-client.js';
import {readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import type {Step} from '../types/index.js';
import {ReminderService} from '../services/ReminderService.js';

export type UseConfigResult = {
	step: Step;
	error: string | null;
	config: JiraConfig | null;
	userEmail: string | null;
};

export function useConfig(providedConfig?: JiraConfig): UseConfigResult {
	const [config, setConfig] = useState<JiraConfig | null>(null);
	const [userEmail, setUserEmail] = useState<string | null>(null);
	const [step, setStep] = useState<Step>('loading');
	const [error, setError] = useState<string | null>(null);
	const [reminderService, setReminderService] =
		useState<ReminderService | null>(null);

	useEffect(() => {
		async function loadConfigAndUser() {
			try {
				let parsedConfig: JiraConfig;

				if (providedConfig) {
					// Use provided config (for tests)
					parsedConfig = providedConfig;
				} else {
					// Load config from ~/.config/jiracle.json
					const configPath = join(homedir(), '.config', 'jiracle.json');
					const configData = readFileSync(configPath, 'utf8');
					parsedConfig = JSON.parse(configData);
				}

				const jiraClient = new JiraClient(parsedConfig);
				setConfig(parsedConfig);

				// Get current user email
				const userResponse = await jiraClient
					.getCurrentUser()
					.catch(() => null);
				const userEmailAddress = userResponse?.emailAddress || null;
				setUserEmail(userEmailAddress);

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
			} catch (error_) {
				setError(error_ instanceof Error ? error_.message : 'Unknown error');
				setStep('error');
			}
		}

		loadConfigAndUser();
	}, [providedConfig]);

	// Cleanup reminder service on unmount
	useEffect(() => {
		return () => {
			if (reminderService) {
				reminderService.stop();
			}
		};
	}, [reminderService]);

	return {
		step,
		error,
		config,
		userEmail,
	};
}
