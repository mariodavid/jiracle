import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
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
			key: 'JTS',
			groupId: 'dev',
		},
		{
			key: 'MON',
			groupId: 'monitoring',
		},
	],
	favorites: [
		{
			key: 'GVV-5417',
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
				{issueKey: 'JTS-2456', issueSummary: 'Development task', hours: 6},
				{issueKey: 'MON-1001', issueSummary: 'Monitoring task', hours: 2},
			],
		},
		{
			date: createTestDate(1), // Tuesday
			totalHours: 10,
			issues: [
				{issueKey: 'JTS-2456', issueSummary: 'Development task', hours: 8},
				{issueKey: 'GVV-5417', issueSummary: 'Another dev task', hours: 2},
			],
		},
		{
			date: createTestDate(2), // Wednesday
			totalHours: 12,
			issues: [
				{issueKey: 'GVV-5417', issueSummary: 'Another dev task', hours: 8},
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
			favoriteIssues={[{key: 'GVV-5417'}]}
			config={baseConfig}
		/>,
	);

	const output = lastFrame()!;

	// Should show group labels
	t.true(output.includes('D'), 'Should show first letter of Dev Team group');
	t.true(output.includes('M'), 'Should show first letter of Monitoring group');

	// Should show issues grouped together
	t.true(output.includes('GVV-5417'), 'Should show dev group issue');
	t.true(output.includes('JTS-2456'), 'Should show project-assigned dev issue');
	t.true(output.includes('MON-1001'), 'Should show monitoring group issue');
});

test('TimetableGrid shows group totals with desiredAmount comparison', t => {
	const {lastFrame} = render(
		<TimetableGrid
			data={testData}
			isLoading={false}
			isActive={false}
			favoriteIssues={[{key: 'GVV-5417'}]}
			config={baseConfig}
		/>,
	);

	const output = lastFrame()!;

	// Dev group total: JTS-2456 (14h) + GVV-5417 (10h) = 24h vs 20h desired
	t.true(
		output.includes('24.0/20h'),
		'Should show dev group total with desired amount',
	);
	t.true(output.includes('✓'), 'Should show success indicator for dev group');

	// Monitoring group total: MON-1001 (6h) vs 10h desired
	t.true(
		output.includes('6.0/10h'),
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
	t.true(output.includes('GVV-5417'), 'Should show issue without group');
	t.true(output.includes('JTS-2456'), 'Should show issue without group');
	t.true(output.includes('MON-1001'), 'Should show issue without group');

	// Should not show group indicators at the start of issue lines
	let hasGroupIndicators = false;
	for (const line of lines) {
		if (
			line.includes('GVV-5417') ||
			line.includes('JTS-2456') ||
			line.includes('MON-1001')
		) {
			// Check if line starts with a letter followed by a space (group indicator)
			if (/^[A-Z] /.test(line.trim())) {
				hasGroupIndicators = true;
				break;
			}
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
			favoriteIssues={[{key: 'GVV-5417'}]}
			config={baseConfig}
		/>,
	);

	const output = lastFrame()!;
	const lines = output.split('\n');

	// Find the order of issues in the output
	let gvvIndex = -1;
	let jtsIndex = -1;
	let monIndex = -1;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line && line.includes('GVV-5417')) {
			gvvIndex = i;
		} else if (line && line.includes('JTS-2456')) {
			jtsIndex = i;
		} else if (line && line.includes('MON-1001')) {
			monIndex = i;
		}
	}

	t.true(gvvIndex > 0, 'Should find GVV issue');
	t.true(jtsIndex > 0, 'Should find JTS issue');
	t.true(monIndex > 0, 'Should find MON issue');

	// Dev Team (GVV, JTS) should come before Monitoring (MON)
	t.true(
		gvvIndex < monIndex,
		'Dev group issues should appear before Monitoring',
	);
	t.true(
		jtsIndex < monIndex,
		'Dev group issues should appear before Monitoring',
	);

	// Within Dev group, GVV should come before JTS alphabetically
	t.true(gvvIndex < jtsIndex, 'GVV should appear before JTS within group');
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
			favoriteIssues={[{key: 'GVV-5417'}]}
			config={configNoDesired}
		/>,
	);

	const output = lastFrame()!;

	// Should show simple total without comparison
	t.true(
		output.includes('24.0h'),
		'Should show group total without desired amount comparison',
	);
	t.false(
		output.includes('/'),
		'Should not show desired amount comparison format',
	);
});

test('TimetableGrid shows vertical group labels correctly', t => {
	const {lastFrame} = render(
		<TimetableGrid
			data={testData}
			isLoading={false}
			isActive={false}
			favoriteIssues={[{key: 'GVV-5417'}]}
			config={baseConfig}
		/>,
	);

	const output = lastFrame()!;
	const lines = output.split('\n');

	let foundDevGroupFirstIssue = false;
	let foundMonGroupFirstIssue = false;

	// Look for the group letters in the output
	for (const line of lines) {
		// First issue in dev group should start with 'D'
		if (line.includes('GVV-5417') && /^\s*D\s/.test(line)) {
			foundDevGroupFirstIssue = true;
		}
		// First issue in monitoring group should start with 'M'
		if (line.includes('MON-1001') && /^\s*M\s/.test(line)) {
			foundMonGroupFirstIssue = true;
		}
	}

	t.true(
		foundDevGroupFirstIssue,
		'Should show D at start of first dev group issue line',
	);
	t.true(
		foundMonGroupFirstIssue,
		'Should show M at start of first monitoring group issue line',
	);
});

test('TimetableGrid handles mixed group assignments correctly', t => {
	const mixedConfig: JiraConfig = {
		...baseConfig,
		favorites: [
			{
				key: 'GVV-5417',
				groupId: 'monitoring', // Override project group with issue group
			},
		],
	};

	const {lastFrame} = render(
		<TimetableGrid
			data={testData}
			isLoading={false}
			isActive={false}
			favoriteIssues={[{key: 'GVV-5417'}]}
			config={mixedConfig}
		/>,
	);

	const output = lastFrame()!;
	const lines = output.split('\n');

	// GVV should now appear in monitoring group instead of dev group
	// Find the order of issues to verify GVV is in monitoring group
	let gvvIndex = -1;
	let jtsIndex = -1;
	let monIndex = -1;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line && line.includes('GVV-5417')) {
			gvvIndex = i;
		} else if (line && line.includes('JTS-2456')) {
			jtsIndex = i;
		} else if (line && line.includes('MON-1001')) {
			monIndex = i;
		}
	}

	// GVV should now be closer to MON (both in monitoring group) than to JTS (dev group)
	t.true(gvvIndex > 0, 'Should find GVV issue');
	t.true(jtsIndex > 0, 'Should find JTS issue');
	t.true(monIndex > 0, 'Should find MON issue');

	// Since groups are sorted by name, and within monitoring group GVV should come before MON
	t.true(
		Math.abs(gvvIndex - monIndex) < Math.abs(gvvIndex - jtsIndex),
		'GVV should be closer to MON (same group) than to JTS (different group)',
	);
});
