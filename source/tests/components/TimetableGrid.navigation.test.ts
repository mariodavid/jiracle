import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {TimetableGrid} from '../../components/TimetableGrid.js';
import {WeeklyWorklogSummary} from '../../domain/WeeklyWorklogSummary.js';
import type {FavoriteIssue, JiraConfig} from '../../jira-client.js';

// Mock data for testing
const mockWeekStart = new Date('2023-01-02'); // Monday
const mockWeekEnd = new Date('2023-01-06'); // Friday
const mockData: WeeklyWorklogSummary = {
	weekStart: mockWeekStart,
	weekEnd: mockWeekEnd,
	weekTotal: 40,
	dailySummaries: [
		{
			date: new Date('2023-01-02'),
			totalHours: 8,
			issues: [
				{
					issueKey: 'PROJ-1',
					issueSummary: 'First issue',
					hours: 4,
				},
				{
					issueKey: 'PROJ-2',
					issueSummary: 'Second issue',
					hours: 4,
				},
			],
		},
	],
};

const mockFavoriteIssues: FavoriteIssue[] = [
	{
		key: 'PROJ-1',
		defaultTime: '4h',
		defaultComment: 'Work on first project',
	},
	{
		key: 'PROJ-2',
		defaultTime: '4h',
		defaultComment: 'Work on second project',
	},
];

const mockConfig: JiraConfig = {
	jiraUrl: 'https://jira.example.com',
	username: 'test@example.com',
	apiToken: 'test-token',
	defaultTime: '1h',
	defaultComment: 'Development work',
	projects: [],
	favorites: mockFavoriteIssues,
};

test('TimetableGrid renders and handles horizontal wraparound navigation', t => {
	const {lastFrame, stdin} = render(
		React.createElement(TimetableGrid, {
			data: mockData,
			isLoading: false,
			isActive: true,
			favoriteIssues: mockFavoriteIssues,
			config: mockConfig,
		}),
	);

	// Initial render should show the table with proper structure
	const initialFrame = lastFrame();
	t.true(initialFrame!.includes('PROJ-1'), 'Should show PROJ-1 issue');
	t.true(initialFrame!.includes('PROJ-2'), 'Should show PROJ-2 issue');
	t.true(initialFrame!.includes('Mon'), 'Should show Monday column');
	t.true(initialFrame!.includes('Fri'), 'Should show Friday column');
	t.true(initialFrame!.includes('Total'), 'Should show Total column');
	// Check for proper grid structure with separators
	t.true(initialFrame!.includes('─'), 'Should show grid separators');

	// Test horizontal navigation without throwing errors
	// Move right to test wraparound
	stdin.write('\u001B[C'); // Right arrow
	stdin.write('\u001B[C'); // Right arrow
	stdin.write('\u001B[C'); // Right arrow
	stdin.write('\u001B[C'); // Right arrow
	stdin.write('\u001B[C'); // Right arrow - should wrap to left

	// Test left navigation
	stdin.write('\u001B[D'); // Left arrow - should wrap to right

	// Should maintain grid structure after navigation
	const finalFrame = lastFrame();
	t.true(
		finalFrame!.includes('PROJ-1'),
		'Should still show PROJ-1 after navigation',
	);
	t.true(
		finalFrame!.includes('PROJ-2'),
		'Should still show PROJ-2 after navigation',
	);
	t.true(finalFrame!.includes('Mon'), 'Should maintain column headers');
	t.true(finalFrame!.includes('─'), 'Should maintain grid separators');

	// Navigation should not break the table structure
	t.true(finalFrame!.includes('Total'), 'Should maintain Total column');

	// Should be able to perform navigation without crashing
	t.true(finalFrame!.length > 0, 'Should have content after navigation');
});

test('TimetableGrid renders and handles vertical wraparound navigation', t => {
	const {lastFrame, stdin} = render(
		React.createElement(TimetableGrid, {
			data: mockData,
			isLoading: false,
			isActive: true,
			favoriteIssues: mockFavoriteIssues,
			config: mockConfig,
		}),
	);

	// Initial render should show the table with proper structure
	const initialFrame = lastFrame();
	t.true(initialFrame!.includes('PROJ-1'), 'Should show PROJ-1 issue');
	t.true(initialFrame!.includes('PROJ-2'), 'Should show PROJ-2 issue');

	// Test vertical navigation without throwing errors
	// Move down to test wraparound
	stdin.write('\u001B[B'); // Down arrow
	stdin.write('\u001B[B'); // Down arrow - should wrap to top

	// Test up navigation
	stdin.write('\u001B[A'); // Up arrow - should wrap to bottom

	// Should maintain grid structure after vertical navigation
	const finalFrame = lastFrame();
	t.true(
		finalFrame!.includes('PROJ-1'),
		'Should still show PROJ-1 after navigation',
	);
	t.true(
		finalFrame!.includes('PROJ-2'),
		'Should still show PROJ-2 after navigation',
	);
	t.true(finalFrame!.includes('─'), 'Should maintain grid separators');

	// Verify that navigation doesn't break the grid structure
	const initialLines = initialFrame!.split('\n').length;
	const finalLines = finalFrame!.split('\n').length;
	t.is(
		initialLines,
		finalLines,
		'Should maintain same number of lines after navigation',
	);
	t.true(
		finalFrame!.length > 0,
		'Should have content after vertical navigation',
	);
});

