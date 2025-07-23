import {join} from 'node:path';
import process from 'node:process';
import winston from 'winston';
import type {
	JiraConfig,
	JiraIssue,
	FavoriteIssue,
	JiraSearchResponse,
	WorklogRequest,
	WorklogResponse,
} from './types.js';
import {getFavoriteKeys} from './utils.js';

export class JiraClient {
	readonly jiraUrl: string;
	readonly apiToken: string;
	readonly baseUrl: string;
	private readonly logger: winston.Logger;

	constructor(config: JiraConfig, customLogger?: winston.Logger) {
		this.jiraUrl = process.env['JIRACLE_JIRA_URL'] ?? config.jiraUrl;
		this.apiToken = process.env['JIRACLE_API_TOKEN'] ?? config.apiToken;
		const normalizedJiraUrl = this.jiraUrl.endsWith('/')
			? this.jiraUrl
			: `${this.jiraUrl}/`;
		this.baseUrl = `${normalizedJiraUrl}rest/api/2`;

		if (customLogger) {
			this.logger = customLogger;
		} else {
			const isTestEnvironment =
				process.env['NODE_ENV'] === 'test' || process.env['AVA_CONFIG'];

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
							process.env['HOME'] ?? '~',
							'.config',
							'jiracle-requests.log',
						),
						level: 'info',
					}),
					...(isTestEnvironment
						? []
						: [
								new winston.transports.Console({
									level: 'error',
									format: winston.format.simple(),
								}),
						  ]),
				],
			});
		}
	}

	validateConfiguration(): {isValid: boolean; errors: string[]} {
		const errors: string[] = [];

		if (this.jiraUrl) {
			if (
				this.jiraUrl.includes('/browse/') ||
				this.jiraUrl.includes('/projects/')
			) {
				errors.push(
					`Jira URL appears to be a web UI URL instead of the base URL. Expected: https://your-jira-instance.com/, Got: ${this.jiraUrl}`,
				);
			}

			if (this.jiraUrl.startsWith('http')) {
				// URL format is correct
			} else {
				errors.push(
					`Jira URL must start with http:// or https://. Got: ${this.jiraUrl}`,
				);
			}
		} else {
			errors.push('Jira URL is not configured');
		}

		if (!this.apiToken) {
			errors.push('API token is not configured');
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
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
		} catch (error: unknown) {
			this.logger.error('Error fetching assigned issues', {
				method: 'POST',
				url: searchUrl,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async fetchFavoriteIssues(favorites: FavoriteIssue[]): Promise<JiraIssue[]> {
		if (favorites.length === 0) {
			return [];
		}

		const favoriteKeys = getFavoriteKeys(favorites);
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

			const sortedIssues = favoriteKeys
				.map(key => data.issues.find(issue => issue.key === key))
				.filter((issue): issue is JiraIssue => issue !== undefined);

			return sortedIssues;
		} catch (error: unknown) {
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

			return await (response.json() as Promise<JiraIssue>);
		} catch (error: unknown) {
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
		const validation = this.validateConfiguration();
		if (!validation.isValid) {
			const errorMessage = `Configuration errors:\n${validation.errors.join(
				'\n',
			)}`;
			this.logger.error('Invalid configuration for addWorklog', {
				errors: validation.errors,
				jiraUrl: this.jiraUrl,
				baseUrl: this.baseUrl,
			});
			throw new Error(errorMessage);
		}

		if (!issueKey || typeof issueKey !== 'string' || issueKey.trim() === '') {
			throw new Error('Issue key is required and cannot be empty');
		}

		const trimmedIssueKey = issueKey.trim();
		if (!/^[a-z]+-\d+$/i.test(trimmedIssueKey)) {
			throw new Error(
				`Invalid issue key format: "${trimmedIssueKey}". Expected format: PROJECT-123 (e.g., DEF-123, ABC-456)`,
			);
		}

		const worklogUrl = `${this.baseUrl}/issue/${trimmedIssueKey}/worklog`;

		this.logger.info('Adding worklog', {
			method: 'POST',
			url: worklogUrl,
			baseUrl: this.baseUrl,
			jiraUrl: this.jiraUrl,
			issueKey: trimmedIssueKey,
			originalIssueKey: issueKey,
			worklogData,
			timestamp: new Date().toISOString(),
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
					baseUrl: this.baseUrl,
					jiraUrl: this.jiraUrl,
					issueKey: trimmedIssueKey,
					originalIssueKey: issueKey,
					worklogData,
					status: response.status,
					statusText: response.statusText,
					error: errorText,
					headers: Object.fromEntries(response.headers.entries()),
				});

				if (response.status === 405) {
					throw new Error(
						`HTTP 405 Method Not Allowed - Check your Jira URL configuration.\n` +
							`Expected URL format: https://your-jira-instance.com/\n` +
							`Current URL: ${worklogUrl}\n` +
							`Base URL: ${this.baseUrl}\n` +
							`This error often occurs when:\n` +
							`1. The jiraUrl points to the web UI instead of the API endpoint\n` +
							`2. The Jira instance doesn't support REST API v2\n` +
							`3. The URL has incorrect formatting\n\n` +
							`Server response: ${errorText}`,
					);
				}

				throw new Error(`Jira API error: ${response.status} - ${errorText}`);
			}

			this.logger.info('Successfully added worklog', {
				method: 'POST',
				url: worklogUrl,
				issueKey: trimmedIssueKey,
				originalIssueKey: issueKey,
				worklogData,
				status: response.status,
				timestamp: new Date().toISOString(),
			});
		} catch (error: unknown) {
			this.logger.error('Error adding worklog', {
				method: 'POST',
				url: worklogUrl,
				issueKey: trimmedIssueKey,
				originalIssueKey: issueKey,
				worklogData,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async getIssueWorklogs(issueKey: string): Promise<WorklogResponse> {
		const worklogUrl = `${this.baseUrl}/issue/${issueKey}/worklog`;

		this.logger.info('Fetching issue worklogs', {
			method: 'GET',
			url: worklogUrl,
			issueKey,
		});

		try {
			const response = await fetch(worklogUrl, {
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
					Accept: 'application/json',
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error('Failed to fetch issue worklogs', {
					method: 'GET',
					url: worklogUrl,
					issueKey,
					status: response.status,
					error: errorText,
				});
				throw new Error(`Jira API error: ${response.status} - ${errorText}`);
			}

			const data = (await response.json()) as WorklogResponse;
			this.logger.info('Successfully fetched issue worklogs', {
				method: 'GET',
				url: worklogUrl,
				issueKey,
				status: response.status,
				worklogCount: data.worklogs.length,
			});

			return data;
		} catch (error: unknown) {
			this.logger.error('Error fetching issue worklogs', {
				method: 'GET',
				url: worklogUrl,
				issueKey,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async deleteWorklog(issueKey: string, worklogId: string): Promise<void> {
		const deleteUrl = `${this.baseUrl}/issue/${issueKey}/worklog/${worklogId}`;

		this.logger.info('Deleting worklog', {
			method: 'DELETE',
			url: deleteUrl,
			issueKey,
			worklogId,
		});

		try {
			const response = await fetch(deleteUrl, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
					Accept: 'application/json',
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error('Failed to delete worklog', {
					method: 'DELETE',
					url: deleteUrl,
					issueKey,
					worklogId,
					status: response.status,
					error: errorText,
				});
				throw new Error(`Jira API error: ${response.status} - ${errorText}`);
			}

			this.logger.info('Successfully deleted worklog', {
				method: 'DELETE',
				url: deleteUrl,
				issueKey,
				worklogId,
				status: response.status,
			});
		} catch (error: unknown) {
			this.logger.error('Error deleting worklog', {
				method: 'DELETE',
				url: deleteUrl,
				issueKey,
				worklogId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async updateWorklog(
		issueKey: string,
		worklogId: string,
		worklogData: WorklogRequest,
	): Promise<void> {
		const validation = this.validateConfiguration();
		if (!validation.isValid) {
			const errorMessage = `Configuration errors:\n${validation.errors.join(
				'\n',
			)}`;
			this.logger.error('Invalid configuration for updateWorklog', {
				errors: validation.errors,
				jiraUrl: this.jiraUrl,
				baseUrl: this.baseUrl,
			});
			throw new Error(errorMessage);
		}

		if (!issueKey || typeof issueKey !== 'string' || issueKey.trim() === '') {
			throw new Error('Issue key is required and cannot be empty');
		}

		if (
			!worklogId ||
			typeof worklogId !== 'string' ||
			worklogId.trim() === ''
		) {
			throw new Error('Worklog ID is required and cannot be empty');
		}

		const trimmedIssueKey = issueKey.trim();
		if (!/^[a-z]+-\d+$/i.test(trimmedIssueKey)) {
			throw new Error(
				`Invalid issue key format: "${trimmedIssueKey}". Expected format: PROJECT-123 (e.g., DEF-123, ABC-456)`,
			);
		}

		const updateUrl = `${this.baseUrl}/issue/${trimmedIssueKey}/worklog/${worklogId}`;

		this.logger.info('Updating worklog', {
			method: 'PUT',
			url: updateUrl,
			baseUrl: this.baseUrl,
			jiraUrl: this.jiraUrl,
			issueKey: trimmedIssueKey,
			originalIssueKey: issueKey,
			worklogId,
			worklogData,
			timestamp: new Date().toISOString(),
		});

		try {
			const response = await fetch(updateUrl, {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(worklogData),
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error('Failed to update worklog', {
					method: 'PUT',
					url: updateUrl,
					baseUrl: this.baseUrl,
					jiraUrl: this.jiraUrl,
					issueKey: trimmedIssueKey,
					originalIssueKey: issueKey,
					worklogId,
					worklogData,
					status: response.status,
					statusText: response.statusText,
					error: errorText,
					headers: Object.fromEntries(response.headers.entries()),
				});

				if (response.status === 405) {
					throw new Error(
						`HTTP 405 Method Not Allowed - Check your Jira URL configuration.\n` +
							`Expected URL format: https://your-jira-instance.com/\n` +
							`Current URL: ${updateUrl}\n` +
							`Base URL: ${this.baseUrl}\n` +
							`This error often occurs when:\n` +
							`1. The jiraUrl points to the web UI instead of the API endpoint\n` +
							`2. The Jira instance doesn't support REST API v2\n` +
							`3. The URL has incorrect formatting\n\n` +
							`Server response: ${errorText}`,
					);
				}

				throw new Error(`Jira API error: ${response.status} - ${errorText}`);
			}

			this.logger.info('Successfully updated worklog', {
				method: 'PUT',
				url: updateUrl,
				issueKey: trimmedIssueKey,
				originalIssueKey: issueKey,
				worklogId,
				worklogData,
				status: response.status,
				timestamp: new Date().toISOString(),
			});
		} catch (error: unknown) {
			this.logger.error('Error updating worklog', {
				method: 'PUT',
				url: updateUrl,
				issueKey: trimmedIssueKey,
				originalIssueKey: issueKey,
				worklogId,
				worklogData,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async searchIssuesWithWorklogs(jql: string): Promise<JiraSearchResponse> {
		const searchUrl = `${this.baseUrl}/search`;
		const requestData = {
			jql,
			maxResults: 100,
			fields: ['id', 'key', 'summary'],
		};

		this.logger.info('Searching issues with worklogs', {
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
				this.logger.error('Failed to search issues with worklogs', {
					method: 'POST',
					url: searchUrl,
					requestData,
					status: response.status,
					error: errorText,
				});
				throw new Error(`Jira API error: ${response.status} - ${errorText}`);
			}

			const data = (await response.json()) as JiraSearchResponse;
			this.logger.info('Successfully searched issues with worklogs', {
				method: 'POST',
				url: searchUrl,
				requestData,
				status: response.status,
				issueCount: data.issues?.length ?? 0,
				total: data.total,
			});

			return data;
		} catch (error: unknown) {
			this.logger.error('Error searching issues with worklogs', {
				method: 'POST',
				url: searchUrl,
				requestData,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async getCurrentUser(): Promise<{emailAddress: string}> {
		const myselfUrl = `${this.baseUrl}/myself`;

		this.logger.info('Fetching current user', {
			method: 'GET',
			url: myselfUrl,
		});

		try {
			const response = await fetch(myselfUrl, {
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
					Accept: 'application/json',
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error('Failed to fetch current user', {
					method: 'GET',
					url: myselfUrl,
					status: response.status,
					error: errorText,
				});
				throw new Error(`Jira API error: ${response.status} - ${errorText}`);
			}

			const data = (await response.json()) as {emailAddress: string};
			this.logger.info('Successfully fetched current user', {
				method: 'GET',
				url: myselfUrl,
				status: response.status,
				emailAddress: data.emailAddress,
			});

			return data;
		} catch (error: unknown) {
			this.logger.error('Error fetching current user', {
				method: 'GET',
				url: myselfUrl,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async hasWorklogForToday(): Promise<boolean> {
		const today = new Date();
		const todayFormatted =
			today.toISOString().split('T')[0] ?? today.toISOString();

		const jql = `worklogDate = "${todayFormatted}" AND worklogAuthor = currentUser()`;

		this.logger.info('Checking for worklogs today', {
			method: 'POST',
			date: todayFormatted,
			jql,
		});

		try {
			const searchResult = await this.searchIssuesWithWorklogs(jql);
			const hasWorklogs = searchResult.total > 0;

			this.logger.info('Worklog check completed', {
				date: todayFormatted,
				hasWorklogs,
				total: searchResult.total,
			});

			return hasWorklogs;
		} catch (error: unknown) {
			this.logger.error('Error checking worklogs for today', {
				date: todayFormatted,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
