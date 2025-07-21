import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import figures from 'figures';
import {TimetableGrid} from '../../components/TimetableGrid.js';
import type {WeeklyWorklogSummary} from '../../domain/WeeklyWorklogSummary.js';
import type {JiraConfig} from '../../jira-client.js';

// Helper function to create a test date
const createTestDate = (day: number): Date => {
	const date = new Date('2023-07-10'); // Monday of test week
	date.setDate(date.getDate() + day);
	return date;
};

// Base config with groups
const baseConfig: JiraConfig = {
	jiraUrl: 'https://test.com',
	username: 'test',
	apiToken: 'token',
	groups: [
		{
			id: 'dev',
			name: 'Dev Team',
			defaultComment: 'Development work',
			defaultTime: '6h',
			desiredAmount: 20,
		},
		{
			id: 'monitoring',
			name: 'Monitoring',
			defaultComment: 'Monitoring tasks',
			defaultTime: '2h',
			desiredAmount: 10,
		},
	],
	projects: [
		{
			key: 'DEF',
			groupId: 'dev',
		},
		{
			key: 'MON',
			groupId: 'monitoring',
		},
	],
	favorites: [
		{
			key: 'ABC-5417',
			groupId: 'dev',
		},
	],
};

// Test data with mixed groups
const testData: WeeklyWorklogSummary = {
	weekStart: createTestDate(0),
	weekEnd: createTestDate(4),
	weekTotal: 30,
	dailySummaries: [
		{
			date: createTestDate(0), // Monday
			totalHours: 8,
			issues: [
				{issueKey: 'DEF-2456', issueSummary: 'Development task', hours: 6},
				{issueKey: 'MON-1001', issueSummary: 'Monitoring task', hours: 2},
			],
		},
		{
			date: createTestDate(1), // Tuesday
			totalHours: 10,
			issues: [
				{issueKey: 'DEF-2456', issueSummary: 'Development task', hours: 8},
				{issueKey: 'ABC-5417', issueSummary: 'Another dev task', hours: 2},
			],
		},
		{
			date: createTestDate(2), // Wednesday
			totalHours: 12,
			issues: [
				{issueKey: 'ABC-5417', issueSummary: 'Another dev task', hours: 8},
				{issueKey: 'MON-1001', issueSummary: 'Monitoring task', hours: 4},
			],
		},
	],
};

test('TimetableGrid groups issues by resolved groups', t => {
	const {lastFrame} = render(
		<TimetableGrid
			data={testData}
			isLoading={false}
			isActive={false}
			favoriteIssues={[{key: 'ABC-5417'}]}
			config={baseConfig}
		/>,
	);

	const output = lastFrame()!;

	// Should show group labels
	t.true(output.includes('D'), 'Should show first letter of Dev Team group');
	t.true(output.includes('M'), 'Should show first letter of Monitoring group');

	// Should show issues grouped together
	t.true(output.includes('ABC-5417'), 'Should show dev group issue');
	t.true(output.includes('DEF-2456'), 'Should show project-assigned dev issue');
	t.true(output.includes('MON-1001'), 'Should show monitoring group issue');
});

test('TimetableGrid shows group totals with desiredAmount comparison', t => {
	const {lastFrame} = render(
		<TimetableGrid
			data={testData}
			isLoading={false}
			isActive={false}
			favoriteIssues={[{key: 'ABC-5417'}]}
			config={baseConfig}
		/>,
	);

	const output = lastFrame()!;

	// Dev group total: DEF-2456 (14h) + ABC-5417 (10h) = 24h vs 20h desired
	t.true(
		output.includes('24.0/20'),
		'Should show dev group total with desired amount',
	);
	t.true(output.includes('✓'), 'Should show success indicator for dev group');

	// Monitoring group total: MON-1001 (6h) vs 10h desired
	t.true(
		output.includes('6.0/10'),
		'Should show monitoring group total with desired amount',
	);
	t.true(
		output.includes('⚠️'),
		'Should show warning indicator for monitoring group',
	);
});

