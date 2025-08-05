import process from 'node:process';
import type winston from 'winston';
import {IssueKey} from '../domain/IssueKey.js';
import type {
	JiraConfig,
	JiraIssue,
	FavoriteIssue,
	JiraSearchResponse,
	JiraSearchRequest,
	JiraSearchRawResponse,
	JiraIssueRawResponse,
	WorklogRequest,
	WorklogResponse,
} from './types.js';
import {getFavoriteKeys} from './utils.js';
import {JiraHttpClient} from './http-client.js';
import {createJiraLogger} from './logger.js';
import {validateConfiguration} from './validation.js';

export class JiraClient {
	readonly jiraUrl: string;
	readonly apiToken: string;
	private readonly logger: winston.Logger;
	private readonly httpClient: JiraHttpClient;

	constructor(config: JiraConfig, customLogger?: winston.Logger) {
		this.jiraUrl = process.env['JIRACLE_JIRA_URL'] ?? config.jiraUrl;
		this.apiToken = process.env['JIRACLE_API_TOKEN'] ?? config.apiToken;
		this.logger = customLogger ?? createJiraLogger();
		this.httpClient = new JiraHttpClient(
			{
				...config,
				jiraUrl: this.jiraUrl,
				apiToken: this.apiToken,
			},
			this.logger,
		);
	}

	get baseUrl(): string {
		const normalizedJiraUrl = this.jiraUrl.endsWith('/')
			? this.jiraUrl
			: `${this.jiraUrl}/`;
		return `${normalizedJiraUrl}rest/api/2`;
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
		const requestData: JiraSearchRequest = {
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

		const rawData = await this.httpClient.post<
			JiraSearchRawResponse,
			JiraSearchRequest
		>('/search', requestData);

		// Transform the raw API response to use IssueKey objects
		const transformedIssues: JiraIssue[] = rawData.issues.map(issue => ({
			...issue,
			key: IssueKey.fromString(issue.key),
		}));

		return transformedIssues;
	}

	async fetchFavoriteIssues(favorites: FavoriteIssue[]): Promise<JiraIssue[]> {
		if (favorites.length === 0) {
			return [];
		}

		const favoriteKeys = getFavoriteKeys(favorites);
		const jql = `key in (${favoriteKeys
			.map(key => `"${key}"`)
			.join(', ')}) AND resolution = Unresolved`;
		const requestData: JiraSearchRequest = {
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

		const rawData = await this.httpClient.post<
			JiraSearchRawResponse,
			JiraSearchRequest
		>('/search', requestData);

		// Transform the raw API response to use IssueKey objects
		const transformedIssues: JiraIssue[] = rawData.issues.map(issue => ({
			...issue,
			key: IssueKey.fromString(issue.key),
		}));

		const sortedIssues = favoriteKeys
			.map(key => transformedIssues.find(issue => issue.key.toString() === key))
			.filter((issue): issue is JiraIssue => issue !== undefined);

		return sortedIssues;
	}

	async fetchIssue(issueKey: string | IssueKey): Promise<JiraIssue> {
		const key = typeof issueKey === 'string' ? issueKey : issueKey.toString();
		const rawIssue = await this.httpClient.get<JiraIssueRawResponse>(
			`/issue/${key}`,
		);

		// Transform the raw API response to use IssueKey objects
		return {
			...rawIssue,
			key: IssueKey.fromString(rawIssue.key),
		};
	}

	async addWorklog(
		issueKey: string | IssueKey,
		worklogData: WorklogRequest,
	): Promise<void> {
		const validation = validateConfiguration({
			jiraUrl: this.jiraUrl,
			apiToken: this.apiToken,
			username: '',
		});
		if (!validation.isValid) {
			throw new Error(`Configuration errors: ${validation.errors.join(', ')}`);
		}

		// Validate and normalize issue key using domain object
		const validatedIssueKey =
			typeof issueKey === 'string' ? IssueKey.fromString(issueKey) : issueKey;

		await this.httpClient.post(
			`/issue/${validatedIssueKey.toString()}/worklog`,
			worklogData,
		);
	}

	async getIssueWorklogs(
		issueKey: string | IssueKey,
	): Promise<WorklogResponse> {
		const key = typeof issueKey === 'string' ? issueKey : issueKey.toString();
		const worklogUrl = `${this.baseUrl}/issue/${key}/worklog`;

		this.logger.info('Fetching issue worklogs', {
			method: 'GET',
			url: worklogUrl,
			issueKey: key,
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
				issueKey: key,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async deleteWorklog(
		issueKey: string | IssueKey,
		worklogId: string,
	): Promise<void> {
		const key = typeof issueKey === 'string' ? issueKey : issueKey.toString();
		const deleteUrl = `${this.baseUrl}/issue/${key}/worklog/${worklogId}`;

		this.logger.info('Deleting worklog', {
			method: 'DELETE',
			url: deleteUrl,
			issueKey: key,
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
					issueKey: key,
					worklogId,
					status: response.status,
					error: errorText,
				});
				throw new Error(`Jira API error: ${response.status} - ${errorText}`);
			}

			this.logger.info('Successfully deleted worklog', {
				method: 'DELETE',
				url: deleteUrl,
				issueKey: key,
				worklogId,
				status: response.status,
			});
		} catch (error: unknown) {
			this.logger.error('Error deleting worklog', {
				method: 'DELETE',
				url: deleteUrl,
				issueKey: key,
				worklogId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	async updateWorklog(
		issueKey: string | IssueKey,
		worklogId: string,
		worklogData: WorklogRequest,
	): Promise<void> {
		const validation = validateConfiguration({
			jiraUrl: this.jiraUrl,
			apiToken: this.apiToken,
			username: '',
		});
		if (!validation.isValid) {
			throw new Error(`Configuration errors: ${validation.errors.join(', ')}`);
		}

		// Validate and normalize issue key using domain object
		const validatedIssueKey =
			typeof issueKey === 'string' ? IssueKey.fromString(issueKey) : issueKey;

		if (
			!worklogId ||
			typeof worklogId !== 'string' ||
			worklogId.trim() === ''
		) {
			throw new Error('Worklog ID is required and cannot be empty');
		}

		await this.httpClient.put(
			`/issue/${validatedIssueKey.toString()}/worklog/${worklogId}`,
			worklogData,
		);
	}

	async searchIssuesWithWorklogs(
		jql: string,
		additionalFields?: string[],
	): Promise<JiraSearchResponse> {
		const searchUrl = `${this.baseUrl}/search`;
		const baseFields = ['id', 'key', 'summary'];
		const fields = additionalFields
			? [...baseFields, ...additionalFields]
			: baseFields;

		const requestData = {
			jql,
			maxResults: 100,
			fields,
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

			const rawData = (await response.json()) as JiraSearchRawResponse;

			// Transform the raw API response to use IssueKey objects
			const data: JiraSearchResponse = {
				...rawData,
				issues: rawData.issues.map(issue => ({
					...issue,
					key: IssueKey.fromString(issue.key),
				})),
			};
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
