import {IssueKey} from '../domain/IssueKey.js';
import type {JiraConfig} from './types.js';

export function validateConfiguration(config: JiraConfig): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (config.jiraUrl) {
		if (
			config.jiraUrl.includes('/browse/') ||
			config.jiraUrl.includes('/projects/')
		) {
			errors.push(
				`Jira URL appears to be a web UI URL instead of the base URL. Expected: https://your-jira-instance.com/, Got: ${config.jiraUrl}`,
			);
		}

		if (config.jiraUrl.startsWith('http')) {
			// URL format is correct
		} else {
			errors.push(
				`Jira URL must start with http:// or https://. Got: ${config.jiraUrl}`,
			);
		}
	} else {
		errors.push('Jira URL is not configured');
	}

	if (!config.apiToken) {
		errors.push('API token is not configured');
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

export function validateIssueKey(issueKey: string): void {
	// Use IssueKey domain object for validation
	// This will throw the same errors as before but uses centralized logic
	IssueKey.fromString(issueKey);
}
