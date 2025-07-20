import test, {type TestFn} from 'ava';

interface TestContext {
	testCsvPath: string;
}

const testWithContext = test as TestFn<TestContext>;
import {readFile, unlink} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {
	executeCheckIn,
	executeCheckOut,
	executeStatus,
} from '../../cli/attendance-commands.js';

testWithContext.beforeEach(t => {
	// Set unique test CSV path
	const testCsvPath = join(
		tmpdir(),
		`jiracle-test-${Date.now()}-${Math.random().toString(36).substring(7)}.csv`,
	);
	process.env['JIRACLE_ATTENDANCE_CSV_PATH'] = testCsvPath;
	t.context.testCsvPath = testCsvPath;
});

testWithContext.afterEach.always(async t => {
	// Clean up test CSV file
	const csvPath = t.context.testCsvPath as string;
	if (existsSync(csvPath)) {
		await unlink(csvPath);
	}
	delete process.env['JIRACLE_ATTENDANCE_CSV_PATH'];
});

testWithContext('checkin uses current time when no time specified', async t => {
	const configPath = 'source/tests/fixtures/test-config-attendance.json';
	const testDate = '2025-07-15';

	// Get current time before check-in
	const beforeCheckIn = new Date();
	const result = await executeCheckIn(
		{date: testDate},
		configPath,
		t.context.testCsvPath,
	);
	const afterCheckIn = new Date();

	t.true(result.success);
	t.regex(result.message, /✅ Checked in at \d{2}:\d{2}/);

	// Verify CSV content
	const csvPath = t.context.testCsvPath as string;
	t.true(existsSync(csvPath));

	const csvContent = await readFile(csvPath, 'utf8');
	const lines = csvContent.trim().split('\n');
	t.is(lines.length, 2); // Header + 1 data line
	t.is(lines[0], 'Date,CheckIn,CheckOut,BreakMinutes,TotalHours,Notes');

	const dataLine = lines[1]!;
	const [date, checkIn, checkOut, breakMinutes] = dataLine.split(',');

	t.is(date, testDate);
	t.regex(checkIn!, /^\d{2}:\d{2}$/);
	t.is(checkOut, '');
	t.is(breakMinutes, '30');

	// Verify check-in time is within reasonable range (current time ±1 minute)
	const checkInTime = new Date(`2025-07-15T${checkIn}:00`);
	const beforeTime = new Date(
		`2025-07-15T${beforeCheckIn.toTimeString().substring(0, 5)}:00`,
	);
	const afterTime = new Date(
		`2025-07-15T${afterCheckIn.toTimeString().substring(0, 5)}:00`,
	);

	t.true(checkInTime >= new Date(beforeTime.getTime() - 60000)); // -1 minute
	t.true(checkInTime <= new Date(afterTime.getTime() + 60000)); // +1 minute
});

testWithContext(
	'checkout uses current time when no time specified',
	async t => {
		const configPath = 'source/tests/fixtures/test-config-attendance.json';
		const testDate = '2025-07-15';

		// First check in
		await executeCheckIn(
			{date: testDate, time: '08:30'},
			configPath,
			t.context.testCsvPath,
		);

		// Get current time before check-out
		const beforeCheckOut = new Date();
		const result = await executeCheckOut(
			{date: testDate},
			configPath,
			t.context.testCsvPath,
		);
		const afterCheckOut = new Date();

		t.true(result.success);
		t.regex(
			result.message,
			/✅ Checked out at \d{2}:\d{2} \(08:30-\d{2}:\d{2}, [\d.]+h total\)/,
		);

		// Verify CSV content
		const csvPath = t.context.testCsvPath as string;
		const csvContent = await readFile(csvPath, 'utf8');
		const lines = csvContent.trim().split('\n');
		t.is(lines.length, 2); // Header + 1 data line

		const dataLine = lines[1]!;
		const [date, checkIn, checkOut, breakMinutes, totalHours] =
			dataLine.split(',');

		t.is(date, testDate);
		t.is(checkIn, '08:30');
		t.regex(checkOut!, /^\d{2}:\d{2}$/);
		t.is(breakMinutes, '30');
		t.truthy(totalHours);

		// Verify check-out time is within reasonable range (current time ±1 minute)
		const checkOutTime = new Date(`2025-07-15T${checkOut}:00`);
		const beforeTime = new Date(
			`2025-07-15T${beforeCheckOut.toTimeString().substring(0, 5)}:00`,
		);
		const afterTime = new Date(
			`2025-07-15T${afterCheckOut.toTimeString().substring(0, 5)}:00`,
		);

		t.true(checkOutTime >= new Date(beforeTime.getTime() - 60000)); // -1 minute
		t.true(checkOutTime <= new Date(afterTime.getTime() + 60000)); // +1 minute
	},
);

