import test from 'ava';
import {AttendanceDay} from './AttendanceDay.js';
import {LocalDate} from './LocalDate.js';
import {Time} from './Time.js';
import {Duration} from './Duration.js';

test('AttendanceDay.create creates attendance day with optional times', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const checkInTime = Time.fromString('09:00');
	const checkOutTime = Time.fromString('17:00');

	// Operations
	const attendanceDay = AttendanceDay.create(
		testDate,
		checkInTime,
		checkOutTime,
	);

	// Specific value comparisons
	t.is(attendanceDay.getDate().toISOString(), '2024-01-15');
	t.is(attendanceDay.getCheckIn()?.toString(), '09:00');
	t.is(attendanceDay.getCheckOut()?.toString(), '17:00');
	t.true(attendanceDay.isComplete());
});

test('AttendanceDay.create creates incomplete attendance day without times', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');

	// Operations
	const attendanceDay = AttendanceDay.create(testDate);

	// Specific value comparisons
	t.is(attendanceDay.getDate().toISOString(), '2024-01-15');
	t.is(attendanceDay.getCheckIn(), undefined);
	t.is(attendanceDay.getCheckOut(), undefined);
	t.false(attendanceDay.isComplete());
});

test('AttendanceDay.createWorkDay creates standard work day', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const expectedCheckIn = '09:00';
	const expectedCheckOut = '17:00';
	const expectedWorkingHours = 8;

	// Operations
	const attendanceDay = AttendanceDay.createWorkDay(testDate);

	// Specific value comparisons
	t.is(attendanceDay.getCheckIn()?.toString(), expectedCheckIn);
	t.is(attendanceDay.getCheckOut()?.toString(), expectedCheckOut);
	t.is(attendanceDay.getWorkingHours(), expectedWorkingHours);
	t.true(attendanceDay.isComplete());
});

test('AttendanceDay.createWorkDay creates custom work day', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const customCheckIn = Time.fromString('08:00');
	const customWorkingHours = 6;
	const expectedCheckOut = '14:00';
	const expectedWorkingHours = 6;

	// Operations
	const attendanceDay = AttendanceDay.createWorkDay(
		testDate,
		customCheckIn,
		customWorkingHours,
	);

	// Specific value comparisons
	t.is(attendanceDay.getCheckIn()?.toString(), '08:00');
	t.is(attendanceDay.getCheckOut()?.toString(), expectedCheckOut);
	t.is(attendanceDay.getWorkingHours(), expectedWorkingHours);
});

test('AttendanceDay throws error for invalid check-out before check-in', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const checkInTime = Time.fromString('17:00');
	const checkOutTime = Time.fromString('09:00');
	const expectedErrorMessage = 'Check-out time cannot be before check-in time';

	// Operations & Specific value comparisons
	const error = t.throws(() =>
		AttendanceDay.create(testDate, checkInTime, checkOutTime),
	);
	t.is(error?.message, expectedErrorMessage);
});

test('AttendanceDay.getWorkingDuration calculates working hours correctly', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const checkInTime = Time.fromString('09:00');
	const checkOutTime = Time.fromString('17:30');
	const expectedWorkingMinutes = 510; // 8.5 hours = 510 minutes

	// Operations
	const attendanceDay = AttendanceDay.create(
		testDate,
		checkInTime,
		checkOutTime,
	);
	const workingDuration = attendanceDay.getWorkingDuration();

	// Specific value comparisons
	t.is(workingDuration.toMinutes(), expectedWorkingMinutes);
	t.is(workingDuration.toHours(), 8.5);
});

test('AttendanceDay.getWorkingDuration returns zero for incomplete day', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const checkInTime = Time.fromString('09:00');
	const expectedWorkingMinutes = 0;

	// Operations
	const attendanceDay = AttendanceDay.create(testDate, checkInTime);
	const workingDuration = attendanceDay.getWorkingDuration();

	// Specific value comparisons
	t.is(workingDuration.toMinutes(), expectedWorkingMinutes);
	t.is(workingDuration.toHours(), 0);
});

test('AttendanceDay.addBreak subtracts break time from working duration', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const checkInTime = Time.fromString('09:00');
	const checkOutTime = Time.fromString('17:00');
	const breakDuration = Duration.fromMinutes(60); // 1 hour break
	const expectedWorkingMinutes = 420; // 8 hours - 1 hour = 7 hours = 420 minutes

	// Operations
	const attendanceDay = AttendanceDay.create(
		testDate,
		checkInTime,
		checkOutTime,
	);
	const attendanceDayWithBreak = attendanceDay.addBreak(breakDuration);
	const workingDuration = attendanceDayWithBreak.getWorkingDuration();

	// Specific value comparisons
	t.is(workingDuration.toMinutes(), expectedWorkingMinutes);
	t.is(workingDuration.toHours(), 7);
	t.is(attendanceDayWithBreak.getBreakDuration().toMinutes(), 60);
});

test('AttendanceDay.getTotalDuration includes break time', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const checkInTime = Time.fromString('09:00');
	const checkOutTime = Time.fromString('17:00');
	const expectedTotalMinutes = 480; // 8 hours = 480 minutes

	// Operations
	const attendanceDay = AttendanceDay.create(
		testDate,
		checkInTime,
		checkOutTime,
	);
	const totalDuration = attendanceDay.getTotalDuration();

	// Specific value comparisons
	t.is(totalDuration.toMinutes(), expectedTotalMinutes);
	t.is(totalDuration.toHours(), 8);
});

