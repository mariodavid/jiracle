import test from 'ava';
import {RemainingTimeAlignment} from '../../services/RemainingTimeAlignment.js';
import type {DailyWorklogSummary} from '../../domain/WeeklyWorklogSummary.js';
import type {Attendance} from '../../attendance/types.js';

// Test data factories
const createAttendance = (totalHours: number): Attendance => ({
	date: '2025-07-19',
	checkIn: '09:00',
	checkOut: '17:00',
	breakMinutes: 30,
	totalHours,
});

const createDailySummary = (
	issues: Array<{key: string; hours: number}>,
): DailyWorklogSummary => ({
	date: new Date('2025-07-19'),
	totalHours: issues.reduce((sum, issue) => sum + issue.hours, 0),
	issues: issues.map(issue => ({
		issueKey: issue.key,
		issueSummary: `Summary for ${issue.key}`,
		hours: issue.hours,
		worklogId: `worklog-${issue.key}`,
		comment: `Comment for ${issue.key}`,
	})),
});

test('calculateAlignment - even strategy with positive remainder', t => {
	const attendance = createAttendance(9.0);
	const dailySummary = createDailySummary([
		{key: 'PROJ-1', hours: 6.0},
		{key: 'PROJ-2', hours: 2.0},
	]);

	const result = RemainingTimeAlignment.calculateAlignment(
		attendance,
		dailySummary,
		'even',
	);

	if ('type' in result) {
		t.fail('Should not be an error');
		return;
	}

	t.is(result.updatedIssues.length, 2);
	t.is(result.totalDistributed, 1.0);
	t.is(result.updatedIssues[0]!.issueKey, 'PROJ-1');
	t.is(result.updatedIssues[0]!.oldHours, 6.0);
	t.is(result.updatedIssues[0]!.newHours, 6.5);
	t.is(result.updatedIssues[0]!.diff, 0.5);
	t.is(result.updatedIssues[1]!.issueKey, 'PROJ-2');
	t.is(result.updatedIssues[1]!.oldHours, 2.0);
	t.is(result.updatedIssues[1]!.newHours, 2.5);
	t.is(result.updatedIssues[1]!.diff, 0.5);
	t.true(result.message.includes('1.00h distributed evenly'));
});

test('calculateAlignment - proportional strategy with positive remainder', t => {
	const attendance = createAttendance(9.0);
	const dailySummary = createDailySummary([
		{key: 'PROJ-1', hours: 6.0},
		{key: 'PROJ-2', hours: 2.0},
	]);

	const result = RemainingTimeAlignment.calculateAlignment(
		attendance,
		dailySummary,
		'proportional',
	);

	if ('type' in result) {
		t.fail('Should not be an error');
		return;
	}

	t.is(result.updatedIssues.length, 2);
	t.is(result.totalDistributed, 1.0);
	t.is(result.updatedIssues[0]!.issueKey, 'PROJ-1');
	t.is(result.updatedIssues[0]!.oldHours, 6.0);
	t.is(result.updatedIssues[0]!.newHours, 6.75); // 6 + (6/8 * 1) = 6.75
	t.is(result.updatedIssues[0]!.diff, 0.75);
	t.is(result.updatedIssues[1]!.issueKey, 'PROJ-2');
	t.is(result.updatedIssues[1]!.oldHours, 2.0);
	t.is(result.updatedIssues[1]!.newHours, 2.25); // 2 + (2/8 * 1) = 2.25
	t.is(result.updatedIssues[1]!.diff, 0.25);
	t.true(result.message.includes('1.00h distributed proportionally'));
});

test('calculateAlignment - even strategy with negative remainder', t => {
	const attendance = createAttendance(7.0);
	const dailySummary = createDailySummary([
		{key: 'PROJ-1', hours: 6.0},
		{key: 'PROJ-2', hours: 2.0},
	]);

	const result = RemainingTimeAlignment.calculateAlignment(
		attendance,
		dailySummary,
		'even',
	);

	if ('type' in result) {
		t.fail('Should not be an error');
		return;
	}

	t.is(result.updatedIssues.length, 2);
	t.is(result.totalDistributed, -1.0);
	t.is(result.updatedIssues[0]!.issueKey, 'PROJ-1');
	t.is(result.updatedIssues[0]!.oldHours, 6.0);
	t.is(result.updatedIssues[0]!.newHours, 5.5);
	t.is(result.updatedIssues[0]!.diff, -0.5);
	t.is(result.updatedIssues[1]!.issueKey, 'PROJ-2');
	t.is(result.updatedIssues[1]!.oldHours, 2.0);
	t.is(result.updatedIssues[1]!.newHours, 1.5);
	t.is(result.updatedIssues[1]!.diff, -0.5);
});