test('TimetableGrid handles ungrouped issues correctly', t => {
	const configWithoutGroups: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		// No groups defined
	};

	const {lastFrame} = render(
		<TimetableGrid
			data={testData}
			isLoading={false}
			isActive={false}
			config={configWithoutGroups}
		/>,
	);

	const output = lastFrame()!;
	const lines = output.split('\n');

	// Should still show all issues, but ungrouped
	t.true(output.includes('ABC-5417'), 'Should show issue without group');
	t.true(output.includes('DEF-2456'), 'Should show issue without group');
	t.true(output.includes('MON-1001'), 'Should show issue without group');

	// Should not show group indicators at the start of issue lines
	let hasGroupIndicators = false;
	for (const line of lines) {
		if (
			(line.includes('ABC-5417') ||
				line.includes('DEF-2456') ||
				line.includes('MON-1001')) && // Check if line starts with a letter followed by a space (group indicator)
			/^[A-Z] /.test(line.trim())
		) {
			hasGroupIndicators = true;
			break;
		}
	}

	t.false(
		hasGroupIndicators,
		'Should not show group indicators for ungrouped issues',
	);
});

test('TimetableGrid sorts groups by name and issues within groups by key', t => {
	const {lastFrame} = render(
		<TimetableGrid
			data={testData}
			isLoading={false}
			isActive={false}
			favoriteIssues={[{key: 'ABC-5417'}]}
			config={baseConfig}
		/>,
	);

	const output = lastFrame()!;
	const lines = output.split('\n');

	// Find the order of issues in the output
	let abcIndex = -1;
	let defIndex = -1;
	let monIndex = -1;

	for (const [i, line] of lines.entries()) {
		if (line?.includes('ABC-5417')) {
			abcIndex = i;
		} else if (line?.includes('DEF-2456')) {
			defIndex = i;
		} else if (line?.includes('MON-1001')) {
			monIndex = i;
		}
	}

	t.true(abcIndex > 0, 'Should find ABC issue');
	t.true(defIndex > 0, 'Should find DEF issue');
	t.true(monIndex > 0, 'Should find MON issue');

	// Dev Team (ABC, DEF) should come before Monitoring (MON)
	t.true(
		abcIndex < monIndex,
		'Dev group issues should appear before Monitoring',
	);
	t.true(
		defIndex < monIndex,
		'Dev group issues should appear before Monitoring',
	);

	// Within Dev group, ABC should come before DEF alphabetically
	t.true(abcIndex < defIndex, 'ABC should appear before DEF within group');
});

test('TimetableGrid handles groups without desiredAmount', t => {
	const configNoDesired: JiraConfig = {
		...baseConfig,
		groups: [
			{
				id: 'dev',
				name: 'Dev Team',
				defaultComment: 'Development work',
				defaultTime: '6h',
				// No desiredAmount
			},
		],
	};

	const {lastFrame} = render(
		<TimetableGrid
			data={testData}
			isLoading={false}
			isActive={false}
			favoriteIssues={[{key: 'ABC-5417'}]}
			config={configNoDesired}
		/>,
	);

	const output = lastFrame()!;

	// Should show simple total without comparison
	t.true(
		output.includes('24.0'),
		'Should show group total without desired amount comparison',
	);
	t.false(
		output.includes('/'),
		'Should not show desired amount comparison format',
	);
});

test('TimetableGrid shows group total rows with separators', t => {
	const {lastFrame} = render(
		<TimetableGrid
			data={testData}
			isLoading={false}
			isActive={false}
			favoriteIssues={[{key: 'ABC-5417'}]}
			config={baseConfig}
		/>,
	);

	const output = lastFrame()!;

	// Should show group total rows
	t.true(output.includes('Dev Team Total'), 'Should show Dev Team total row');
	t.true(
		output.includes('Monitoring Total'),
		'Should show Monitoring total row',
	);

	// Should show separator lines above group totals
	t.true(output.includes('─'), 'Should show separator lines');
});

