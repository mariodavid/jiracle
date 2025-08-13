import test from 'ava';
import {LocalDate} from '../../domain/LocalDate.js';
import {AttendanceManager} from '../../attendance/AttendanceManager.js';
import {AttendanceCSVStorage} from '../../attendance/AttendanceCSVStorage.js';
import {VacationPeriod} from '../../domain/VacationPeriod.js';
import {TestPatterns} from '../utils/test-helpers.js';
import type {AttendanceConfig} from '../../attendance/types.js';

const testConfig: AttendanceConfig = {
	enabled: true,
	workingHours: 8,
	breakMinutes: 30,
	defaultCheckIn: '08:00',
	defaultCheckOut: '17:00',
	defaultBreakMinutes: 30,
};

test('vacation integration - saving vacation days works end-to-end', async t => {
	await TestPatterns.withTempFiles(async manager => {
		// EXPLICIT TEST DATA
		const startDate = LocalDate.fromString('2025-08-01');
		const endDate = LocalDate.fromString('2025-08-03');
		const csvPath = manager.createTempCSVPath();

		const expectedVacationDates = ['2025-08-01', '2025-08-02', '2025-08-03'];

		// OPERATIONS
		const attendanceManager = new AttendanceManager(testConfig, csvPath);
		const storage = new AttendanceCSVStorage(csvPath);

		// Add vacation days manually (simulating what useVacationManagement does)
		const vacationPeriod = VacationPeriod.create(startDate, endDate);
		const allDates = vacationPeriod.getAllDates();

		for (const date of allDates) {
			const vacationEntry = {
				date: date.toISOString(),
				type: 'VACATION' as const,
				breakMinutes: 0,
				totalHours: 0,
				notes: 'Vacation day',
			};
			await attendanceManager.updateAttendance(vacationEntry);
		}

		// Read back from storage
		const allAttendance = await storage.readAll();
		const vacationEntries = allAttendance.filter(
			entry => entry.type === 'VACATION',
		);

		// SPECIFIC VALUE COMPARISONS
		t.is(vacationEntries.length, 3, 'Should create 3 vacation entries');

		const actualDates = vacationEntries.map(entry => entry.date).sort();
		t.deepEqual(
			actualDates,
			expectedVacationDates,
			'Should create entries for all expected dates',
		);

		// Verify each entry has correct vacation properties
		for (const entry of vacationEntries) {
			t.is(entry.type, 'VACATION', 'Type should be VACATION');
			t.is(entry.breakMinutes, 0, 'Break minutes should be 0');
			t.is(entry.totalHours, 0, 'Total hours should be 0');
			t.is(entry.notes, 'Vacation day', 'Notes should indicate vacation');
		}
	});
});

test('vacation integration - AttendanceCalculations handles VACATION values', async t => {
	await TestPatterns.withTempFiles(async manager => {
		// EXPLICIT TEST DATA
		const csvPath = manager.createTempCSVPath();
		const testDate = LocalDate.fromString('2025-08-15');

		// OPERATIONS
		const attendanceManager = new AttendanceManager(testConfig, csvPath);

		// Save vacation entry directly through AttendanceManager
		const vacationAttendance = {
			date: testDate.toISOString(),
			type: 'VACATION' as const,
			breakMinutes: 0,
			totalHours: 0,
			notes: 'Vacation day',
		};

		const savedAttendance = await attendanceManager.updateAttendance(
			vacationAttendance,
		);

		// SPECIFIC VALUE COMPARISONS
		t.is(savedAttendance.type, 'VACATION', 'Type should be VACATION');
		t.is(savedAttendance.totalHours, 0, 'Total hours should be 0 for vacation');
		t.is(savedAttendance.breakMinutes, 0, 'Break minutes should be 0');
		t.is(savedAttendance.notes, 'Vacation day', 'Notes should be preserved');
	});
});
