/**
 * Utility for creating mock Response objects in tests
 * This helper avoids the need for type assertions in every test file
 */

type MockResponseOptions = {
	ok?: boolean;
	status?: number;
	statusText?: string;
	json?: () => Promise<any>;
	text?: () => Promise<string>;
};

/**
 * Creates a mock Response object for testing
 * Uses type assertion internally so individual test files don't need to
 */
export function createMockResponse(
	options: MockResponseOptions = {},
): Response {
	return {
		ok: true,
		status: 200,
		statusText: 'OK',
		...options,
	} as Response;
}