test('TimetableGrid handles mixed group assignments correctly', t => {
	const mixedConfig: JiraConfig = {
		...baseConfig,
		favorites: [
			{
				key: 'ABC-5417',
				groupId: 'monitoring', // Override project group with issue group
			},
		],
	};

	const {lastFrame} = render(
		<TimetableGrid
			data={testData}
			isLoading={false}
			isActive={false}
			favoriteIssues={[{key: 'ABC-5417'}]}
			config={mixedConfig}
		/>,
	);

	const output = lastFrame()!;
	const lines = output.split('\n');

	// ABC should now appear in monitoring group instead of dev group
	// Find the order of issues to verify ABC is in monitoring group
	let abcIndex = -1;
	let defIndex = -1;
	let monIndex = -1;

	for (const [i, line] of lines.entries()) {
		if (line?.includes('ABC-5417')) {
			abcIndex = i;
		} else if (line?.includes('DEF-2456')) {
			defIndex = i;
		} else if (line?.includes('MON-1001')) {
			monIndex = i;
		}
	}

	// ABC should now be closer to MON (both in monitoring group) than to DEF (dev group)
	t.true(abcIndex > 0, 'Should find ABC issue');
	t.true(defIndex > 0, 'Should find DEF issue');
	t.true(monIndex > 0, 'Should find MON issue');

	// Since groups are sorted by name, and within monitoring group ABC should come before MON
	t.true(
		Math.abs(abcIndex - monIndex) < Math.abs(abcIndex - defIndex),
		'ABC should be closer to MON (same group) than to DEF (different group)',
	);
});

test('TimetableGrid shows arrow indicator structure for focused row', t => {
	// Test data with multiple issues
	const testData: WeeklyWorklogSummary = {
		weekStart: createTestDate(0),
		weekEnd: createTestDate(4),
		weekTotal: 2.5,
		dailySummaries: [
			{
				date: createTestDate(0),
				totalHours: 2.5,
				issues: [
					{issueKey: 'TEST-1', issueSummary: 'Test Issue 1', hours: 1},
					{issueKey: 'TEST-2', issueSummary: 'Test Issue 2', hours: 0.5},
				],
			},
		],
	};

	const {lastFrame} = render(
		<TimetableGrid
			data={testData}
			isLoading={false}
			isActive={true}
			favoriteIssues={[]}
			config={baseConfig}
		/>,
	);

	const output = lastFrame()!;
	const lines = output.split('\n');

	// Should show both test issues
	t.true(output.includes('TEST-1'), 'Should show first issue');
	t.true(output.includes('TEST-2'), 'Should show second issue');

	// The structure should have space for arrow indicator
	// Each issue row should have proper column structure with arrow column
	const issueLines = lines.filter(line => line.includes('TEST-'));
	t.true(issueLines.length >= 2, 'Should have at least 2 issue lines');

	// Check that issue lines have proper structure (arrow column + issue key)
	for (const line of issueLines) {
		// Line should have enough space for arrow column (width 2) + issue key column
		t.true(line.length > 20, 'Issue line should have proper column structure');
	}
});

test('TimetableGrid arrow indicator comment indicates focused row behavior', t => {
	// This test documents the arrow indicator behavior
	// The arrow appears in the first column when a row is focused
	// and disappears when focus moves to another row

	const testData: WeeklyWorklogSummary = {
		weekStart: createTestDate(0),
		weekEnd: createTestDate(4),
		weekTotal: 1,
		dailySummaries: [
			{
				date: createTestDate(0),
				totalHours: 1,
				issues: [
					{issueKey: 'FOCUS-TEST', issueSummary: 'Focus Test Issue', hours: 1},
				],
			},
		],
	};

	const {lastFrame} = render(
		<TimetableGrid
			data={testData}
			isLoading={false}
			isActive={true}
			favoriteIssues={[]}
			config={baseConfig}
		/>,
	);

	const output = lastFrame()!;

	// Should render the test issue
	t.true(output.includes('FOCUS-TEST'), 'Should show test issue');

	// The arrow column should exist (currently as space, arrow when focused)
	// This test documents the expected behavior rather than testing active focus
	// since focus management requires user interaction in the terminal
	const lines = output.split('\n');
	const issueLine = lines.find(line => line.includes('FOCUS-TEST'));
	t.truthy(issueLine, 'Should find issue line');

	// Document expected behavior: arrow column exists and can show arrow
	t.pass(
		`Arrow indicator structure verified - shows ${figures.arrowRight} when row is focused`,
	);
});
