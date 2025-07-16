export interface Group {
	id: string;
	name: string;
	defaultComment?: string;
	defaultTime?: string;
	desiredAmount?: number;
}

export interface FavoriteIssue {
	key: string;
	alias?: string;
	defaultComment?: string;
	defaultTime?: string;
	groupId?: string;
}

export interface ProjectDefaults {
	key: string;
	groupId?: string;
}

export interface ReminderConfig {
	enabled: boolean;
	times: string[];
	weekdaysOnly: boolean;
}

// Bidirectional sliding window configuration
export interface SlidingWindowConfig {
	past: number;
	future: number;
}

// Utility function to normalize sliding window configuration
export function normalizeSlidingWindowConfig(
	config: JiraConfig,
): SlidingWindowConfig {
	const slidingWindow = config.slidingWindowDays;

	if (!slidingWindow) {
		return {past: 0, future: 0};
	}

	// Only object format supported
	return {
		past: slidingWindow.past,
		future: slidingWindow.future,
	};
}

export interface JiraConfig {
	jiraUrl: string;
	username: string;
	apiToken: string;
	favorites?: FavoriteIssue[];
	projects?: ProjectDefaults[];
	groups?: Group[];
	defaultComment?: string;
	defaultTime?: string;
	workingHoursPerWeek?: number;
	reminders?: ReminderConfig;
	attendance?: AttendanceConfig;
	// Sliding window configuration - only bidirectional object format
	slidingWindowDays?: SlidingWindowConfig;
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
import {Duration} from './utils/Duration.js';
import type {AttendanceConfig} from './attendance/types.js';

export interface WorklogRequest {
	timeSpent: string;
	comment: string;
	started: string;
}

export interface WorklogResponse {
	startAt: number;
	maxResults: number;
	total: number;
	worklogs: WorklogEntry[];
}

export interface WorklogEntry {
	id: string;
	issueId: string;
	author: {
		displayName: string;
		emailAddress: string;
	};
	comment: string;
	started: string;
	timeSpentSeconds: number;
}

export function normalizeTimeFormat(timeString: string): string {
	try {
		// Handle decimal formats with comma - convert comma to dot but preserve decimal format
		const decimalHourMatch = timeString.match(/^(\d+(?:[,]\d+)?)h$/i);
		if (decimalHourMatch) {
			return decimalHourMatch[1]!.replace(',', '.') + 'h';
		}

		const duration = new Duration(timeString);
		const minutes = duration.toMinutes();

		if (minutes <= 0) {
			return '';
		}

		// Convert to Jira format with space (e.g., "2h 30m")
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;

		if (hours > 0 && remainingMinutes > 0) {
			return `${hours}h ${remainingMinutes}m`;
		} else if (hours > 0) {
			return `${hours}h`;
		} else {
			return `${remainingMinutes}m`;
		}
	} catch {
		return '';
	}
}

export function getFavoriteKeys(favorites: FavoriteIssue[]): string[] {
	return favorites.map(fav => fav.key);
}

export function getFavoriteDefaultComment(
	favorites: FavoriteIssue[],
	issueKey: string,
): string | undefined {
	const favorite = favorites.find(fav => fav.key === issueKey);
	return favorite?.defaultComment;
}

export function getFavoriteDefaultTime(
	favorites: FavoriteIssue[],
	issueKey: string,
): string | undefined {
	const favorite = favorites.find(fav => fav.key === issueKey);
	return favorite?.defaultTime;
}

export function extractProjectKey(issueKey: string): string | null {
	// Extract project key from issue key (e.g., "DEF-2457" → "DEF")
	const match = issueKey.match(/^([A-Z]+)-\d+$/);
	return match ? match[1] ?? null : null;
}

export interface ResolvedDefaults {
	comment: string;
	time: string;
	group?: Group;
	source: {
		comment: 'issue' | 'group' | 'global' | 'fallback';
		time: 'issue' | 'group' | 'global' | 'fallback';
	};
}

export function loadConfigWithEnvVars(config: JiraConfig): JiraConfig {
	return {
		...config,
		jiraUrl: process.env['JIRACLE_JIRA_URL'] || config.jiraUrl,
		username: process.env['JIRACLE_USERNAME'] || config.username,
		apiToken: process.env['JIRACLE_API_TOKEN'] || config.apiToken,
	};
}

export function resolveDefaults(
	config: JiraConfig,
	issueKey: string,
): ResolvedDefaults {
	const favorites = config.favorites || [];
	const projects = config.projects || [];
	const groups = config.groups || [];

	// Extract project key from issue key
	const projectKey = extractProjectKey(issueKey);

	// Find issue-specific defaults
	const favorite = favorites.find(fav => fav.key === issueKey);

	// Find project for group lookup
	const projectDefaults = projectKey
		? projects.find(proj => proj.key === projectKey)
		: undefined;

	// Find group defaults (priority: issue group > project group)
	let group: Group | undefined;
	if (favorite?.groupId) {
		group = groups.find(g => g.id === favorite.groupId);
	} else if (projectDefaults?.groupId) {
		group = groups.find(g => g.id === projectDefaults.groupId);
	}

	// Resolve comment with priority: issue → group → global → fallback
	let comment = '';
	let commentSource: 'issue' | 'group' | 'global' | 'fallback' = 'fallback';

	if (favorite?.defaultComment) {
		comment = favorite.defaultComment;
		commentSource = 'issue';
	} else if (group?.defaultComment) {
		comment = group.defaultComment;
		commentSource = 'group';
	} else if (config.defaultComment) {
		comment = config.defaultComment;
		commentSource = 'global';
	} else {
		comment = '';
		commentSource = 'fallback';
	}

	// Resolve time with priority: issue → group → global → fallback
	let time = '1h'; // fallback
	let timeSource: 'issue' | 'group' | 'global' | 'fallback' = 'fallback';

	if (favorite?.defaultTime) {
		time = favorite.defaultTime;
		timeSource = 'issue';
	} else if (group?.defaultTime) {
		time = group.defaultTime;
		timeSource = 'group';
	} else if (config.defaultTime) {
		time = config.defaultTime;
		timeSource = 'global';
	} else {
		time = '1h';
		timeSource = 'fallback';
	}

	return {
		comment,
		time,
		group,
		source: {
			comment: commentSource,
			time: timeSource,
		},
	};
}

export function extractIssueKeyFromInput(input: string): string | null {
	// Trim whitespace
	const trimmed = input.trim();

	if (!trimmed) {
		return null;
	}

	// Check if it's a URL
	if (trimmed.includes('/browse/')) {
		// Extract issue key from URL like https://jira.example.com/browse/DEF-2457
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

	constructor(config: JiraConfig, customLogger?: winston.Logger) {
		// Support environment variables with fallback to config
		this.jiraUrl = process.env['JIRACLE_JIRA_URL'] || config.jiraUrl;
		this.apiToken = process.env['JIRACLE_API_TOKEN'] || config.apiToken;
		// Ensure jiraUrl ends with a slash to avoid double slashes or missing slashes
		const normalizedJiraUrl = this.jiraUrl.endsWith('/')
			? this.jiraUrl
			: `${this.jiraUrl}/`;
		this.baseUrl = `${normalizedJiraUrl}rest/api/2`;

		// Use custom logger if provided, otherwise create default logger
		if (customLogger) {
			this.logger = customLogger;
		} else {
			// Configure Winston logger
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
							process.env['HOME'] || '~',
							'.config',
							'jiracle-requests.log',
						),
						level: 'info',
					}),
					// Only log to console if not in test environment
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

	/**
	 * Validates the Jira URL configuration and provides helpful error messages
	 */
	validateConfiguration(): {isValid: boolean; errors: string[]} {
		const errors: string[] = [];

		if (!this.jiraUrl) {
			errors.push('Jira URL is not configured');
		} else {
			// Check if URL looks like a web UI URL instead of API base
			if (
				this.jiraUrl.includes('/browse/') ||
				this.jiraUrl.includes('/projects/')
			) {
				errors.push(
					`Jira URL appears to be a web UI URL instead of the base URL. Expected: https://your-jira-instance.com/, Got: ${this.jiraUrl}`,
				);
			}

			// Check for common URL formatting issues
			if (!this.jiraUrl.startsWith('http')) {
				errors.push(
					`Jira URL must start with http:// or https://. Got: ${this.jiraUrl}`,
				);
			}
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
		} catch (error) {
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
		// Validate configuration before making the request
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

		// Validate issue key
		if (!issueKey || typeof issueKey !== 'string' || issueKey.trim() === '') {
			throw new Error('Issue key is required and cannot be empty');
		}

		const trimmedIssueKey = issueKey.trim();
		if (!/^[A-Z]+-\d+$/i.test(trimmedIssueKey)) {
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
		} catch (error) {
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
		} catch (error) {
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
		} catch (error) {
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
		// Validate configuration before making the request
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

		// Validate issue key
		if (!issueKey || typeof issueKey !== 'string' || issueKey.trim() === '') {
			throw new Error('Issue key is required and cannot be empty');
		}

		// Validate worklog ID
		if (
			!worklogId ||
			typeof worklogId !== 'string' ||
			worklogId.trim() === ''
		) {
			throw new Error('Worklog ID is required and cannot be empty');
		}

		const trimmedIssueKey = issueKey.trim();
		if (!/^[A-Z]+-\d+$/i.test(trimmedIssueKey)) {
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
		} catch (error) {
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
		} catch (error) {
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
		} catch (error) {
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
		const todayFormatted = today.toISOString().split('T')[0];

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
		} catch (error) {
			this.logger.error('Error checking worklogs for today', {
				date: todayFormatted,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
