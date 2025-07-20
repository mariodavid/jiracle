import test from 'ava';
import React, {useEffect} from 'react';
import {Box, Text, render} from 'ink';
import {useRemainingTimeAlignment} from '../hooks/useRemainingTimeAlignment.js';
import {ConfigFactory, TestPatterns} from './utils/test-helpers.js';
import type {
	UseRemainingTimeAlignmentReturn,
	UseRemainingTimeAlignmentOptions,
} from '../hooks/useRemainingTimeAlignment.js';
import type {DailyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';

interface TestState {
	options?: UseRemainingTimeAlignmentOptions;
	hookResult?: UseRemainingTimeAlignmentReturn;
	lastNotification?: {message: string; type?: 'success' | 'error'};
	error?: string;
	previewResult?: any;
}

function TestHookComponent({
	testState,
	triggerPreview,
}: {
	testState: TestState;
	triggerPreview?: {date: Date; dailySummary: DailyWorklogSummary | null};
}) {
	// Mock notification handler
	const handleNotification = (message: string, type?: 'success' | 'error') => {
		testState.lastNotification = {message, type};
	};

	// Mock refresh handler
	const handleRefresh = () => {
		// Mock refresh implementation
	};

	const hookResult = useRemainingTimeAlignment({
		config: testState.options?.config || ConfigFactory.createValidConfig(),
		onRefresh: handleRefresh,
		onNotification: handleNotification,
	});

	useEffect(() => {
		testState.hookResult = hookResult;
	});

	// Trigger preview if requested
	useEffect(() => {
		if (triggerPreview) {
			hookResult
				.previewAlignment(triggerPreview.date, triggerPreview.dailySummary)
				.then(result => {
					testState.previewResult = result;
				})
				.catch(error => {
					testState.error = error.message;
				});
		}
	}, [triggerPreview]);

	return React.createElement(
		Box,
		{},
		React.createElement(Text, {}, 'Test Component'),
	);
}

test('useRemainingTimeAlignment - detects CREATE mode when all issues have zero hours', async t => {
	await TestPatterns.withTempFiles(async manager => {
		// Create attendance data
		const csvHeader = 'date,checkIn,checkOut,breakMinutes,totalHours,notes\n';
		const csvData = '2025-07-21,08:00,17:00,30,8.5,\n';
		const csvPath = manager.writeCSV(csvHeader + csvData);

		const config = ConfigFactory.createValidConfig({
			attendance: {
				enabled: true,
				workingHours: 8,
				breakMinutes: 30,
				defaultCheckIn: '08:00',
				defaultCheckOut: '17:00',
				defaultBreakMinutes: 30,
				csvPath,
			},
			fill: {
				alignRemainingStrategy: 'proportional',
				defaultStories: [
					{issueKey: 'JTS-2457', percentage: 50},
					{issueKey: 'JTS-2456', percentage: 50},
				],
			},
		});

		const testState: TestState = {options: {config, onRefresh: () => {}}};
		const date = new Date('2025-07-21');
		// Critical test case: dailySummary has issues but all have 0 hours
		// This was the bug - the system was incorrectly entering UPDATE mode
		const dailySummaryWithZeroHours: DailyWorklogSummary = {
			date: new Date('2025-07-21'),
			totalHours: 0, // Total is 0
			issues: [
				// Multiple issues exist, but all have 0 hours
				{
					issueKey: 'JTS-2456',
					issueSummary: 'Test Issue 1',
					hours: 0,
					comment: '',
				},
				{
					issueKey: 'JTS-2472',
					issueSummary: 'Test Issue 2',
					hours: 0,
					comment: '',
				},
				{
					issueKey: 'JTS-2457',
					issueSummary: 'Test Issue 3',
					hours: 0,
					comment: '',
				},
				{
					issueKey: 'GVV-5676',
					issueSummary: 'Test Issue 4',
					hours: 0,
					comment: '',
				},
				{
					issueKey: 'GVV-5420',
					issueSummary: 'Test Issue 5',
					hours: 0,
					comment: '',
				},
				{
					issueKey: 'GVV-5419',
					issueSummary: 'Test Issue 6',
					hours: 0,
					comment: '',
				},
				{
					issueKey: 'GVV-5417',
					issueSummary: 'Test Issue 7',
					hours: 0,
					comment: '',
				},
			],
		};

		const {rerender} = render(
			React.createElement(TestHookComponent, {
				testState,
				triggerPreview: {date, dailySummary: dailySummaryWithZeroHours},
			}),
		);

		// Allow async operations to complete
		await new Promise(resolve => setTimeout(resolve, 100));
		rerender(
			React.createElement(TestHookComponent, {
				testState,
				triggerPreview: {date, dailySummary: dailySummaryWithZeroHours},
			}),
		);

		// Before the fix: this would return UPDATE mode and fail with "No existing worklogs found to update"
		// After the fix: this should correctly detect CREATE mode since no issues have hours > 0
		const previewResult = testState.previewResult;
		t.truthy(previewResult, 'previewResult should not be null');
		t.is(
			previewResult.mode,
			'create',
			'Should detect CREATE mode when all issues have 0 hours',
		);
		t.truthy(
			previewResult.createResult,
			'Should have createResult in CREATE mode',
		);
		t.is(previewResult.attendanceHours, 8.5, 'Should use attendance hours');
		t.is(
			previewResult.currentLoggedHours,
			0,
			'Should have 0 current logged hours',
		);
		t.is(
			previewResult.remainingHours,
			8.5,
			'Should have all attendance as remaining',
		);

		// Check that worklogs are created correctly
		const {createdWorklogs} = previewResult.createResult;
		t.is(
			createdWorklogs.length,
			2,
			'Should create 2 worklogs from default stories',
		);
		t.is(
			createdWorklogs[0].issueKey,
			'JTS-2457',
			'First worklog should be JTS-2457',
		);
		t.is(
			createdWorklogs[0].hours,
			4.25,
			'First worklog should be 50% of 8.5h = 4.25h',
		);
		t.is(
			createdWorklogs[0].percentage,
			50,
			'First worklog should have 50% percentage',
		);
		t.is(
			createdWorklogs[1].issueKey,
			'JTS-2456',
			'Second worklog should be JTS-2456',
		);
		t.is(
			createdWorklogs[1].hours,
			4.25,
			'Second worklog should be 50% of 8.5h = 4.25h',
		);
		t.is(
			createdWorklogs[1].percentage,
			50,
			'Second worklog should have 50% percentage',
		);
	});
});

test('useRemainingTimeAlignment - detects UPDATE mode when issues have actual hours', async t => {
	await TestPatterns.withTempFiles(async manager => {
		// Create attendance data
		const csvHeader = 'date,checkIn,checkOut,breakMinutes,totalHours,notes\n';
		const csvData = '2025-07-21,08:00,17:00,30,8.5,\n';
		const csvPath = manager.writeCSV(csvHeader + csvData);

		const config = ConfigFactory.createValidConfig({
			attendance: {
				enabled: true,
				workingHours: 8,
				breakMinutes: 30,
				defaultCheckIn: '08:00',
				defaultCheckOut: '17:00',
				defaultBreakMinutes: 30,
				csvPath,
			},
			fill: {
				alignRemainingStrategy: 'proportional',
				defaultStories: [
					{issueKey: 'JTS-2457', percentage: 50},
					{issueKey: 'JTS-2456', percentage: 50},
				],
			},
		});

		const testState: TestState = {options: {config, onRefresh: () => {}}};
		const date = new Date('2025-07-21');

		// This scenario: dailySummary has issues with actual hours logged
		const dailySummaryWithActualHours: DailyWorklogSummary = {
			date: new Date('2025-07-21'),
			totalHours: 6, // Some hours logged
			issues: [
				{
					issueKey: 'JTS-2456',
					issueSummary: 'Test Issue 1',
					hours: 4,
					comment: 'Work done',
					worklogId: 'wl1',
				},
				{
					issueKey: 'JTS-2457',
					issueSummary: 'Test Issue 2',
					hours: 2,
					comment: 'More work',
					worklogId: 'wl2',
				},
			],
		};

		const {rerender} = render(
			React.createElement(TestHookComponent, {
				testState,
				triggerPreview: {date, dailySummary: dailySummaryWithActualHours},
			}),
		);

		// Allow async operations to complete
		await new Promise(resolve => setTimeout(resolve, 100));
		rerender(
			React.createElement(TestHookComponent, {
				testState,
				triggerPreview: {date, dailySummary: dailySummaryWithActualHours},
			}),
		);

		// This should correctly detect UPDATE mode since issues have hours > 0
		const previewResult = testState.previewResult;
		t.truthy(previewResult, 'previewResult should not be null');
		t.is(
			previewResult.mode,
			'update',
			'Should detect UPDATE mode when issues have hours > 0',
		);
		t.truthy(previewResult.result, 'Should have result in UPDATE mode');
		t.is(previewResult.attendanceHours, 8.5, 'Should use attendance hours');
		t.is(
			previewResult.currentLoggedHours,
			6,
			'Should have 6 current logged hours',
		);
		t.is(previewResult.remainingHours, 2.5, 'Should have 2.5h remaining');
	});
});

test('useRemainingTimeAlignment - handles mixed scenario correctly', async t => {
	await TestPatterns.withTempFiles(async manager => {
		// Create attendance data
		const csvHeader = 'date,checkIn,checkOut,breakMinutes,totalHours,notes\n';
		const csvData = '2025-07-21,08:00,17:00,30,8.5,\n';
		const csvPath = manager.writeCSV(csvHeader + csvData);

		const config = ConfigFactory.createValidConfig({
			attendance: {
				enabled: true,
				workingHours: 8,
				breakMinutes: 30,
				defaultCheckIn: '08:00',
				defaultCheckOut: '17:00',
				defaultBreakMinutes: 30,
				csvPath,
			},
			fill: {
				alignRemainingStrategy: 'proportional',
				defaultStories: [
					{issueKey: 'JTS-2457', percentage: 50},
					{issueKey: 'JTS-2456', percentage: 50},
				],
			},
		});

		const testState: TestState = {options: {config, onRefresh: () => {}}};
		const date = new Date('2025-07-21');

		// Mixed scenario: some issues have hours, some don't
		const mixedDailySummary: DailyWorklogSummary = {
			date: new Date('2025-07-21'),
			totalHours: 3, // Some hours logged
			issues: [
				{
					issueKey: 'JTS-2456',
					issueSummary: 'Test Issue 1',
					hours: 3,
					comment: 'Work done',
					worklogId: 'wl1',
				}, // Has hours
				{
					issueKey: 'JTS-2457',
					issueSummary: 'Test Issue 2',
					hours: 0,
					comment: '',
				}, // No hours
				{
					issueKey: 'GVV-5676',
					issueSummary: 'Test Issue 3',
					hours: 0,
					comment: '',
				}, // No hours
			],
		};

		const {rerender} = render(
			React.createElement(TestHookComponent, {
				testState,
				triggerPreview: {date, dailySummary: mixedDailySummary},
			}),
		);

		// Allow async operations to complete
		await new Promise(resolve => setTimeout(resolve, 100));
		rerender(
			React.createElement(TestHookComponent, {
				testState,
				triggerPreview: {date, dailySummary: mixedDailySummary},
			}),
		);

		// Should detect UPDATE mode because at least one issue has hours > 0
		const previewResult = testState.previewResult;
		t.truthy(previewResult, 'previewResult should not be null');
		t.is(
			previewResult.mode,
			'update',
			'Should detect UPDATE mode when at least one issue has hours > 0',
		);
		t.truthy(previewResult.result, 'Should have result in UPDATE mode');
		t.is(
			previewResult.currentLoggedHours,
			3,
			'Should have 3 current logged hours',
		);
		t.is(previewResult.remainingHours, 5.5, 'Should have 5.5h remaining');
	});
});