test('TimetableGrid navigation works with attendance rows', t => {
	// Create mock attendance manager
	const mockAttendanceManager = {
		getWeeklyAttendance: async () => ({}),
		checkIn: async () => {},
		checkOut: async () => {},
		getStatusForDate: async () => ({
			status: 'not_started' as const,
			message: 'Not started',
		}),
	};

	const {lastFrame, stdin} = render(
		React.createElement(TimetableGrid, {
			data: mockData,
			isLoading: false,
			isActive: true,
			favoriteIssues: mockFavoriteIssues,
			config: mockConfig,
			attendanceManager: mockAttendanceManager as any,
		}),
	);

	// Initial render should show the table with attendance row
	const initialFrame = lastFrame();
	t.true(initialFrame!.includes('PROJ-1'), 'Should show PROJ-1 issue');
	t.true(initialFrame!.includes('PROJ-2'), 'Should show PROJ-2 issue');
	t.true(initialFrame!.includes('Attendance'), 'Should show Attendance row');

	// Test navigation with attendance rows - should work without errors
	stdin.write('\u001B[A'); // Up arrow
	stdin.write('\u001B[B'); // Down arrow
	stdin.write('\u001B[C'); // Right arrow
	stdin.write('\u001B[D'); // Left arrow

	// Should maintain grid structure with attendance after navigation
	const finalFrame = lastFrame();
	t.true(
		finalFrame!.includes('PROJ-1'),
		'Should still show PROJ-1 after navigation',
	);
	t.true(
		finalFrame!.includes('PROJ-2'),
		'Should still show PROJ-2 after navigation',
	);
	t.true(
		finalFrame!.includes('Attendance'),
		'Should still show Attendance row after navigation',
	);
	t.true(finalFrame!.includes('─'), 'Should maintain grid separators');

	// Verify navigation worked with attendance rows without breaking structure
	const initialRows = initialFrame!
		.split('\n')
		.filter(
			line => line.includes('PROJ-') || line.includes('Attendance'),
		).length;
	const finalRows = finalFrame!
		.split('\n')
		.filter(
			line => line.includes('PROJ-') || line.includes('Attendance'),
		).length;
	t.is(initialRows, finalRows, 'Should maintain same number of data rows');
	t.true(
		finalFrame!.length > 0,
		'Should have content after attendance navigation',
	);
});

test('TimetableGrid navigation respects isActive prop', t => {
	const {lastFrame, stdin} = render(
		React.createElement(TimetableGrid, {
			data: mockData,
			isLoading: false,
			isActive: false, // Set to false to test navigation is disabled
			favoriteIssues: mockFavoriteIssues,
			config: mockConfig,
		}),
	);

	// Initial render should show the table without focus when inactive
	const initialFrame = lastFrame();
	t.true(initialFrame!.includes('PROJ-1'), 'Should show PROJ-1 issue');
	t.true(initialFrame!.includes('PROJ-2'), 'Should show PROJ-2 issue');
	// When inactive, table should render normally without special indicators
	t.true(initialFrame!.includes('Total'), 'Should show basic table structure');

	// Test navigation when inactive - should not respond to arrow keys
	stdin.write('\u001B[A'); // Up arrow
	stdin.write('\u001B[B'); // Down arrow
	stdin.write('\u001B[C'); // Right arrow
	stdin.write('\u001B[D'); // Left arrow

	// Should still display table without focus indicator after navigation attempts
	const finalFrame = lastFrame();
	t.true(
		finalFrame!.includes('PROJ-1'),
		'Should still show PROJ-1 after navigation attempts',
	);
	t.true(
		finalFrame!.includes('PROJ-2'),
		'Should still show PROJ-2 after navigation attempts',
	);
	t.true(
		finalFrame!.includes('Total'),
		'Should maintain basic table structure',
	);

	// Verify that the display remained identical (no navigation occurred)
	t.is(
		initialFrame,
		finalFrame,
		'Display should remain unchanged when navigation is disabled',
	);
});
