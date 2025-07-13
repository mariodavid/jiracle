import test from 'ava';
import {join} from 'path';
import {tmpdir} from 'os';
import {unlinkSync, existsSync} from 'fs';
import {AttendanceManager} from '../../attendance/AttendanceManager.js';
import type {AttendanceConfig} from '../../attendance/types.js';

function createTempCSVPath(): string {
	return join(
		tmpdir(),
		`attendance-manager-test-${Date.now()}-${Math.random()
			.toString(36)
			.substring(7)}.csv`,
	);
}

function cleanup(csvPath: string) {
	if (existsSync(csvPath)) {
		unlinkSync(csvPath);
	}
}

const defaultConfig: AttendanceConfig = {
	enabled: true,
	workingHours: 8,
	breakMinutes: 30,
	defaultCheckIn: '08:00',
	defaultCheckOut: '17:00',
	defaultBreakMinutes: 30,
};

test('should check in with current time', async t => {
	const csvPath = createTempCSVPath();
	const manager = new AttendanceManager(defaultConfig, csvPath);

	// Get current time before check-in
	const beforeCheckIn = new Date();
	const attendance = await manager.checkIn('2025-07-12');
	const afterCheckIn = new Date();

	t.is(attendance.date, '2025-07-12');
	t.regex(attendance.checkIn!, /^\d{2}:\d{2}$/);
	t.is(attendance.breakMinutes, 30);
	t.is(attendance.checkOut, undefined);

	// Verify check-in time is within reasonable range (current time ±1 minute)
	const checkInTime = new Date(`2025-07-12T${attendance.checkIn}:00`);
	const beforeTime = new Date(
		`2025-07-12T${beforeCheckIn.toTimeString().substring(0, 5)}:00`,
	);
	const afterTime = new Date(
		`2025-07-12T${afterCheckIn.toTimeString().substring(0, 5)}:00`,
	);

	t.true(checkInTime >= new Date(beforeTime.getTime() - 60000)); // -1 minute
	t.true(checkInTime <= new Date(afterTime.getTime() + 60000)); // +1 minute

	cleanup(csvPath);
});

test('should check in with custom time', async t => {
	const csvPath = createTempCSVPath();
	const manager = new AttendanceManager(defaultConfig, csvPath);

	const attendance = await manager.checkIn('2025-07-12', '08:30');

	t.is(attendance.date, '2025-07-12');
	t.is(attendance.checkIn, '08:30');
	t.is(attendance.breakMinutes, 30);

	cleanup(csvPath);
});

test('should throw error for invalid check-in time', async t => {
	const csvPath = createTempCSVPath();
	const manager = new AttendanceManager(defaultConfig, csvPath);

	await t.throwsAsync(manager.checkIn('2025-07-12', 'invalid'), {
		message: 'Invalid check-in time format: invalid',
	});

	cleanup(csvPath);
});

test('should check out with current time', async t => {
	const csvPath = createTempCSVPath();
	const manager = new AttendanceManager(defaultConfig, csvPath);

	// Check in first with specific time
	await manager.checkIn('2025-07-12', '08:00');

	// Get current time before check-out
	const beforeCheckOut = new Date();
	const attendance = await manager.checkOut('2025-07-12');
	const afterCheckOut = new Date();

	t.is(attendance.date, '2025-07-12');
	t.is(attendance.checkIn, '08:00');
	t.regex(attendance.checkOut!, /^\d{2}:\d{2}$/);
	t.truthy(attendance.totalHours);

	// Verify check-out time is within reasonable range (current time ±1 minute)
	const checkOutTime = new Date(`2025-07-12T${attendance.checkOut}:00`);
	const beforeTime = new Date(
		`2025-07-12T${beforeCheckOut.toTimeString().substring(0, 5)}:00`,
	);
	const afterTime = new Date(
		`2025-07-12T${afterCheckOut.toTimeString().substring(0, 5)}:00`,
	);

	t.true(checkOutTime >= new Date(beforeTime.getTime() - 60000)); // -1 minute
	t.true(checkOutTime <= new Date(afterTime.getTime() + 60000)); // +1 minute

	cleanup(csvPath);
});

