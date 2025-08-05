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
			targetAmount: 10_000,
			currency: 'EUR',
			targets: {
				minimum: {days: 150, label: 'Minimum', percentage: 79},
				standard: {days: 190, label: 'Standard', percentage: 100},
				stretch: {days: 210, label: 'Stretch', percentage: 128},
				maximum: {days: 230, label: 'Maximum', percentage: 148},
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

function cleanupTestFile(filePath: string) {
	try {
		if (existsSync(filePath)) {
			unlinkSync(filePath);
		}
	} catch {
		// Ignore cleanup errors
	}
}

test('Integration: Basic statistics navigation works', t => {
	// EXPLICIT TEST DATA
	const expectedTimetableHelp = '[S] Statistics';
	const expectedStatisticsContent = 'Statistics';

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

	// Initial state: should show timetable
	const initialOutput = lastFrame()!;

	// Navigate to statistics with 's' key
	stdin.write('s');
	const statisticsOutput = lastFrame()!;

	// Navigate back with 'q' key
	stdin.write('q');
	const backOutput = lastFrame()!;

	// SPECIFIC VALUE COMPARISONS
	t.true(
		initialOutput.includes(expectedTimetableHelp),
		'Should show timetable with statistics option',
	);
	t.true(
		statisticsOutput.includes(expectedStatisticsContent),
		'Should show statistics content after s-key',
	);
	t.true(
		backOutput.includes(expectedTimetableHelp),
		'Should return to timetable after q-key',
	);

	// Cleanup
	t.teardown(() => {
		cleanupTestFile(attendancePath);
	});
});

test('Integration: HelpText updates correctly', async t => {
	// EXPLICIT TEST DATA
	const expectedTimetableHelp = '[↑↓←→] Navigate Cells';
	const expectedStatisticsHelp = '[Q] Back';

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

	// Wait longer for state to update
	await InkTestHelpers.delay(300);

	const backToTimetableOutput = lastFrame()!;

	// SPECIFIC VALUE COMPARISONS
	t.true(
		timetableOutput.includes(expectedTimetableHelp),
		'Should show timetable help initially',
	);
	t.true(
		statisticsOutput.includes(expectedStatisticsHelp),
		'Should show statistics help in statistics view',
	);
	t.true(
		backToTimetableOutput.includes(expectedTimetableHelp),
		'Should restore timetable help after navigation back',
	);

	// Cleanup
	t.teardown(() => {
		cleanupTestFile(attendancePath);
	});
});
