import type winston from 'winston';
import type {JiraConfig} from './types.js';
import {getBasicAuthHeader} from './utils.js';

// Generic request/response types for better type safety
export type HttpRequestData = Record<string, unknown>;
export type HttpResponse<T = unknown> = T;

export class JiraHttpClient {
	private readonly baseUrl: string;
	private readonly searchUrl: string;
	private readonly username: string;
	private readonly apiToken: string;
	private readonly logger: winston.Logger;

	constructor(config: JiraConfig, logger: winston.Logger) {
		const normalizedJiraUrl = config.jiraUrl.endsWith('/')
			? config.jiraUrl
			: `${config.jiraUrl}/`;
		this.baseUrl = `${normalizedJiraUrl}rest/api/2`;
		// The legacy /rest/api/2/search (and /3/search) endpoints were removed by Atlassian;
		// JQL search now lives at this dedicated v3 endpoint (see changelog CHANGE-2046).
		this.searchUrl = `${normalizedJiraUrl}rest/api/3/search/jql`;
		this.username = config.username;
		this.apiToken = config.apiToken;
		this.logger = logger;
	}

	async get<T>(endpoint: string): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;
		this.logger.info(`GET request to ${url}`);

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: this.getHeaders(),
			});

			return await this.handleResponse<T>(response, url);
		} catch (error: unknown) {
			this.logger.error(`GET request failed for ${url}:`, error);
			throw error;
		}
	}

	async post<T = HttpResponse, D = HttpRequestData>(
		endpoint: string,
		data: D,
	): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;
		this.logger.info(`POST request to ${url}`);

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					...this.getHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			return await this.handleResponse<T>(response, url);
		} catch (error: unknown) {
			this.logger.error(`POST request failed for ${url}:`, error);
			throw error;
		}
	}

	async search<T = HttpResponse, D = HttpRequestData>(data: D): Promise<T> {
		this.logger.info(`POST request to ${this.searchUrl}`);

		try {
			const response = await fetch(this.searchUrl, {
				method: 'POST',
				headers: {
					...this.getHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			return await this.handleResponse<T>(response, this.searchUrl);
		} catch (error: unknown) {
			this.logger.error(`POST request failed for ${this.searchUrl}:`, error);
			throw error;
		}
	}

	async put<T = HttpResponse, D = HttpRequestData>(
		endpoint: string,
		data: D,
	): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;
		this.logger.info(`PUT request to ${url}`);

		try {
			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					...this.getHeaders(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			return await this.handleResponse<T>(response, url);
		} catch (error: unknown) {
			this.logger.error(`PUT request failed for ${url}:`, error);
			throw error;
		}
	}

	async delete(endpoint: string): Promise<void> {
		const url = `${this.baseUrl}${endpoint}`;
		this.logger.info(`DELETE request to ${url}`);

		try {
			const response = await fetch(url, {
				method: 'DELETE',
				headers: this.getHeaders(),
			});

			await this.handleResponse<void>(response, url);
		} catch (error: unknown) {
			this.logger.error(`DELETE request failed for ${url}:`, error);
			throw error;
		}
	}

	private getHeaders(): Record<string, string> {
		return {
			Authorization: getBasicAuthHeader(this.username, this.apiToken),
			Accept: 'application/json',
		};
	}

	private async handleResponse<T>(response: Response, url: string): Promise<T> {
		if (!response.ok) {
			if (response.status === 405) {
				this.logger.error(
					`HTTP 405 Method Not Allowed for ${url}. This usually indicates the Jira instance doesn't support this API endpoint or method.`,
				);
				throw new Error(
					`HTTP 405 Method Not Allowed: Check your Jira URL configuration. Expected format: https://your-jira-instance.com/`,
				);
			}

			const errorText = await response.text();
			this.logger.error(
				`HTTP ${response.status} error for ${url}: ${errorText}`,
			);
			throw new Error(`Jira API error: ${response.status} - ${errorText}`);
		}

		if (response.status === 204) {
			return undefined as T;
		}

		const data = (await response.json()) as T;
		this.logger.info(`Response received from ${url}`);
		return data;
	}
}
