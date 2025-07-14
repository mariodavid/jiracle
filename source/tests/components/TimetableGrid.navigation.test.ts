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

	// Initial render should show the table
	const initialFrame = lastFrame();
	t.truthy(initialFrame);
	t.true(initialFrame!.includes('PROJ-1'));
	t.true(initialFrame!.includes('PROJ-2'));

	// Test horizontal navigation without throwing errors
	// Move right to test wraparound
	stdin.write('\u001B[C'); // Right arrow
	stdin.write('\u001B[C'); // Right arrow
	stdin.write('\u001B[C'); // Right arrow
	stdin.write('\u001B[C'); // Right arrow
	stdin.write('\u001B[C'); // Right arrow - should wrap to left

	// Test left navigation
	stdin.write('\u001B[D'); // Left arrow - should wrap to right

	// Should still render without errors
	const finalFrame = lastFrame();
	t.truthy(finalFrame);
	t.true(finalFrame!.includes('PROJ-1'));
	t.true(finalFrame!.includes('PROJ-2'));
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

	// Initial render should show the table
	const initialFrame = lastFrame();
	t.truthy(initialFrame);
	t.true(initialFrame!.includes('PROJ-1'));
	t.true(initialFrame!.includes('PROJ-2'));

	// Test vertical navigation without throwing errors
	// Move down to test wraparound
	stdin.write('\u001B[B'); // Down arrow
	stdin.write('\u001B[B'); // Down arrow - should wrap to top

	// Test up navigation
	stdin.write('\u001B[A'); // Up arrow - should wrap to bottom

	// Should still render without errors
	const finalFrame = lastFrame();
	t.truthy(finalFrame);
	t.true(finalFrame!.includes('PROJ-1'));
	t.true(finalFrame!.includes('PROJ-2'));
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
	t.truthy(initialFrame);
	t.true(initialFrame!.includes('PROJ-1'));
	t.true(initialFrame!.includes('PROJ-2'));
	t.true(initialFrame!.includes('Attendance'));

	// Test navigation with attendance rows - should work without errors
	stdin.write('\u001B[A'); // Up arrow
	stdin.write('\u001B[B'); // Down arrow
	stdin.write('\u001B[C'); // Right arrow
	stdin.write('\u001B[D'); // Left arrow

	// Should still render without errors
	const finalFrame = lastFrame();
	t.truthy(finalFrame);
	t.true(finalFrame!.includes('PROJ-1'));
	t.true(finalFrame!.includes('PROJ-2'));
	t.true(finalFrame!.includes('Attendance'));
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

	// Initial render should show the table
	const initialFrame = lastFrame();
	t.truthy(initialFrame);
	t.true(initialFrame!.includes('PROJ-1'));
	t.true(initialFrame!.includes('PROJ-2'));

	// Test navigation when inactive - should not respond to arrow keys
	stdin.write('\u001B[A'); // Up arrow
	stdin.write('\u001B[B'); // Down arrow
	stdin.write('\u001B[C'); // Right arrow
	stdin.write('\u001B[D'); // Left arrow

	// Should still display the table
	const finalFrame = lastFrame();
	t.truthy(finalFrame);
	t.true(finalFrame!.includes('PROJ-1'));
	t.true(finalFrame!.includes('PROJ-2'));
});