testWithContext('explicit time overrides current time', async t => {
	const configPath = 'source/tests/fixtures/test-config-attendance.json';
	const testDate = '2025-07-15';
	const explicitTime = '09:15';

	const result = await executeCheckIn(
		{date: testDate, time: explicitTime},
		configPath,
		t.context.testCsvPath,
	);

	t.true(result.success);
	t.is(result.message, `✅ Checked in at ${explicitTime}`);

	// Verify CSV content shows explicit time, not current time
	const csvPath = t.context.testCsvPath as string;
	const csvContent = await readFile(csvPath, 'utf8');
	const lines = csvContent.trim().split('\n');
	const dataLine = lines[1]!;
	const [date, checkIn] = dataLine.split(',');

	t.is(date, testDate);
	t.is(checkIn, explicitTime);
});

testWithContext('status shows attendance with current times', async t => {
	const configPath = 'source/tests/fixtures/test-config-attendance.json';
	const testDate = new Date().toISOString().split('T')[0]!; // Today

	// Check in and out with current times
	await executeCheckIn({date: testDate}, configPath, t.context.testCsvPath);
	await executeCheckOut({date: testDate}, configPath, t.context.testCsvPath);

	const result = await executeStatus(
		{date: testDate},
		configPath,
		t.context.testCsvPath,
	);

	t.true(result.success);
	t.regex(
		result.message,
		/Today: \d{2}:\d{2}-\d{2}:\d{2} \([\d.]+h( [\d.]+m)?, Target: 8h\) [✅⚠️-]/,
	);

	// Verify CSV was created and contains data
	const csvPath = t.context.testCsvPath as string;
	t.true(existsSync(csvPath));

	const csvContent = await readFile(csvPath, 'utf8');
	const lines = csvContent.trim().split('\n');
	t.is(lines.length, 2); // Header + 1 data line

	const dataLine = lines[1]!;
	const [date, checkIn, checkOut, breakMinutes, totalHours] =
		dataLine.split(',');

	t.is(date, testDate);
	t.regex(checkIn!, /^\d{2}:\d{2}$/);
	t.regex(checkOut!, /^\d{2}:\d{2}$/);
	t.is(breakMinutes, '30');
	t.truthy(totalHours);
	t.regex(totalHours!, /^\d+(\.\d+)?$/);
});

testWithContext(
	'multiple checkins/checkouts update same CSV entry',
	async t => {
		const configPath = 'source/tests/fixtures/test-config-attendance.json';
		const testDate = '2025-07-15';

		// First check-in
		await executeCheckIn(
			{date: testDate, time: '08:00'},
			configPath,
			t.context.testCsvPath,
		);

		// Second check-in (should update same entry)
		await executeCheckIn(
			{date: testDate, time: '08:30'},
			configPath,
			t.context.testCsvPath,
		);

		// Check-out
		await executeCheckOut(
			{date: testDate, time: '17:00'},
			configPath,
			t.context.testCsvPath,
		);

		// Verify CSV only has one entry for the date
		const csvPath = t.context.testCsvPath as string;
		const csvContent = await readFile(csvPath, 'utf8');
		const lines = csvContent.trim().split('\n');
		t.is(lines.length, 2); // Header + 1 data line

		const dataLine = lines[1]!;
		const [date, checkIn, checkOut, breakMinutes, totalHours] =
			dataLine.split(',');

		t.is(date, testDate);
		t.is(checkIn, '08:30'); // Should be the latest check-in time
		t.is(checkOut, '17:00');
		t.is(breakMinutes, '30');
		t.is(totalHours, '8'); // 8.5 hours - 0.5 hour break = 8 hours
	},
);
