import test from 'ava';
import {
	isBrowserOpenSupported,
	generateJiraIssueUrl,
} from '../../utils/browser.js';

test('isBrowserOpenSupported returns true for supported platforms', t => {
	// The function should always return true for supported platforms
	// as the open package handles platform detection internally
	const result = isBrowserOpenSupported();
	t.is(typeof result, 'boolean');
	// On current platform (macOS/Linux/Windows), this should be true
	if (
		process.platform === 'darwin' ||
		process.platform === 'win32' ||
		process.platform === 'linux'
	) {
		t.true(result);
	}
});

test('generateJiraIssueUrl creates correct URL', t => {
	const baseUrl = 'https://jira.example.com';
	const issueKey = 'PROJECT-123';
	const expected = 'https://jira.example.com/browse/PROJECT-123';

	const result = generateJiraIssueUrl(baseUrl, issueKey);
	t.is(result, expected);
});

test('generateJiraIssueUrl handles trailing slash in baseUrl', t => {
	const baseUrl = 'https://jira.example.com/';
	const issueKey = 'PROJECT-123';
	const expected = 'https://jira.example.com/browse/PROJECT-123';

	const result = generateJiraIssueUrl(baseUrl, issueKey);
	t.is(result, expected);
});

test('generateJiraIssueUrl handles different issue key formats', t => {
	const baseUrl = 'https://company.atlassian.net';

	// Standard format
	t.is(
		generateJiraIssueUrl(baseUrl, 'JTS-2457'),
		'https://company.atlassian.net/browse/JTS-2457',
	);

	// Longer project key
	t.is(
		generateJiraIssueUrl(baseUrl, 'PROJECTNAME-1'),
		'https://company.atlassian.net/browse/PROJECTNAME-1',
	);

	// Larger issue number
	t.is(
		generateJiraIssueUrl(baseUrl, 'ABC-123456'),
		'https://company.atlassian.net/browse/ABC-123456',
	);
});
