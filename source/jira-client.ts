export interface JiraConfig {
	jiraUrl: string;
	username: string;
	apiToken: string;
	favorites?: string[];
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

export function normalizeTimeFormat(timeString: string): string {
	// Convert "2h30m" to "2h 30m" format that Jira expects
	// Also normalize German decimal separator "," to "."
	return timeString
		.replace(/,/g, '.') // Convert German comma to English dot
		.replace(/(\d+)([hm])/g, '$1$2 ') // Add space after h/m
		.replace(/\s+/g, ' ') // Normalize multiple spaces
		.trim();
}

export function extractIssueKeyFromInput(input: string): string | null {
	// Trim whitespace
	const trimmed = input.trim();

	if (!trimmed) {
		return null;
	}

	// Check if it's a URL
	if (trimmed.includes('/browse/')) {
		// Extract issue key from URL like https://jira.convista.com/browse/JTS-2457
		const match = trimmed.match(/\/browse\/([A-Z]+-\d+)/);
		if (match && match[1]) {
			return match[1];
		}
		// If it contains /browse/ but no valid issue key, it's invalid
		return null;
	}

	// Check if it's already an issue key (PROJECT-123 format)
	const issueKeyMatch = trimmed.match(/^([A-Z]+-\d+)$/);
	if (issueKeyMatch && issueKeyMatch[1]) {
		return issueKeyMatch[1];
	}

	// If no pattern matches, it's invalid
	return null;
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
				winston.format.json(),
			),
			transports: [
				new winston.transports.File({
					filename: join(
						process.env['HOME'] || '~',
						'.config',
						'jiracle-requests.log',
					),
					level: 'info',
				}),
				new winston.transports.Console({
					level: 'error',
					format: winston.format.simple(),
				}),
			],
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
			requestData,
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
					error: errorText,
				});
				throw new Error(`Jira API error: ${response.status} - ${errorText}`);
			}

			const data = (await response.json()) as JiraSearchResponse;
			this.logger.info('Successfully fetched assigned issues', {
				method: 'POST',
				url: searchUrl,
				status: response.status,
				issueCount: data.issues.length,
				total: data.total,
			});

			return data.issues;
		} catch (error) {
			this.logger.error('Error fetching assigned issues', {
				method: 'POST',
				url: searchUrl,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async fetchFavoriteIssues(favoriteKeys: string[]): Promise<JiraIssue[]> {
		if (favoriteKeys.length === 0) {
			return [];
		}

		const jql = `key in (${favoriteKeys
			.map(key => `"${key}"`)
			.join(', ')}) AND resolution = Unresolved`;
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

		this.logger.info('Fetching favorite issues', {
			method: 'POST',
			url: searchUrl,
			requestData,
			favoriteKeys,
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
				this.logger.error('Failed to fetch favorite issues', {
					method: 'POST',
					url: searchUrl,
					status: response.status,
					error: errorText,
				});
				throw new Error(`Jira API error: ${response.status} - ${errorText}`);
			}

			const data = (await response.json()) as JiraSearchResponse;
			this.logger.info('Successfully fetched favorite issues', {
				method: 'POST',
				url: searchUrl,
				status: response.status,
				issueCount: data.issues.length,
				total: data.total,
			});

			// Sort favorites according to the order in the config
			const sortedIssues = favoriteKeys
				.map(key => data.issues.find(issue => issue.key === key))
				.filter((issue): issue is JiraIssue => issue !== undefined);

			return sortedIssues;
		} catch (error) {
			this.logger.error('Error fetching favorite issues', {
				method: 'POST',
				url: searchUrl,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async fetchIssue(issueKey: string): Promise<JiraIssue> {
		const issueUrl = `${this.baseUrl}/issue/${issueKey}`;

		this.logger.info('Fetching issue', {
			method: 'GET',
			url: issueUrl,
			issueKey,
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
					error: errorText,
				});
				throw new Error(`Jira API error: ${response.status} - ${errorText}`);
			}

			this.logger.info('Successfully fetched issue', {
				method: 'GET',
				url: issueUrl,
				issueKey,
				status: response.status,
			});

			return response.json() as Promise<JiraIssue>;
		} catch (error) {
			this.logger.error('Error fetching issue', {
				method: 'GET',
				url: issueUrl,
				issueKey,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async addWorklog(
		issueKey: string,
		worklogData: WorklogRequest,
	): Promise<void> {
		const worklogUrl = `${this.baseUrl}/issue/${issueKey}/worklog`;

		this.logger.info('Adding worklog', {
			method: 'POST',
			url: worklogUrl,
			issueKey,
			worklogData,
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
					error: errorText,
				});
				throw new Error(`Jira API error: ${response.status} - ${errorText}`);
			}

			this.logger.info('Successfully added worklog', {
				method: 'POST',
				url: worklogUrl,
				issueKey,
				worklogData,
				status: response.status,
			});
		} catch (error) {
			this.logger.error('Error adding worklog', {
				method: 'POST',
				url: worklogUrl,
				issueKey,
				worklogData,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
