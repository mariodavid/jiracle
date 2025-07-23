import {JiraClient} from '../../jira-client.js';
import type {JiraConfig} from '../../jira-client.js';

export const mockConfig: JiraConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token-123',
};

export function createMockJiraClient(): JiraClient {
	return new JiraClient(mockConfig);
}
