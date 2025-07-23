import {useState, useEffect} from 'react';
import {JiraClient} from '../jira-client.js';
import type {JiraConfig} from '../jira-client.js';
import type {Step} from '../types/index.js';
import {ReminderService} from '../services/ReminderService.js';
import {loadJiraConfig} from '../utils/config-loader.js';

export type UseConfigResult = {
	step: Step;
	error: string | undefined;
	config: JiraConfig | undefined;
	userEmail: string | undefined;
};

export function useConfig(providedConfig?: JiraConfig): UseConfigResult {
	const [config, setConfig] = useState<JiraConfig | undefined>(undefined);
	const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
	const [step, setStep] = useState<Step>('loading');
	const [error, setError] = useState<string | undefined>(undefined);
	const [reminderService, setReminderService] = useState<
		ReminderService | undefined
	>(undefined);

	useEffect(() => {
		async function loadConfigAndUser() {
			try {
				const parsedConfig: JiraConfig = providedConfig ?? loadJiraConfig();

				const jiraClient = new JiraClient(parsedConfig);
				setConfig(parsedConfig);

				// Get current user email
				const userResponse = await jiraClient
					.getCurrentUser()
					.catch(() => undefined);
				const userEmailAddress = userResponse?.emailAddress ?? undefined;
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
			} catch (error_: unknown) {
				setError(error_ instanceof Error ? error_.message : 'Unknown error');
				setStep('error');
			}
		}

		void loadConfigAndUser();
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
