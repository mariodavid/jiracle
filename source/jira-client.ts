export interface JiraConfig {
	jiraUrl: string;
	username: string;
	apiToken: string;
}

export interface JiraIssueField {
	summary: string;
	status: {
		name: string;
		statusCategory: {
			name: string;
		};
	};
	issuetype: {
		name: string;
		iconUrl: string;
	};
	priority: {
		name: string;
		iconUrl: string;
	};
	assignee: {
		displayName: string;
		emailAddress: string;
	};
	created: string;
	updated: string;
}

export interface JiraIssue {
	id: string;
	key: string;
	fields: JiraIssueField;
}

export interface JiraSearchResponse {
	issues: JiraIssue[];
	startAt: number;
	maxResults: number;
	total: number;
}

import winston from 'winston';
import {join} from 'path';

export interface WorklogRequest {
	timeSpent: string;
	comment: string;
	started: string;
}

export class JiraClient {
	readonly jiraUrl: string;
	readonly apiToken: string;
	readonly baseUrl: string;
	private readonly logger: winston.Logger;

	constructor(config: JiraConfig) {
		this.jiraUrl = config.jiraUrl;
		this.apiToken = config.apiToken;
		this.baseUrl = `${this.jiraUrl}rest/api/2`;
		
		// Configure Winston logger
		this.logger = winston.createLogger({
			level: 'info',
			format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.errors({stack: true}),
				winston.format.json()
			),
			transports: [
				new winston.transports.File({
					filename: join(process.env['HOME'] || '~', '.config', 'jiracle-requests.log'),
					level: 'info'
				}),
				new winston.transports.Console({
					level: 'error',
					format: winston.format.simple()
				})
			]
		});
	}

	async fetchAssignedIssues(): Promise<JiraIssue[]> {
		const jql =
			'assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC';
		const searchUrl = `${this.baseUrl}/search`;
		const requestData = {
			jql,
			maxResults: 50,
			fields: [
				'summary',
				'status',
				'issuetype',
				'priority',
				'assignee',
				'created',
				'updated',
			],
		};

		this.logger.info('Fetching assigned issues', {
			method: 'POST',
			url: searchUrl,
			requestData
		});

		try {
			const response = await fetch(searchUrl, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestData),
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error('Failed to fetch assigned issues', {
					method: 'POST',
					url: searchUrl,
					status: response.status,
					error: errorText
				});
				throw new Error(`Jira API error: ${response.status} - ${errorText}`);
			}

			const data = (await response.json()) as JiraSearchResponse;
			this.logger.info('Successfully fetched assigned issues', {
				method: 'POST',
				url: searchUrl,
				status: response.status,
				issueCount: data.issues.length,
				total: data.total
			});
			
			return data.issues;
		} catch (error) {
			this.logger.error('Error fetching assigned issues', {
				method: 'POST',
				url: searchUrl,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			throw error;
		}
	}

	async fetchIssue(issueKey: string): Promise<JiraIssue> {
		const issueUrl = `${this.baseUrl}/issue/${issueKey}`;

		this.logger.info('Fetching issue', {
			method: 'GET',
			url: issueUrl,
			issueKey
		});

		try {
			const response = await fetch(issueUrl, {
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
					Accept: 'application/json',
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error('Failed to fetch issue', {
					method: 'GET',
					url: issueUrl,
					issueKey,
					status: response.status,
					error: errorText
				});
				throw new Error(`Jira API error: ${response.status} - ${errorText}`);
			}

			this.logger.info('Successfully fetched issue', {
				method: 'GET',
				url: issueUrl,
				issueKey,
				status: response.status
			});

			return response.json() as Promise<JiraIssue>;
		} catch (error) {
			this.logger.error('Error fetching issue', {
				method: 'GET',
				url: issueUrl,
				issueKey,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			throw error;
		}
	}

	async addWorklog(issueKey: string, worklogData: WorklogRequest): Promise<void> {
		const worklogUrl = `${this.baseUrl}/issue/${issueKey}/worklog`;

		this.logger.info('Adding worklog', {
			method: 'POST',
			url: worklogUrl,
			issueKey,
			worklogData
		});

		try {
			const response = await fetch(worklogUrl, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(worklogData),
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error('Failed to add worklog', {
					method: 'POST',
					url: worklogUrl,
					issueKey,
					worklogData,
					status: response.status,
					error: errorText
				});
				throw new Error(`Jira API error: ${response.status} - ${errorText}`);
			}

			this.logger.info('Successfully added worklog', {
				method: 'POST',
				url: worklogUrl,
				issueKey,
				worklogData,
				status: response.status
			});
		} catch (error) {
			this.logger.error('Error adding worklog', {
				method: 'POST',
				url: worklogUrl,
				issueKey,
				worklogData,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			throw error;
		}
	}
}
