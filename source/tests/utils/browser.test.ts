import process from 'node:process';
import test from 'ava';
import {
	isBrowserOpenSupported,
	generateJiraIssueUrl,
} from '../../utils/browser.js';

test('isBrowserOpenSupported returns true for supported platforms', t => {
	// Explicit test data - expected platforms and results
	const supportedPlatforms = ['darwin', 'win32', 'linux'];
	const currentPlatform = process.platform;

	// Test operation on current platform
	const result = isBrowserOpenSupported();

	// Specific value comparisons based on current platform
	if (supportedPlatforms.includes(currentPlatform)) {
		t.true(
			result,
			`Should return true for supported platform: ${currentPlatform}`,
		);
	} else {
		t.false(
			result,
			`Should return false for unsupported platform: ${currentPlatform}`,
		);
	}
});

test('isBrowserOpenSupported returns false for unsupported platforms', t => {
	// Explicit test data - mock unsupported platform
	const originalPlatform = process.platform;
	const unsupportedPlatform = 'unsupported-os';

	// Mock process.platform temporarily
	Object.defineProperty(process, 'platform', {
		value: unsupportedPlatform,
		configurable: true,
	});

	// Test operation
	const result = isBrowserOpenSupported();

	// Specific value comparison
	t.false(result, 'Should return false for unsupported platform');

	// Restore original platform
	Object.defineProperty(process, 'platform', {
		value: originalPlatform,
		configurable: true,
	});
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
		generateJiraIssueUrl(baseUrl, 'DEF-2457'),
		'https://company.atlassian.net/browse/DEF-2457',
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
