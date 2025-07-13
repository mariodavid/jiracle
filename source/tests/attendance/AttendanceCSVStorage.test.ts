import test from 'ava';
import {join} from 'path';
import {tmpdir} from 'os';
import {unlinkSync, existsSync} from 'fs';
import {AttendanceCSVStorage} from '../../attendance/AttendanceCSVStorage.js';
import type {Attendance} from '../../attendance/types.js';

function createTempCSVPath(): string {
	return join(
		tmpdir(),
		`attendance-test-${Date.now()}-${Math.random()
			.toString(36)
			.substring(7)}.csv`,
	);
}

function cleanup(csvPath: string) {
	if (existsSync(csvPath)) {
		unlinkSync(csvPath);
	}
}

test('should create empty array when CSV does not exist', async t => {
	const csvPath = createTempCSVPath();
	const storage = new AttendanceCSVStorage(csvPath);

	const attendances = await storage.readAll();
	t.deepEqual(attendances, []);
});

test('should write and read attendance data', async t => {
	const csvPath = createTempCSVPath();
	const storage = new AttendanceCSVStorage(csvPath);

	const attendance: Attendance = {
		date: '2025-07-12',
		checkIn: '08:00',
		checkOut: '17:00',
		breakMinutes: 30,
		totalHours: 8.5,
		notes: 'Regular day',
	};

	await storage.write([attendance]);
	const attendances = await storage.readAll();

	t.is(attendances.length, 1);
	t.deepEqual(attendances[0], attendance);

	cleanup(csvPath);
});

test('should handle missing optional fields', async t => {
	const csvPath = createTempCSVPath();
	const storage = new AttendanceCSVStorage(csvPath);

	const attendance: Attendance = {
		date: '2025-07-12',
		breakMinutes: 30,
	};

	await storage.write([attendance]);
	const attendances = await storage.readAll();

	t.is(attendances.length, 1);
	t.is(attendances[0]?.date, '2025-07-12');
	t.is(attendances[0]?.breakMinutes, 30);
	t.is(attendances[0]?.checkIn, undefined);
	t.is(attendances[0]?.checkOut, undefined);

	cleanup(csvPath);
});

test('should get attendance by date', async t => {
	const csvPath = createTempCSVPath();
	const storage = new AttendanceCSVStorage(csvPath);

	const attendances: Attendance[] = [
		{
			date: '2025-07-10',
			checkIn: '08:00',
			checkOut: '17:00',
			breakMinutes: 30,
		},
		{
			date: '2025-07-11',
			checkIn: '08:15',
			checkOut: '17:15',
			breakMinutes: 30,
		},
	];

	await storage.write(attendances);

	const result = await storage.getByDate('2025-07-11');
	t.is(result?.date, '2025-07-11');
	t.is(result?.checkIn, '08:15');
	t.is(result?.checkOut, '17:15');
	t.is(result?.breakMinutes, 30);

	const notFound = await storage.getByDate('2025-07-12');
	t.is(notFound, null);

	cleanup(csvPath);
});

test('should get attendances by date range', async t => {
	const csvPath = createTempCSVPath();
	const storage = new AttendanceCSVStorage(csvPath);

	const attendances: Attendance[] = [
		{
			date: '2025-07-08',
			checkIn: '08:00',
			checkOut: '17:00',
			breakMinutes: 30,
		},
		{
			date: '2025-07-09',
			checkIn: '08:00',
			checkOut: '17:00',
			breakMinutes: 30,
		},
		{
			date: '2025-07-10',
			checkIn: '08:00',
			checkOut: '17:00',
			breakMinutes: 30,
		},
		{
			date: '2025-07-11',
			checkIn: '08:00',
			checkOut: '17:00',
			breakMinutes: 30,
		},
		{
			date: '2025-07-12',
			checkIn: '08:00',
			checkOut: '17:00',
			breakMinutes: 30,
		},
	];

	await storage.write(attendances);

	const weekAttendances = await storage.getByDateRange(
		'2025-07-08',
		'2025-07-12',
	);
	t.is(weekAttendances.length, 5);

	const midWeek = await storage.getByDateRange('2025-07-09', '2025-07-11');
	t.is(midWeek.length, 3);

	cleanup(csvPath);
});

test('should upsert attendance data', async t => {
	const csvPath = createTempCSVPath();
	const storage = new AttendanceCSVStorage(csvPath);

	const initial: Attendance = {
		date: '2025-07-12',
		checkIn: '08:00',
		breakMinutes: 30,
	};

	await storage.upsert(initial);
	let result = await storage.getByDate('2025-07-12');
	t.is(result?.date, '2025-07-12');
	t.is(result?.checkIn, '08:00');
	t.is(result?.breakMinutes, 30);
	t.is(result?.checkOut, undefined);

	// Update existing
	const updated: Attendance = {
		date: '2025-07-12',
		checkIn: '08:00',
		checkOut: '17:00',
		breakMinutes: 30,
		totalHours: 8.5,
	};

	await storage.upsert(updated);
	result = await storage.getByDate('2025-07-12');
	t.is(result?.date, '2025-07-12');
	t.is(result?.checkIn, '08:00');
	t.is(result?.checkOut, '17:00');
	t.is(result?.breakMinutes, 30);
	t.is(result?.totalHours, 8.5);

	// Add new
	const newAttendance: Attendance = {
		date: '2025-07-13',
		checkIn: '08:15',
		breakMinutes: 30,
	};

	await storage.upsert(newAttendance);
	const all = await storage.readAll();
	t.is(all.length, 2);

	cleanup(csvPath);
});

test('should sort attendances by date', async t => {
	const csvPath = createTempCSVPath();
	const storage = new AttendanceCSVStorage(csvPath);

	await storage.upsert({
		date: '2025-07-12',
		checkIn: '08:00',
		breakMinutes: 30,
	});

	await storage.upsert({
		date: '2025-07-10',
		checkIn: '08:00',
		breakMinutes: 30,
	});

	await storage.upsert({
		date: '2025-07-11',
		checkIn: '08:00',
		breakMinutes: 30,
	});

	const all = await storage.readAll();
	t.is(all[0]?.date, '2025-07-10');
	t.is(all[1]?.date, '2025-07-11');
	t.is(all[2]?.date, '2025-07-12');

	cleanup(csvPath);
});

test('should create directory if not exists', async t => {
	const csvPath = join(
		tmpdir(),
		'test-subdir',
		`attendance-test-${Date.now()}.csv`,
	);
	const storage = new AttendanceCSVStorage(csvPath);

	const attendance: Attendance = {
		date: '2025-07-12',
		checkIn: '08:00',
		checkOut: '17:00',
		breakMinutes: 30,
	};

	await t.notThrowsAsync(storage.write([attendance]));

	const result = await storage.readAll();
	t.is(result.length, 1);

	cleanup(csvPath);
});