test('calculateAlignment - prevents negative hours', t => {
	const attendance = createAttendance(1.0);
	const dailySummary = createDailySummary([
		{key: 'PROJ-1', hours: 6.0},
		{key: 'PROJ-2', hours: 2.0},
	]);

	const result = RemainingTimeAlignment.calculateAlignment(
		attendance,
		dailySummary,
		'even',
	);

	if ('type' in result) {
		t.fail('Should not be an error');
		return;
	}

	// Both issues should have their hours reduced but not go negative
	t.true(result.updatedIssues[0]!.newHours >= 0);
	t.true(result.updatedIssues[1]!.newHours >= 0);
});

test('calculateAlignment - filters out zero-hour issues (no existing worklogs)', t => {
	const attendance = createAttendance(2.0);
	const dailySummary = createDailySummary([
		{key: 'PROJ-1', hours: 0.0},
		{key: 'PROJ-2', hours: 0.0},
	]);

	const result = RemainingTimeAlignment.calculateAlignment(
		attendance,
		dailySummary,
		'proportional',
	);

	t.true('type' in result, 'Should be an error');
	if (!('type' in result)) return;

	// Should return error because no existing worklogs to update
	t.is(result.type, 'no-worklogs');
	t.true(result.message.includes('No existing worklogs found'));
});

test('calculateAlignment - no attendance data', t => {
	const dailySummary = createDailySummary([{key: 'PROJ-1', hours: 6.0}]);

	const result = RemainingTimeAlignment.calculateAlignment(
		null,
		dailySummary,
		'even',
	);

	t.true('type' in result, 'Should be an error');
	if (!('type' in result)) return;

	t.is(result.type, 'no-attendance');
	t.true(result.message.includes('No attendance data'));
});

test('calculateAlignment - no attendance totalHours', t => {
	const attendance: Attendance = {
		date: '2025-07-19',
		checkIn: '09:00',
		checkOut: '17:00',
		breakMinutes: 30,
		// totalHours is undefined
	};
	const dailySummary = createDailySummary([{key: 'PROJ-1', hours: 6.0}]);

	const result = RemainingTimeAlignment.calculateAlignment(
		attendance,
		dailySummary,
		'even',
	);

	t.true('type' in result, 'Should be an error');
	if (!('type' in result)) return;

	t.is(result.type, 'no-attendance');
});

test('calculateAlignment - no worklogs', t => {
	const attendance = createAttendance(8.0);

	const result = RemainingTimeAlignment.calculateAlignment(
		attendance,
		null,
		'even',
	);

	t.true('type' in result, 'Should be an error');
	if (!('type' in result)) return;

	t.is(result.type, 'no-worklogs');
	t.true(result.message.includes('No worklogs found'));
});

test('calculateAlignment - empty worklogs', t => {
	const attendance = createAttendance(8.0);
	const dailySummary = createDailySummary([]);

	const result = RemainingTimeAlignment.calculateAlignment(
		attendance,
		dailySummary,
		'even',
	);

	t.true('type' in result, 'Should be an error');
	if (!('type' in result)) return;

	t.is(result.type, 'no-worklogs');
});

test('calculateAlignment - no remaining time', t => {
	const attendance = createAttendance(8.0);
	const dailySummary = createDailySummary([
		{key: 'PROJ-1', hours: 6.0},
		{key: 'PROJ-2', hours: 2.0},
	]);

	const result = RemainingTimeAlignment.calculateAlignment(
		attendance,
		dailySummary,
		'even',
	);

	t.true('type' in result, 'Should be an error');
	if (!('type' in result)) return;

	t.is(result.type, 'no-remaining');
	t.true(result.message.includes('No remaining time'));
});

test('calculateAlignment - very small remaining time considered zero', t => {
	const attendance = createAttendance(8.005); // 0.005h difference (very small)
	const dailySummary = createDailySummary([
		{key: 'PROJ-1', hours: 6.0},
		{key: 'PROJ-2', hours: 2.0},
	]);

	const result = RemainingTimeAlignment.calculateAlignment(
		attendance,
		dailySummary,
		'even',
	);

	t.true('type' in result, 'Should be an error');
	if (!('type' in result)) return;

	t.is(result.type, 'no-remaining');
});

