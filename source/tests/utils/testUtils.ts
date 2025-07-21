import type {JiraIssue, JiraConfig, FavoriteIssue} from '../../jira-client.js';

/**
 * Factory function to create mock JiraIssue objects
 */
export function createMockIssue(overrides: Partial<JiraIssue> = {}): JiraIssue {
	return {
		id: '1',
		key: 'TEST-123',
		fields: {
			summary: 'Test Issue Summary',
			status: {
				name: 'In Progress',
				statusCategory: {name: 'In Progress'},
			},
			issuetype: {
				name: 'Task',
				iconUrl: 'https://example.com/task-icon.png',
			},
			priority: {
				name: 'Medium',
				iconUrl: 'https://example.com/medium-priority.png',
			},
			assignee: {
				displayName: 'Test User',
				emailAddress: 'test@example.com',
			},
			created: '2025-01-01T10:00:00.000+0000',
			updated: '2025-01-09T10:00:00.000+0000',
		},
		...overrides,
	};
}

/**
 * Factory function to create mock JiraConfig objects
 */
export function createMockConfig(
	overrides: Partial<JiraConfig> = {},
): JiraConfig {
	return {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		favorites: [{key: 'TEST-123'}, {key: 'TEST-456'}],
		...overrides,
	};
}

/**
 * Factory function to create mock FavoriteIssue objects
 */
export function createMockFavorite(
	overrides: Partial<FavoriteIssue> = {},
): FavoriteIssue {
	return {
		key: 'FAV-123',
		defaultComment: 'Working on favorite issue',
		...overrides,
	};
}

/**
 * Creates a list of mock issues for testing
 */
export function createMockIssueList(count = 3): JiraIssue[] {
	return Array.from({length: count}, (_, index) =>
		createMockIssue({
			id: String(index + 1),
			key: `TEST-${123 + index}`,
			fields: {
				...createMockIssue().fields,
				summary: `Test Issue ${index + 1}`,
			},
		}),
	);
}

/**
 * Creates a mock config with custom favorites
 */
export function createMockConfigWithFavorites(
	favorites: FavoriteIssue[],
): JiraConfig {
	return createMockConfig({favorites});
}

/**
 * Common assertions for ink-testing-library
 */
export const assertions = {
	/**
	 * Asserts that output contains all given strings
	 */
	containsAll(
		output: string | undefined | undefined,
		texts: string[],
	): boolean {
		if (!output) return false;
		return texts.every(text => output.includes(text));
	},

	/**
	 * Asserts that output contains any of the given strings
	 */
	containsAny(
		output: string | undefined | undefined,
		texts: string[],
	): boolean {
		if (!output) return false;
		return texts.some(text => output.includes(text));
	},

	/**
	 * Asserts that output does not contain any of the given strings
	 */
	containsNone(
		output: string | undefined | undefined,
		texts: string[],
	): boolean {
		if (!output) return true;
		return !texts.some(text => output.includes(text));
	},
};

/**
 * Common test delays
 */
export const delays = {
	SHORT: 100,
	MEDIUM: 500,
	LONG: 1000,
};

/**
 * Mock fetch factory for testing API calls
 */
export function createMockFetch(responses: Record<string, any> = {}) {
	return async (url: string | URL | Request, _init?: RequestInit) => {
		const urlString = String(url);

		// Default responses
		if (urlString.includes('/rest/api/2/search')) {
			return {
				ok: true,
				status: 200,
				json: async () => ({
					issues: createMockIssueList(2),
					total: 2,
					startAt: 0,
					maxResults: 50,
				}),
			} as Response;
		}

		if (urlString.includes('/worklog')) {
			return {
				ok: true,
				status: 201,
				json: async () => ({
					id: '12345',
					author: {
						displayName: 'Test User',
						emailAddress: 'test@example.com',
					},
					created: '2025-01-01T12:00:00.000Z',
					updated: '2025-01-01T12:00:00.000Z',
					started: '2025-01-01T12:00:00.000Z',
					timeSpent: '1h',
					comment: 'Test comment',
				}),
			} as Response;
		}

		// Custom responses
		for (const [pattern, response] of Object.entries(responses)) {
			if (urlString.includes(pattern)) {
				return {
					ok: true,
					status: 200,
					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					json: async () => response,
				} as Response;
			}
		}

		// Default 404
		return {
			ok: false,
			status: 404,
			json: async () => ({error: 'Not found'}),
		} as Response;
	};
}

/**
 * Test constants
 */
export const testConstants = {
	MOCK_DATE: '2025-01-01T12:00:00.000Z',
	MOCK_ISSUE_KEY: 'TEST-123',
	MOCK_TIME_SPENT: '1h',
	MOCK_COMMENT: 'Test comment',
	MOCK_JIRA_URL: 'https://jira.example.com/',
	MOCK_USERNAME: 'test@example.com',
	MOCK_API_TOKEN: 'test-token',
};

/**
 * Hook testing utilities
 */
export const hookTestUtils = {
	/**
	 * Creates a mock JiraConfig for hook testing
	 */
	createHookTestConfig(overrides: Partial<JiraConfig> = {}): JiraConfig {
		return createMockConfig({
			jiraUrl: testConstants.MOCK_JIRA_URL,
			username: testConstants.MOCK_USERNAME,
			apiToken: testConstants.MOCK_API_TOKEN,
			...overrides,
		});
	},

	/**
	 * Creates test date ranges for week-based hooks
	 */
	createTestWeekRange() {
		const weekStart = new Date('2024-01-01'); // Monday
		const weekEnd = new Date('2024-01-07'); // Sunday
		return {weekStart, weekEnd};
	},

	/**
	 * Creates mock favorites for testing
	 */
	createTestFavorites(): FavoriteIssue[] {
		return [
			createMockFavorite({key: 'TEST-1', defaultTime: '2h'}),
			createMockFavorite({key: 'TEST-2', defaultTime: '4h'}),
		];
	},

	/**
	 * Mock implementation for async hook testing
	 */
	createMockAsyncOperation<T>(result: T, delay = 100) {
		return async () =>
			new Promise<T>(resolve => {
				setTimeout(() => {
					resolve(result);
				}, delay);
			});
	},
};
