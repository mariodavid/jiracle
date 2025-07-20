import open from 'open';

/**
 * Opens a URL in the default browser using the `open` package
 * which handles cross-platform browser opening automatically.
 */
export async function openInBrowser(url: string): Promise<void> {
	try {
		await open(url);
	} catch (error) {
		throw new Error(
			`Failed to open browser: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`,
		);
	}
}

/**
 * Checks if the system supports opening URLs in the browser.
 * The `open` package handles platform detection internally,
 * so this always returns true for supported platforms.
 */
export function isBrowserOpenSupported(): boolean {
	// The open package handles macOS (open), Windows (start), and Linux (xdg-open)
	// automatically, so we can assume it's supported on these platforms.
	const {platform} = process;
	return platform === 'darwin' || platform === 'win32' || platform === 'linux';
}

/**
 * Generates a Jira issue URL from the base URL and issue key
 */
export function generateJiraIssueUrl(
	baseUrl: string,
	issueKey: string,
): string {
	// Remove trailing slash from baseUrl if present
	const cleanBaseUrl = baseUrl.replace(/\/$/, '');
	return `${cleanBaseUrl}/browse/${issueKey}`;
}