test('AttendanceDay.updateCheckIn updates check-in time', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const originalCheckIn = Time.fromString('09:00');
	const newCheckIn = Time.fromString('08:30');
	const checkOutTime = Time.fromString('17:00');

	// Operations
	const originalAttendance = AttendanceDay.create(
		testDate,
		originalCheckIn,
		checkOutTime,
	);
	const updatedAttendance = originalAttendance.updateCheckIn(newCheckIn);

	// Specific value comparisons
	t.is(updatedAttendance.getCheckIn()?.toString(), '08:30');
	t.is(updatedAttendance.getCheckOut()?.toString(), '17:00');
	t.is(updatedAttendance.getWorkingHours(), 8.5);
});

test('AttendanceDay.updateCheckOut updates check-out time', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const checkInTime = Time.fromString('09:00');
	const originalCheckOut = Time.fromString('17:00');
	const newCheckOut = Time.fromString('18:00');

	// Operations
	const originalAttendance = AttendanceDay.create(
		testDate,
		checkInTime,
		originalCheckOut,
	);
	const updatedAttendance = originalAttendance.updateCheckOut(newCheckOut);

	// Specific value comparisons
	t.is(updatedAttendance.getCheckIn()?.toString(), '09:00');
	t.is(updatedAttendance.getCheckOut()?.toString(), '18:00');
	t.is(updatedAttendance.getWorkingHours(), 9);
});

test('AttendanceDay.isFullWorkingDay checks for full working day', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const checkInTime = Time.fromString('09:00');
	const fullDayCheckOut = Time.fromString('17:00'); // 8 hours
	const shortDayCheckOut = Time.fromString('15:00'); // 6 hours

	// Operations
	const fullWorkDay = AttendanceDay.create(
		testDate,
		checkInTime,
		fullDayCheckOut,
	);
	const shortWorkDay = AttendanceDay.create(
		testDate,
		checkInTime,
		shortDayCheckOut,
	);

	// Specific value comparisons
	t.true(fullWorkDay.isFullWorkingDay());
	t.false(shortWorkDay.isFullWorkingDay());
	t.true(shortWorkDay.isFullWorkingDay(6)); // Custom minimum hours
});

test('AttendanceDay.hasOvertime detects overtime', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const checkInTime = Time.fromString('09:00');
	const overtimeCheckOut = Time.fromString('18:00'); // 9 hours
	const standardCheckOut = Time.fromString('17:00'); // 8 hours

	// Operations
	const overtimeDay = AttendanceDay.create(
		testDate,
		checkInTime,
		overtimeCheckOut,
	);
	const standardDay = AttendanceDay.create(
		testDate,
		checkInTime,
		standardCheckOut,
	);

	// Specific value comparisons
	t.true(overtimeDay.hasOvertime());
	t.false(standardDay.hasOvertime());
});

test('AttendanceDay.getOvertimeDuration calculates overtime correctly', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const checkInTime = Time.fromString('09:00');
	const overtimeCheckOut = Time.fromString('19:00'); // 10 hours
	const expectedOvertimeMinutes = 120; // 2 hours = 120 minutes

	// Operations
	const overtimeDay = AttendanceDay.create(
		testDate,
		checkInTime,
		overtimeCheckOut,
	);
	const overtimeDuration = overtimeDay.getOvertimeDuration();

	// Specific value comparisons
	t.is(overtimeDuration.toMinutes(), expectedOvertimeMinutes);
	t.is(overtimeDuration.toHours(), 2);
});

test('AttendanceDay.equals compares attendance days correctly', t => {
	// Explicit test data
	const date1 = LocalDate.fromString('2024-01-15');
	const date2 = LocalDate.fromString('2024-01-15');
	const date3 = LocalDate.fromString('2024-01-16');
	const checkInTime = Time.fromString('09:00');
	const checkOutTime = Time.fromString('17:00');

	// Operations
	const attendance1 = AttendanceDay.create(date1, checkInTime, checkOutTime);
	const attendance2 = AttendanceDay.create(date2, checkInTime, checkOutTime);
	const attendance3 = AttendanceDay.create(date3, checkInTime, checkOutTime);

	// Specific value comparisons
	t.true(attendance1.equals(attendance2));
	t.false(attendance1.equals(attendance3));
});

test('AttendanceDay.toString formats display string correctly', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const checkInTime = Time.fromString('09:00');
	const checkOutTime = Time.fromString('17:30');
	const expectedString = '2024-01-15: 09:00 - 17:30 (8h30m)';

	// Operations
	const attendanceDay = AttendanceDay.create(
		testDate,
		checkInTime,
		checkOutTime,
	);
	const displayString = attendanceDay.toString();

	// Specific value comparisons
	t.is(displayString, expectedString);
});

test('AttendanceDay.toString handles incomplete day', t => {
	// Explicit test data
	const testDate = LocalDate.fromString('2024-01-15');
	const checkInTime = Time.fromString('09:00');
	const expectedString = '2024-01-15: 09:00 - --:-- (0m)';

	// Operations
	const incompleteDay = AttendanceDay.create(testDate, checkInTime);
	const displayString = incompleteDay.toString();

	// Specific value comparisons
	t.is(displayString, expectedString);
});