test('should check out with custom time', async t => {
	const csvPath = createTempCSVPath();
	const manager = new AttendanceManager(defaultConfig, csvPath);

	await manager.checkIn('2025-07-12', '08:30');
	const attendance = await manager.checkOut('2025-07-12', '17:30');

	t.is(attendance.checkOut, '17:30');
	t.is(attendance.totalHours, 8.5); // 9 hours - 0.5 break

	cleanup(csvPath);
});

test('should throw error for invalid check-out time', async t => {
	const csvPath = createTempCSVPath();
	const manager = new AttendanceManager(defaultConfig, csvPath);

	await t.throwsAsync(manager.checkOut('2025-07-12', 'invalid'), {
		message: 'Invalid check-out time format: invalid',
	});

	cleanup(csvPath);
});

test('should get status for today', async t => {
	const csvPath = createTempCSVPath();
	const manager = new AttendanceManager(defaultConfig, csvPath);

	// Use fixed times to get predictable status
	await manager.checkIn('2025-07-12', '08:00');
	await manager.checkOut('2025-07-12', '17:00');

	const status = await manager.getStatus('2025-07-12');

	t.is(status.totalHours, 8.5); // 9 hours - 0.5 hour break
	t.is(status.shouldHours, 8);
	t.is(status.difference, 0.5);
	t.true(status.hasCheckedIn);
	t.true(status.hasCheckedOut);

	cleanup(csvPath);
});

test('should get status for day with no attendance', async t => {
	const csvPath = createTempCSVPath();
	const manager = new AttendanceManager(defaultConfig, csvPath);

	const status = await manager.getStatus('2025-07-12');

	t.is(status.today, null);
	t.is(status.totalHours, 0);
	t.is(status.shouldHours, 8);
	t.is(status.difference, -8);
	t.false(status.hasCheckedIn);
	t.false(status.hasCheckedOut);

	cleanup(csvPath);
});

test('should update attendance', async t => {
	const csvPath = createTempCSVPath();
	const manager = new AttendanceManager(defaultConfig, csvPath);

	const updated = await manager.updateAttendance({
		date: '2025-07-12',
		checkIn: '08:15',
		checkOut: '17:15',
		breakMinutes: 45,
	});

	t.is(updated.checkIn, '08:15');
	t.is(updated.checkOut, '17:15');
	t.is(updated.breakMinutes, 45);
	t.is(updated.totalHours, 8.25); // 9 hours - 0.75 break

	cleanup(csvPath);
});

test('should throw error for invalid time in update', async t => {
	const csvPath = createTempCSVPath();
	const manager = new AttendanceManager(defaultConfig, csvPath);

	await t.throwsAsync(
		manager.updateAttendance({
			date: '2025-07-12',
			checkIn: 'invalid',
			breakMinutes: 30,
		}),
		{message: 'Invalid check-in time format: invalid'},
	);

	cleanup(csvPath);
});

test('should get weekly attendance', async t => {
	const csvPath = createTempCSVPath();
	const manager = new AttendanceManager(defaultConfig, csvPath);

	// Add attendance for some days
	await manager.checkIn('2025-07-07', '08:00');
	await manager.checkOut('2025-07-07', '17:00');

	await manager.checkIn('2025-07-08', '08:15');
	await manager.checkOut('2025-07-08', '17:15');

	// Test with a date in that week (Wednesday)
	const weeklyAttendance = await manager.getWeeklyAttendance(
		new Date('2025-07-09'),
	);

	t.true('2025-07-07' in weeklyAttendance);
	t.true('2025-07-08' in weeklyAttendance);
	t.is(weeklyAttendance['2025-07-07']?.checkIn, '08:00');
	t.is(weeklyAttendance['2025-07-08']?.checkIn, '08:15');

	cleanup(csvPath);
});

