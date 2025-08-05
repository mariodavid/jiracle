import test from 'ava';
import {YearlyStatistics} from '../use-cases/StatisticsUseCase.js';
import {formatStatisticsTable} from './statistics-formatter.js';

test('formatStatisticsTable displays yearly statistics with explicit test data', t => {
	const testYear = 2024;
	const testMonthlyStats = [
		{month: 'January', worklogDays: 15, attendanceDays: 18},
		{month: 'February', worklogDays: 12, attendanceDays: 16},
		{month: 'March', worklogDays: 20, attendanceDays: 22},
		{month: 'April', worklogDays: 0, attendanceDays: 0},
		{month: 'May', worklogDays: 0, attendanceDays: 0},
		{month: 'June', worklogDays: 0, attendanceDays: 0},
		{month: 'July', worklogDays: 0, attendanceDays: 0},
		{month: 'August', worklogDays: 0, attendanceDays: 0},
		{month: 'September', worklogDays: 0, attendanceDays: 0},
		{month: 'October', worklogDays: 0, attendanceDays: 0},
		{month: 'November', worklogDays: 0, attendanceDays: 0},
		{month: 'December', worklogDays: 0, attendanceDays: 0},
	];
	const expectedTotalWorklogDays = 47;
	const expectedTotalAttendanceDays = 56;

	const input = YearlyStatistics.create({
		year: testYear,
		monthlyStats: testMonthlyStats,
		totalWorklogDays: expectedTotalWorklogDays,
		totalAttendanceDays: expectedTotalAttendanceDays,
	});

	const expectedHeader = 'Month        | Worklog Days | Attendance Days';
	const expectedSeparator = '-------------|--------------|----------------';
	const expectedJanuaryRow = 'January      |          15 |             18';
	const expectedFebruaryRow = 'February     |          12 |             16';
	const expectedMarchRow = 'March        |          20 |             22';
	const expectedTotalRow = 'Total        |          47 |             56';

	const result = formatStatisticsTable(input);

	t.true(result.includes(expectedHeader));
	t.true(result.includes(expectedSeparator));
	t.true(result.includes(expectedJanuaryRow));
	t.true(result.includes(expectedFebruaryRow));
	t.true(result.includes(expectedMarchRow));
	t.true(result.includes(expectedTotalRow));
});

test('formatStatisticsTable handles zero values with explicit test data', t => {
	const testYear = 2024;
	const testMonthlyStats = [
		{month: 'January', worklogDays: 0, attendanceDays: 0},
		{month: 'February', worklogDays: 0, attendanceDays: 0},
		{month: 'March', worklogDays: 0, attendanceDays: 0},
		{month: 'April', worklogDays: 0, attendanceDays: 0},
		{month: 'May', worklogDays: 0, attendanceDays: 0},
		{month: 'June', worklogDays: 0, attendanceDays: 0},
		{month: 'July', worklogDays: 0, attendanceDays: 0},
		{month: 'August', worklogDays: 0, attendanceDays: 0},
		{month: 'September', worklogDays: 0, attendanceDays: 0},
		{month: 'October', worklogDays: 0, attendanceDays: 0},
		{month: 'November', worklogDays: 0, attendanceDays: 0},
		{month: 'December', worklogDays: 0, attendanceDays: 0},
	];
	const expectedTotalWorklogDays = 0;
	const expectedTotalAttendanceDays = 0;

	const input = YearlyStatistics.create({
		year: testYear,
		monthlyStats: testMonthlyStats,
		totalWorklogDays: expectedTotalWorklogDays,
		totalAttendanceDays: expectedTotalAttendanceDays,
	});

	const expectedJanuaryRow = 'January      |           0 |              0';
	const expectedTotalRow = 'Total        |           0 |              0';

	const result = formatStatisticsTable(input);

	t.true(result.includes(expectedJanuaryRow));
	t.true(result.includes(expectedTotalRow));
});

test('formatStatisticsTable handles large numbers with explicit test data', t => {
	const testYear = 2024;
	const testMonthlyStats = [
		{month: 'January', worklogDays: 999, attendanceDays: 1000},
		{month: 'February', worklogDays: 0, attendanceDays: 0},
		{month: 'March', worklogDays: 0, attendanceDays: 0},
		{month: 'April', worklogDays: 0, attendanceDays: 0},
		{month: 'May', worklogDays: 0, attendanceDays: 0},
		{month: 'June', worklogDays: 0, attendanceDays: 0},
		{month: 'July', worklogDays: 0, attendanceDays: 0},
		{month: 'August', worklogDays: 0, attendanceDays: 0},
		{month: 'September', worklogDays: 0, attendanceDays: 0},
		{month: 'October', worklogDays: 0, attendanceDays: 0},
		{month: 'November', worklogDays: 0, attendanceDays: 0},
		{month: 'December', worklogDays: 0, attendanceDays: 0},
	];
	const expectedTotalWorklogDays = 999;
	const expectedTotalAttendanceDays = 1000;

	const input = YearlyStatistics.create({
		year: testYear,
		monthlyStats: testMonthlyStats,
		totalWorklogDays: expectedTotalWorklogDays,
		totalAttendanceDays: expectedTotalAttendanceDays,
	});

	const expectedJanuaryRow = 'January      |         999 |           1000';
	const expectedTotalRow = 'Total        |         999 |           1000';

	const result = formatStatisticsTable(input);

	t.true(result.includes(expectedJanuaryRow));
	t.true(result.includes(expectedTotalRow));
});