test('calculateAlignment - single issue gets all remaining time', t => {
	const attendance = createAttendance(9.0);
	const dailySummary = createDailySummary([{key: 'PROJ-1', hours: 8.0}]);

	const result = RemainingTimeAlignment.calculateAlignment(
		attendance,
		dailySummary,
		'even',
	);

	if ('type' in result) {
		t.fail('Should not be an error');
		return;
	}

	t.is(result.updatedIssues.length, 1);
	t.is(result.updatedIssues[0]!.newHours, 9.0);
	t.is(result.updatedIssues[0]!.diff, 1.0);
});

test('calculateAlignment - only updates existing worklogs, ignores zero-hour issues', t => {
	const attendance = createAttendance(10.0);
	const dailySummary = createDailySummary([
		{key: 'PROJ-1', hours: 3.0}, // Has worklog
		{key: 'PROJ-2', hours: 0.0}, // No worklog - should be ignored
		{key: 'PROJ-3', hours: 2.0}, // Has worklog
		{key: 'PROJ-4', hours: 0.0}, // No worklog - should be ignored
	]);

	const result = RemainingTimeAlignment.calculateAlignment(
		attendance,
		dailySummary,
		'even',
	);

	if ('type' in result) {
		t.fail('Should not be an error');
		return;
	}

	// Should only process the 2 issues with existing worklogs
	// 10h attendance - 5h logged = 5h remaining
	// 5h / 2 issues = 2.5h per issue
	t.is(result.updatedIssues.length, 2);
	t.is(result.totalDistributed, 5.0);

	// PROJ-1: 3h + 2.5h = 5.5h
	t.is(result.updatedIssues[0]!.issueKey, 'PROJ-1');
	t.is(result.updatedIssues[0]!.oldHours, 3.0);
	t.is(result.updatedIssues[0]!.newHours, 5.5);
	t.is(result.updatedIssues[0]!.diff, 2.5);

	// PROJ-3: 2h + 2.5h = 4.5h
	t.is(result.updatedIssues[1]!.issueKey, 'PROJ-3');
	t.is(result.updatedIssues[1]!.oldHours, 2.0);
	t.is(result.updatedIssues[1]!.newHours, 4.5);
	t.is(result.updatedIssues[1]!.diff, 2.5);

	t.true(result.message.includes('5.00h distributed evenly across 2 worklogs'));
});

test('calculateAlignment - proportional distribution only uses existing worklogs', t => {
	const attendance = createAttendance(12.0);
	const dailySummary = createDailySummary([
		{key: 'PROJ-1', hours: 6.0}, // Has worklog
		{key: 'PROJ-2', hours: 0.0}, // No worklog - should be ignored
		{key: 'PROJ-3', hours: 2.0}, // Has worklog
	]);

	const result = RemainingTimeAlignment.calculateAlignment(
		attendance,
		dailySummary,
		'proportional',
	);

	if ('type' in result) {
		t.fail('Should not be an error');
		return;
	}

	// Should only process the 2 issues with existing worklogs
	// 12h attendance - 8h logged = 4h remaining
	// PROJ-1 gets 6/8 * 4h = 3h, PROJ-3 gets 2/8 * 4h = 1h
	t.is(result.updatedIssues.length, 2);
	t.is(result.totalDistributed, 4.0);

	// PROJ-1: 6h + 3h = 9h
	t.is(result.updatedIssues[0]!.issueKey, 'PROJ-1');
	t.is(result.updatedIssues[0]!.oldHours, 6.0);
	t.is(result.updatedIssues[0]!.newHours, 9.0);
	t.is(result.updatedIssues[0]!.diff, 3.0);

	// PROJ-3: 2h + 1h = 3h
	t.is(result.updatedIssues[1]!.issueKey, 'PROJ-3');
	t.is(result.updatedIssues[1]!.oldHours, 2.0);
	t.is(result.updatedIssues[1]!.newHours, 3.0);
	t.is(result.updatedIssues[1]!.diff, 1.0);

	t.true(
		result.message.includes(
			'4.00h distributed proportionally across 2 worklogs',
		),
	);
});
