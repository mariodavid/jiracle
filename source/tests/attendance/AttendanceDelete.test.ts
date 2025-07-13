import test from 'ava';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {writeFileSync} from 'node:fs';
import {AttendanceManager} from '../../attendance/AttendanceManager.js';
import type {JiraConfig} from '../../jira-client.js';

function createTestConfig(): {configPath: string; csvPath: string} {
	const configPath = join(
		tmpdir(),
		`jiracle-attendance-delete-test-${Date.now()}.json`,
	);
	const csvPath = join(
		tmpdir(),
		`attendance-delete-test-${Date.now()}-${Math.random()
			.toString(36)
			.substring(7)}.csv`,
	);

	const config: JiraConfig = {
		jiraUrl: 'https://test.atlassian.net',
		username: 'test@example.com',
		apiToken: 'test-token',
		attendance: {
			enabled: true,
			workingHours: 8,
			breakMinutes: 30,
			defaultCheckIn: '08:00',
			defaultCheckOut: '17:00',
			defaultBreakMinutes: 30,
		},
	};

	writeFileSync(configPath, JSON.stringify(config, null, 2));
	return {configPath, csvPath};
}

test.serial(
	'AttendanceManager deleteAttendance - deletes existing record',
	async t => {
		const {csvPath} = createTestConfig();
		const config = {
			enabled: true,
			workingHours: 8,
			breakMinutes: 30,
			defaultCheckIn: '08:00',
			defaultCheckOut: '17:00',
			defaultBreakMinutes: 30,
		};

		const manager = new AttendanceManager(config, csvPath);

		// Create an attendance record
		await manager.checkIn('2025-07-11', '08:30');
		await manager.checkOut('2025-07-11', '17:30');

		// Verify record exists
		const beforeDelete = await manager.getStatus('2025-07-11');
		t.truthy(beforeDelete.today);

		// Delete the record
		const deleted = await manager.deleteAttendance('2025-07-11');
		t.true(deleted);

		// Verify record is gone
		const afterDelete = await manager.getStatus('2025-07-11');
		t.falsy(afterDelete.today);
	},
);

test.serial(
	'AttendanceManager deleteAttendance - returns false for non-existent record',
	async t => {
		const {csvPath} = createTestConfig();
		const config = {
			enabled: true,
			workingHours: 8,
			breakMinutes: 30,
			defaultCheckIn: '08:00',
			defaultCheckOut: '17:00',
			defaultBreakMinutes: 30,
		};

		const manager = new AttendanceManager(config, csvPath);

		// Try to delete non-existent record
		const deleted = await manager.deleteAttendance('2025-07-11');
		t.false(deleted);
	},
);

test.serial(
	'AttendanceManager deleteAttendance - preserves other records',
	async t => {
		const {csvPath} = createTestConfig();
		const config = {
			enabled: true,
			workingHours: 8,
			breakMinutes: 30,
			defaultCheckIn: '08:00',
			defaultCheckOut: '17:00',
			defaultBreakMinutes: 30,
		};

		const manager = new AttendanceManager(config, csvPath);

		// Create multiple attendance records
		await manager.checkIn('2025-07-11', '08:30');
		await manager.checkOut('2025-07-11', '17:30');

		await manager.checkIn('2025-07-12', '09:00');
		await manager.checkOut('2025-07-12', '18:00');

		// Delete one record
		const deleted = await manager.deleteAttendance('2025-07-11');
		t.true(deleted);

		// Verify first record is gone
		const afterDelete1 = await manager.getStatus('2025-07-11');
		t.falsy(afterDelete1.today);

		// Verify second record still exists
		const afterDelete2 = await manager.getStatus('2025-07-12');
		t.truthy(afterDelete2.today);
		t.is(afterDelete2.today!.checkIn, '09:00');
		t.is(afterDelete2.today!.checkOut, '18:00');
	},
);

test.serial(
	'AttendanceCSVStorage deleteByDate - removes correct record',
	async t => {
		const {csvPath} = createTestConfig();
		const config = {
			enabled: true,
			workingHours: 8,
			breakMinutes: 30,
			defaultCheckIn: '08:00',
			defaultCheckOut: '17:00',
			defaultBreakMinutes: 30,
		};

		const manager = new AttendanceManager(config, csvPath);

		// Create test data
		await manager.checkIn('2025-07-10', '08:00');
		await manager.checkIn('2025-07-11', '08:30');
		await manager.checkIn('2025-07-12', '09:00');

		// Get all records before deletion
		const beforeDelete = await manager.getAllAttendance();
		t.is(beforeDelete.length, 3);

		// Delete middle record
		await manager.deleteAttendance('2025-07-11');

		// Verify only 2 records remain
		const afterDelete = await manager.getAllAttendance();
		t.is(afterDelete.length, 2);

		// Verify correct records remain
		const dates = afterDelete.map(a => a.date);
		t.true(dates.includes('2025-07-10'));
		t.true(dates.includes('2025-07-12'));
		t.false(dates.includes('2025-07-11'));
	},
);

test.serial(
	'AttendanceManager deleteAttendance - handles empty CSV file',
	async t => {
		const {csvPath} = createTestConfig();
		const config = {
			enabled: true,
			workingHours: 8,
			breakMinutes: 30,
			defaultCheckIn: '08:00',
			defaultCheckOut: '17:00',
			defaultBreakMinutes: 30,
		};

		const manager = new AttendanceManager(config, csvPath);

		// Try to delete from empty file
		const deleted = await manager.deleteAttendance('2025-07-11');
		t.false(deleted);

		// Verify still no records
		const allRecords = await manager.getAllAttendance();
		t.is(allRecords.length, 0);
	},
);