test('should get weekly totals', async t => {
	const csvPath = createTempCSVPath();
	const manager = new AttendanceManager(defaultConfig, csvPath);

	// Add full week attendance
	await manager.checkIn('2025-07-07', '08:00');
	await manager.checkOut('2025-07-07', '17:00');

	await manager.checkIn('2025-07-08', '08:00');
	await manager.checkOut('2025-07-08', '17:00');

	await manager.checkIn('2025-07-09', '08:00');
	await manager.checkOut('2025-07-09', '16:30');

	const totals = await manager.getWeeklyTotals(new Date('2025-07-09'));

	t.is(totals.totalHours, 25); // 8.5 + 8.5 + 8
	t.is(totals.shouldHours, 24); // 3 days * 8 hours
	t.is(totals.difference, 1);
	t.is(totals.dailyHours['2025-07-07'], 8.5);
	t.is(totals.dailyHours['2025-07-08'], 8.5);
	t.is(totals.dailyHours['2025-07-09'], 8);

	cleanup(csvPath);
});

test('should correct time entries', async t => {
	const csvPath = createTempCSVPath();
	const manager = new AttendanceManager(defaultConfig, csvPath);

	// Initial entry
	await manager.checkIn('2025-07-12', '08:00');
	await manager.checkOut('2025-07-12', '17:00');

	// Correct the times
	const corrected = await manager.correctTime(
		'2025-07-12',
		'08:15', // new check-in
		'17:30', // new check-out
		45, // new break minutes
	);

	t.is(corrected.checkIn, '08:15');
	t.is(corrected.checkOut, '17:30');
	t.is(corrected.breakMinutes, 45);
	t.is(corrected.totalHours, 8.5); // 9.25 hours - 0.75 break

	cleanup(csvPath);
});

test('should check attendance status methods', async t => {
	const csvPath = createTempCSVPath();
	const manager = new AttendanceManager(defaultConfig, csvPath);

	// Mock current date by using a specific date
	const testDate = '2025-07-12';

	// Initially no check-in
	t.false(await manager.hasCheckedInToday()); // This will check actual today

	// Check in for test date
	await manager.checkIn(testDate, '08:00');

	// For test date specifically
	const attendanceAfterCheckIn = await manager.getStatus(testDate);
	t.true(attendanceAfterCheckIn.hasCheckedIn);
	t.false(attendanceAfterCheckIn.hasCheckedOut);

	// Check out
	await manager.checkOut(testDate, '17:00');

	const attendanceAfterCheckOut = await manager.getStatus(testDate);
	t.true(attendanceAfterCheckOut.hasCheckedIn);
	t.true(attendanceAfterCheckOut.hasCheckedOut);

	cleanup(csvPath);
});

test('should format status messages correctly', async t => {
	const csvPath = createTempCSVPath();
	const manager = new AttendanceManager(defaultConfig, csvPath);

	// Test with no attendance
	const emptyStatus = await manager.getStatus('2025-07-12');
	const emptyMessage = manager.formatStatusMessage(emptyStatus);
	t.is(emptyMessage, 'No attendance recorded. Expected: 8h');

	// Test with check-in only
	await manager.checkIn('2025-07-12', '08:00');
	const checkedInStatus = await manager.getStatus('2025-07-12');
	const checkedInMessage = manager.formatStatusMessage(checkedInStatus);
	t.is(checkedInMessage, 'Checked in at 08:00');

	// Test with full day
	await manager.checkOut('2025-07-12', '17:00');
	const fullStatus = await manager.getStatus('2025-07-12');
	const fullMessage = manager.formatStatusMessage(fullStatus);
	t.is(fullMessage, '08:00-17:00 (8h 30m, Target: 8h) +0h 30m ✅');

	cleanup(csvPath);
});

test('should handle config updates', async t => {
	const csvPath = createTempCSVPath();
	const manager = new AttendanceManager(defaultConfig, csvPath);

	const originalConfig = manager.getConfig();
	t.is(originalConfig.workingHours, 8);

	manager.updateConfig({workingHours: 7.5, defaultBreakMinutes: 45});

	const updatedConfig = manager.getConfig();
	t.is(updatedConfig.workingHours, 7.5);
	t.is(updatedConfig.defaultBreakMinutes, 45);
	t.is(updatedConfig.defaultCheckIn, '08:00'); // unchanged

	cleanup(csvPath);
});
