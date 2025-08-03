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
			businessDays: 23,
			totalHours: 184,
			bonusDays: 23,
			efficiency: 100,
		},
		{
			month: 'February',
			worklogDays: 12,
			attendanceDays: 18,
			businessDays: 20,
			totalHours: 160,
			bonusDays: 20,
			efficiency: 100,
		},
		{
			month: 'March',
			worklogDays: 0,
			attendanceDays: 0,
			businessDays: 21,
			totalHours: 0,
			bonusDays: 0,
			efficiency: 0,
		},
	],
	totalWorklogDays: 27,
	totalAttendanceDays: 38,
	totalHours: 344,
	totalBonusDays: 43,
	yearToDateEfficiency: 16.48,
};

const EXPECTED_EMPTY_STATISTICS: YearlyStatistics = {
	year: 2025,
	monthlyStats: [],
	totalWorklogDays: 0,
	totalAttendanceDays: 0,
};

// Mock bonus config for testing
const MOCK_BONUS_CONFIG = {
	enabled: true,
	hoursPerBonusDay: 8,
	targetDays: 190,
	targets: {minimum: 150, standard: 190, stretch: 210},
};

// OPERATIONS
function renderStatisticsGrid(
	statistics: YearlyStatistics,
	bonusConfig = MOCK_BONUS_CONFIG,
) {
	const {lastFrame} = render(
		React.createElement(StatisticsGrid, {statistics, bonusConfig}),
	);

	return lastFrame()!;
}

// SPECIFIC VALUE COMPARISONS
test('should render statistics table with proper headers', t => {
	const output = renderStatisticsGrid(EXPECTED_YEARLY_STATISTICS);

	t.true(output.includes('Work Days'));
	t.true(output.includes('Bonus Days'));
	t.true(output.includes('Efficiency'));
	t.true(output.includes('Target'));
});

test('should render monthly statistics with correct data', t => {
	const output = renderStatisticsGrid(EXPECTED_YEARLY_STATISTICS);

	// January data
	t.true(output.includes('January'));
	t.true(output.includes('23')); // Business days
	t.true(output.includes('23.0')); // Bonus days
	t.true(output.includes('100.0%')); // Efficiency
	t.true(output.includes('✓')); // Target achieved

	// February data
	t.true(output.includes('February'));
	t.true(output.includes('20')); // Business days
	t.true(output.includes('20.0')); // Bonus days
	t.true(output.includes('100.0%')); // Efficiency

	// March data (zero values)
	t.true(output.includes('March'));
	t.true(output.includes('21')); // Business days
	t.true(output.includes('0.0')); // Bonus days
	t.true(output.includes('0.0%')); // Efficiency
});

test('should render total row with correct calculations', t => {
	const output = renderStatisticsGrid(EXPECTED_YEARLY_STATISTICS);

	t.true(output.includes('YTD Total'));
	t.true(output.includes('64')); // Total business days (23+20+21)
	t.true(output.includes('43.0')); // Total bonus days
	t.true(output.includes('16.5%')); // Year-to-date efficiency (rounded)
});

test('should calculate bonus days correctly using 8-hour workday', t => {
	const singleDayStats: YearlyStatistics = {
		year: 2025,
		monthlyStats: [
			{
				month: 'January',
				worklogDays: 5,
				attendanceDays: 1,
				businessDays: 23,
				totalHours: 8,
				bonusDays: 1,
				efficiency: 4.35,
			},
		],
		totalWorklogDays: 5,
		totalAttendanceDays: 1,
		totalHours: 8,
		totalBonusDays: 1,
		yearToDateEfficiency: 0.38,
	};

	const output = renderStatisticsGrid(singleDayStats);

	t.true(output.includes('1.0')); // 1 bonus day from 8 hours
});

test('should handle empty statistics gracefully', t => {
	const output = renderStatisticsGrid(EXPECTED_EMPTY_STATISTICS);

	// Should not show bonus columns when no bonus data
	t.false(output.includes('Work Days'));
	t.false(output.includes('Bonus Days'));
	t.false(output.includes('Efficiency'));
	t.false(output.includes('Target'));

	// Should render month names only
	t.true(output.includes('Month'));
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

	// Should include target summary section
	t.true(output.includes('Targets:'));
	t.true(output.includes('Minimum'));
	t.true(output.includes('Standard'));
	t.true(output.includes('Stretch'));
});

test('should use proper color formatting in output', t => {
	const output = renderStatisticsGrid(EXPECTED_YEARLY_STATISTICS);

	// Note: Colors are stripped in testing, but structure should be consistent
	// This test ensures the component doesn't crash with color props
	t.true(output.includes('January'));
	t.true(output.includes('YTD Total'));

	// Should include efficiency indicators
	t.true(output.includes('100.0%')); // High efficiency
	t.true(output.includes('0.0%')); // Low efficiency
});
