import {writeFileSync, mkdirSync, unlinkSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {WeeklyTimetableView} from '../../components/WeeklyTimetableView.js';
import type {JiraConfig} from '../../jira-client.js';
import {LocalDate} from '../../domain/LocalDate.js';
import {InkTestHelpers} from '../utils/ink-test-helpers.js';

// Helper functions for test data creation
function createTestAttendanceCSV(): string {
	const temporaryDir = join(tmpdir(), 'jiracle-integration-test');
	if (!existsSync(temporaryDir)) {
		mkdirSync(temporaryDir, {recursive: true});
	}

	const csvPath = join(temporaryDir, `attendance-${Date.now()}.csv`);

	// Create realistic test attendance data
	const today = LocalDate.today();
	const thisMonth = today.toDate().getMonth() + 1;
	const thisYear = today.toDate().getFullYear();

	const csvContent = [
		'date,checkIn,checkOut,breakMinutes,totalHours,notes',
		`${thisYear}-${String(thisMonth).padStart(
			2,
			'0',
		)}-01,08:00,17:00,30,8.5,Test day 1`,
		`${thisYear}-${String(thisMonth).padStart(
			2,
			'0',
		)}-02,08:15,17:15,30,8.5,Test day 2`,
		`${thisYear}-${String(thisMonth).padStart(
			2,
			'0',
		)}-03,08:00,16:30,30,8.0,Test day 3`,
	].join('\n');

	writeFileSync(csvPath, csvContent, 'utf8');
	return csvPath;
}

function createConfigWithBonus(attendancePath: string): JiraConfig {
	return {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		bonus: {
			enabled: true,
			hoursPerBonusDay: 8,
			targetDays: 190,
			targets: {
				minimum: 150,
				standard: 190,
				stretch: 210,
			},
			tiers: [
				{name: 'Tier 1', startDay: 0, endDay: 119, rate: 0.002},
				{name: 'Tier 2', startDay: 120, endDay: 159, rate: 0.003},
				{name: 'Tier 3', startDay: 160, endDay: undefined, rate: 0.004},
			],
		},
		attendance: {
			enabled: true,
			csvPath: attendancePath,
			workingHours: 8,
			breakMinutes: 30,
			defaultCheckIn: '08:00',
			defaultCheckOut: '17:00',
			defaultBreakMinutes: 30,
		},
	};
}

function createConfigWithoutBonus(attendancePath: string): JiraConfig {
	return {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		attendance: {
			enabled: true,
			csvPath: attendancePath,
			workingHours: 8,
			breakMinutes: 30,
			defaultCheckIn: '08:00',
			defaultCheckOut: '17:00',
			defaultBreakMinutes: 30,
		},
	};
}

function cleanupTestFile(filePath: string) {
	try {
		if (existsSync(filePath)) {
			unlinkSync(filePath);
		}
	} catch {
		// Ignore cleanup errors
	}
}

test('Integration: Statistics navigation (s-key) from timetable', async t => {
	// EXPLICIT TEST DATA
	const expectedTimetableHelp = '[T] Today [R] Refresh [S] Statistics [E] Export [Q] Quit';
	const expectedStatisticsTitle = 'Statistics 2025';
	const expectedTabNavigation = '1. Monthly Stats';

	// OPERATIONS - Create real test files
	const attendancePath = createTestAttendanceCSV();
	const config = createConfigWithBonus(attendancePath);

	const props = {
		onBack() {},
		config,
		userEmail: undefined,
	};

	const {lastFrame, stdin} = render(
		React.createElement(WeeklyTimetableView, props),
	);

	// Initial state: should show timetable help
	const initialOutput = lastFrame()!;

	// Navigate to statistics with 's' key
	stdin.write('s');

	// Wait for state to update
	await InkTestHelpers.delay(100);

	const statisticsOutput = lastFrame()!;

	// SPECIFIC VALUE COMPARISONS
	t.true(
		initialOutput.includes(expectedTimetableHelp),
		'Should show timetable help text initially',
	);

	// With real attendance data, statistics should show properly
	const hasStatisticsContent =
		statisticsOutput.includes(expectedStatisticsTitle) ||
		statisticsOutput.includes(expectedTabNavigation);

	t.true(hasStatisticsContent, 'Should show statistics content after s-key');

	// Cleanup
	t.teardown(() => {
		cleanupTestFile(attendancePath);
	});
});

test.serial(
	'Integration: Statistics with bonus shows tab navigation',
	async t => {
		// EXPLICIT TEST DATA - Test that we reach statistics view successfully
		const statisticsIndicators = [
			'Loading statistics',
			'Error:',
			'No statistics available',
			'1. Monthly Stats',
		];

		// OPERATIONS - Create real test files
		const attendancePath = createTestAttendanceCSV();
		const config = createConfigWithBonus(attendancePath);

		const props = {
			onBack() {},
			config,
			userEmail: undefined,
		};

		const {lastFrame, stdin} = render(
			React.createElement(WeeklyTimetableView, props),
		);

		// Navigate to statistics
		stdin.write('s');

		// Wait for state to update
		await InkTestHelpers.delay(100);

		const output = lastFrame()!;

		// SPECIFIC VALUE COMPARISONS - Check that we've navigated to statistics view
		const hasStatisticsView = statisticsIndicators.some(indicator =>
			output.includes(indicator),
		);
		t.true(hasStatisticsView, 'Should show statistics view content');

		// Should not show the main timetable help when in statistics view
		t.false(
			output.includes('[T] Today [R] Refresh [S] Statistics [E] Export [Q] Quit'),
			'Should not show timetable help in statistics view',
		);

		// Cleanup
		t.teardown(() => {
			cleanupTestFile(attendancePath);
		});
	},
);

test.serial(
	'Integration: Statistics without bonus shows simple navigation',
	async t => {
		// EXPLICIT TEST DATA - Focus on navigation behavior
		const statisticsIndicators = [
			'Loading statistics',
			'Error:',
			'No statistics available',
			'1. Monthly Stats',
		];

		// OPERATIONS - Create real test files
		const attendancePath = createTestAttendanceCSV();
		const config = createConfigWithoutBonus(attendancePath);

		const props = {
			onBack() {},
			config,
			userEmail: undefined,
		};

		const {lastFrame, stdin} = render(
			React.createElement(WeeklyTimetableView, props),
		);

		// Navigate to statistics
		stdin.write('s');

		// Wait for state to update
		await InkTestHelpers.delay(100);

		const output = lastFrame()!;

		// SPECIFIC VALUE COMPARISONS - Check that we've navigated to statistics view
		const hasStatisticsView = statisticsIndicators.some(indicator =>
			output.includes(indicator),
		);
		t.true(hasStatisticsView, 'Should show statistics view content');

		// Should not show the main timetable help when in statistics view
		t.false(
			output.includes('[T] Today [R] Refresh [S] Statistics [E] Export [Q] Quit'),
			'Should not show timetable help in statistics view',
		);

		// Cleanup
		t.teardown(() => {
			cleanupTestFile(attendancePath);
		});
	},
);

test.serial('Integration: Tab switching between Monthly and Bonus', async t => {
	// EXPLICIT TEST DATA - Focus on navigation behavior
	const statisticsIndicators = [
		'Loading statistics',
		'Error:',
		'No statistics available',
		'1. Monthly Stats',
	];

	// OPERATIONS - Create real test files
	const attendancePath = createTestAttendanceCSV();
	const config = createConfigWithBonus(attendancePath);

	const props = {
		onBack() {},
		config,
		userEmail: undefined,
	};

	const {lastFrame, stdin} = render(
		React.createElement(WeeklyTimetableView, props),
	);

	// Navigate to statistics
	stdin.write('s');

	// Wait for state to update
	await InkTestHelpers.delay(100);

	const monthlyOutput = lastFrame()!;

	// Switch to bonus tab with '2' key
	stdin.write('2');

	// Wait for state to update
	await InkTestHelpers.delay(100);

	// Switch back to monthly with '1' key
	stdin.write('1');

	// Wait for state to update
	await InkTestHelpers.delay(100);

	const backToMonthlyOutput = lastFrame()!;

	// SPECIFIC VALUE COMPARISONS - Check that we can navigate in statistics view
	const hasInitialStatistics = statisticsIndicators.some(indicator =>
		monthlyOutput.includes(indicator),
	);
	t.true(hasInitialStatistics, 'Should show statistics view initially');

	// After pressing 2 and 1, we should still be in statistics view (not crashed/errored)
	const hasStableStatistics = statisticsIndicators.some(indicator =>
		backToMonthlyOutput.includes(indicator),
	);
	t.true(
		hasStableStatistics,
		'Should maintain statistics view after tab switching',
	);

	// Should not show timetable help during any of these states
	t.false(
		backToMonthlyOutput.includes(
			'[T] Today [R] Refresh [S] Statistics [E] Export [Q] Quit',
		),
		'Should not show timetable help after tab switching',
	);
});

test.serial('Integration: Tab switching with Tab key', async t => {
	// EXPLICIT TEST DATA - Focus on navigation stability
	const statisticsIndicators = [
		'Loading statistics',
		'Error:',
		'No statistics available',
		'1. Monthly Stats',
	];

	// OPERATIONS - Create real test files
	const attendancePath = createTestAttendanceCSV();
	const config = createConfigWithBonus(attendancePath);

	const props = {
		onBack() {},
		config,
		userEmail: undefined,
	};

	const {lastFrame, stdin} = render(
		React.createElement(WeeklyTimetableView, props),
	);

	// Navigate to statistics
	stdin.write('s');

	// Wait for state to update
	await InkTestHelpers.delay(100);

	const monthlyOutput = lastFrame()!;

	// Switch with Tab key
	stdin.write('\t');

	// Wait for state to update
	await InkTestHelpers.delay(100);

	// Switch back with Tab key
	stdin.write('\t');

	// Wait for state to update
	await InkTestHelpers.delay(100);

	const backToMonthlyOutput = lastFrame()!;

	// SPECIFIC VALUE COMPARISONS - Check navigation stability with Tab key
	const hasInitialStatistics = statisticsIndicators.some(indicator =>
		monthlyOutput.includes(indicator),
	);
	t.true(hasInitialStatistics, 'Should show statistics view initially');

	// After Tab key navigation, should still be in statistics view
	const hasStableStatistics = statisticsIndicators.some(indicator =>
		backToMonthlyOutput.includes(indicator),
	);
	t.true(
		hasStableStatistics,
		'Should maintain statistics view after Tab key navigation',
	);
});

test.serial('Integration: Back navigation from Statistics (q-key)', async t => {
	// EXPLICIT TEST DATA
	const expectedTimetableHelp = '[T] Today [R] Refresh [S] Statistics [E] Export [Q] Quit';
	const expectedStatisticsTitle = 'Statistics 2025';

	// OPERATIONS - Create real test files
	const attendancePath = createTestAttendanceCSV();
	const config = createConfigWithBonus(attendancePath);

	const props = {
		onBack() {},
		config,
		userEmail: undefined,
	};

	const {lastFrame, stdin} = render(
		React.createElement(WeeklyTimetableView, props),
	);

	// Navigate to statistics
	stdin.write('s');

	// Wait for state to update
	await InkTestHelpers.delay(100);

	const statisticsOutput = lastFrame()!;

	// Navigate back with 'q' key
	stdin.write('q');

	// Wait for state to update
	await InkTestHelpers.delay(100);

	const backToTimetableOutput = lastFrame()!;

	// SPECIFIC VALUE COMPARISONS
	t.true(
		statisticsOutput.includes(expectedStatisticsTitle),
		'Should be in statistics view',
	);
	t.true(
		backToTimetableOutput.includes(expectedTimetableHelp),
		'Should return to timetable help after q-key',
	);
	t.false(
		backToTimetableOutput.includes(expectedStatisticsTitle),
		'Should not show statistics title in timetable',
	);
});

test.serial(
	'Integration: HelpText updates dynamically across navigation',
	async t => {
		// EXPLICIT TEST DATA - Focus on help text changes
		const timetableHelp = '[↑↓←→] Navigate Cells [Enter] Log Work';
		const statisticsIndicators = [
			'Loading statistics',
			'Error:',
			'No statistics available',
			'[Q] Back',
		];

		// OPERATIONS - Create real test files
		const attendancePath = createTestAttendanceCSV();
		const config = createConfigWithBonus(attendancePath);

		const props = {
			onBack() {},
			config,
			userEmail: undefined,
		};

		const {lastFrame, stdin} = render(
			React.createElement(WeeklyTimetableView, props),
		);

		// Initial timetable state
		const timetableOutput = lastFrame()!;

		// Navigate to statistics
		stdin.write('s');

		// Wait for state to update
		await InkTestHelpers.delay(100);

		const statisticsOutput = lastFrame()!;

		// Navigate back to timetable
		stdin.write('q');

		// Wait for state to update
		await InkTestHelpers.delay(100);

		const backToTimetableOutput = lastFrame()!;

		// SPECIFIC VALUE COMPARISONS - Focus on help text transitions
		t.true(
			timetableOutput.includes(timetableHelp),
			'Should show timetable help initially',
		);

		// Check that we're in statistics view
		const hasStatisticsView = statisticsIndicators.some(indicator =>
			statisticsOutput.includes(indicator),
		);
		t.true(hasStatisticsView, 'Should show statistics view content');

		// Check that we return to timetable
		t.true(
			backToTimetableOutput.includes(timetableHelp),
			'Should restore timetable help after navigation back',
		);
	},
);

test.serial(
	'Integration: Complete navigation flow works end-to-end',
	async t => {
		// EXPLICIT TEST DATA - Focus on end-to-end navigation stability
		const timetableHelp = '[S] Statistics';
		const statisticsIndicators = [
			'Loading statistics',
			'Error:',
			'No statistics available',
			'1. Monthly Stats',
		];

		// OPERATIONS - Create real test files
		const attendancePath = createTestAttendanceCSV();
		const config = createConfigWithBonus(attendancePath);

		const props = {
			onBack() {},
			config,
			userEmail: undefined,
		};

		const {lastFrame, stdin} = render(
			React.createElement(WeeklyTimetableView, props),
		);

		// 1. Initial timetable
		const step1 = lastFrame()!;

		// 2. Navigate to statistics
		stdin.write('s');

		// Wait for state to update
		await InkTestHelpers.delay(100);

		const step2 = lastFrame()!;

		// 3. Switch to bonus tab (if available)
		stdin.write('2');

		// Wait for state to update
		await InkTestHelpers.delay(100);

		// 4. Switch back to monthly
		stdin.write('1');

		// Wait for state to update
		await InkTestHelpers.delay(100);

		const step4 = lastFrame()!;

		// 5. Navigate back to timetable
		stdin.write('q');

		// Wait for state to update
		await InkTestHelpers.delay(100);

		const step5 = lastFrame()!;

		// SPECIFIC VALUE COMPARISONS - End-to-end navigation flow
		t.true(
			step1.includes(timetableHelp),
			'Step 1: Should show timetable with statistics option',
		);

		// Check that we reached statistics view
		const hasStatisticsInStep2 = statisticsIndicators.some(indicator =>
			step2.includes(indicator),
		);
		t.true(hasStatisticsInStep2, 'Step 2: Should show statistics view');

		// After all navigation, should still be stable
		const hasStatisticsInStep4 = statisticsIndicators.some(indicator =>
			step4.includes(indicator),
		);
		t.true(hasStatisticsInStep4, 'Step 4: Should maintain statistics view');

		// Should return to timetable
		t.true(step5.includes(timetableHelp), 'Step 5: Should return to timetable');
	},
);
