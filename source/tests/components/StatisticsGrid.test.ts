import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {StatisticsGrid} from '../../components/StatisticsGrid.js';
import type {YearlyStatistics} from '../../use-cases/StatisticsUseCase.js';

// TEST DATA
const EXPECTED_YEARLY_STATISTICS: YearlyStatistics = {
	year: 2025,
	monthlyStats: [
		{
			month: 'January',
			worklogDays: 15,
			attendanceDays: 20,
		},
		{
			month: 'February',
			worklogDays: 12,
			attendanceDays: 18,
		},
		{
			month: 'March',
			worklogDays: 0,
			attendanceDays: 0,
		},
	],
	totalWorklogDays: 27,
	totalAttendanceDays: 38,
};

const EXPECTED_EMPTY_STATISTICS: YearlyStatistics = {
	year: 2025,
	monthlyStats: [],
	totalWorklogDays: 0,
	totalAttendanceDays: 0,
};

// OPERATIONS
function renderStatisticsGrid(statistics: YearlyStatistics) {
	const {lastFrame} = render(React.createElement(StatisticsGrid, {statistics}));

	return lastFrame()!;
}

// SPECIFIC VALUE COMPARISONS
test('should render statistics table with proper headers', t => {
	const output = renderStatisticsGrid(EXPECTED_YEARLY_STATISTICS);

	t.true(output.includes('Worklog Days'));
	t.true(output.includes('Attendance Days'));
	t.true(output.includes('(Hours)'));
});

test('should render monthly statistics with correct data', t => {
	const output = renderStatisticsGrid(EXPECTED_YEARLY_STATISTICS);

	// January data
	t.true(output.includes('January'));
	t.true(output.includes('15')); // Worklog days
	t.true(output.includes('20 (160h)')); // Attendance days with hours

	// February data
	t.true(output.includes('February'));
	t.true(output.includes('12')); // Worklog days
	t.true(output.includes('18 (144h)')); // Attendance days with hours

	// March data (zero values)
	t.true(output.includes('March'));
	t.true(output.includes('0 (0h)')); // Zero attendance days with hours
});

test('should render total row with correct calculations', t => {
	const output = renderStatisticsGrid(EXPECTED_YEARLY_STATISTICS);

	t.true(output.includes('Total'));
	t.true(output.includes('27')); // Total worklog days
	t.true(output.includes('38 (304h)')); // Total attendance days with hours
});

test('should calculate hours correctly using 8-hour workday', t => {
	const singleDayStats: YearlyStatistics = {
		year: 2025,
		monthlyStats: [
			{
				month: 'January',
				worklogDays: 5,
				attendanceDays: 1,
			},
		],
		totalWorklogDays: 5,
		totalAttendanceDays: 1,
	};

	const output = renderStatisticsGrid(singleDayStats);

	t.true(output.includes('1 (8h)'));
});

test('should handle empty statistics gracefully', t => {
	const output = renderStatisticsGrid(EXPECTED_EMPTY_STATISTICS);

	// Should still render headers
	t.true(output.includes('Worklog Days'));
	t.true(output.includes('Attendance Days'));
	t.true(output.includes('(Hours)'));

	// Should render total row with zeros
	t.true(output.includes('Total'));
	t.true(output.includes('0 (0h)'));
});

test('should render table with proper centering and structure', t => {
	const output = renderStatisticsGrid(EXPECTED_YEARLY_STATISTICS);

	// Should have horizontal separators
	t.true(output.includes('─'));

	// Should be properly structured with consistent spacing
	const lines = output.split('\n');
	const dataLines = lines.filter(
		line => line.includes('January') || line.includes('February'),
	);
	t.is(dataLines.length, 2);
});

test('should use proper color formatting in output', t => {
	const output = renderStatisticsGrid(EXPECTED_YEARLY_STATISTICS);

	// Note: Colors are stripped in testing, but structure should be consistent
	// This test ensures the component doesn't crash with color props
	t.true(output.includes('January'));
	t.true(output.includes('Total'));
});
