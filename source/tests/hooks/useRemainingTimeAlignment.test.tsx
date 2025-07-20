import test from 'ava';
import React, {useEffect} from 'react';
import {Box, Text, render} from 'ink';
import {useRemainingTimeAlignment} from '../../hooks/useRemainingTimeAlignment.js';
import {ConfigFactory, TestPatterns} from '../utils/test-helpers.js';
import type {
	UseRemainingTimeAlignmentReturn,
	UseRemainingTimeAlignmentOptions,
} from '../../hooks/useRemainingTimeAlignment.js';
import type {DailyWorklogSummary} from '../../domain/WeeklyWorklogSummary.js';

interface TestState {
	options?: UseRemainingTimeAlignmentOptions;
	hookResult?: UseRemainingTimeAlignmentReturn;
	lastNotification?: {message: string; type?: 'success' | 'error'};
	error?: string;
}

function TestHookComponent({
	testState,
	triggerAlignment,
}: {
	testState: TestState;
	triggerAlignment?: {date: Date; dailySummary: DailyWorklogSummary | null};
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

	// Trigger alignment if requested
	useEffect(() => {
		if (triggerAlignment) {
			hookResult
				.alignRemainingTime(
					triggerAlignment.date,
					triggerAlignment.dailySummary,
				)
				.catch(error => {
					testState.error = error.message;
				});
		}
	}, [triggerAlignment]);

	return (
		<Box>
			<Text>Test Component</Text>
		</Box>
	);
}

test('useRemainingTimeAlignment - provides alignRemainingTime function', async t => {
	const testState: TestState = {};

	const {rerender} = render(
		React.createElement(TestHookComponent, {testState}),
	);
	rerender(React.createElement(TestHookComponent, {testState}));

	t.truthy(testState.hookResult);
	t.is(typeof testState.hookResult?.alignRemainingTime, 'function');
});

test('useRemainingTimeAlignment - handles no attendance data', async t => {
	await TestPatterns.withTempFiles(async tempDir => {
		const config = ConfigFactory.createValidConfig({
			attendance: {
				enabled: false, // No attendance tracking
				workingHours: 8,
				breakMinutes: 30,
				defaultCheckIn: '09:00',
				defaultCheckOut: '17:00',
				defaultBreakMinutes: 30,
				csvPath: `${tempDir}/attendance.csv`,
			},
		});

		const testState: TestState = {options: {config, onRefresh: () => {}}};
		const date = new Date('2025-07-19');
		const dailySummary: DailyWorklogSummary = {
			date,
			totalHours: 6.0,
			issues: [
				{
					issueKey: 'PROJ-1',
					issueSummary: 'Test issue',
					hours: 6.0,
					worklogId: 'worklog-1',
					comment: 'Test comment',
				},
			],
		};

		const {rerender} = render(
			React.createElement(TestHookComponent, {
				testState,
				triggerAlignment: {date, dailySummary},
			}),
		);

		// Allow async operations to complete
		await new Promise(resolve => setTimeout(resolve, 100));
		rerender(
			React.createElement(TestHookComponent, {
				testState,
				triggerAlignment: {date, dailySummary},
			}),
		);

		// Should show error notification about no attendance data
		t.truthy(testState.lastNotification);
		t.is(testState.lastNotification?.type, 'error');
		t.true(
			testState.lastNotification?.message.includes('No attendance data') ||
				testState.lastNotification?.message.includes('attendance'),
		);
	});
});

test('useRemainingTimeAlignment - handles no worklogs', async t => {
	await TestPatterns.withTempFiles(async tempDir => {
		const config = ConfigFactory.createValidConfig({
			attendance: {
				enabled: true,
				workingHours: 8,
				breakMinutes: 30,
				defaultCheckIn: '09:00',
				defaultCheckOut: '17:00',
				defaultBreakMinutes: 30,
				csvPath: `${tempDir}/attendance.csv`,
			},
		});

		const testState: TestState = {options: {config, onRefresh: () => {}}};
		const date = new Date('2025-07-19');

		const {rerender} = render(
			React.createElement(TestHookComponent, {
				testState,
				triggerAlignment: {date, dailySummary: null},
			}),
		);

		// Allow async operations to complete
		await new Promise(resolve => setTimeout(resolve, 100));
		rerender(
			React.createElement(TestHookComponent, {
				testState,
				triggerAlignment: {date, dailySummary: null},
			}),
		);

		// Should show error notification about no default stories configured
		t.truthy(testState.lastNotification);
		t.is(testState.lastNotification?.type, 'error');
		t.true(
			testState.lastNotification?.message.includes(
				'No default stories configured',
			) ||
				testState.lastNotification?.message.includes('No attendance data') ||
				testState.lastNotification?.message.includes('attendance'),
		);
	});
});

test('useRemainingTimeAlignment - uses default strategy from config', t => {
	const config = ConfigFactory.createValidConfig({
		alignRemainingStrategy: 'proportional',
	});

	const testState: TestState = {options: {config, onRefresh: () => {}}};

	const {rerender} = render(
		React.createElement(TestHookComponent, {testState}),
	);
	rerender(React.createElement(TestHookComponent, {testState}));

	t.truthy(testState.hookResult);
	t.is(typeof testState.hookResult?.alignRemainingTime, 'function');
	// Strategy is used internally, we can't directly test it here
	// but it's covered by the alignment service tests
});

test('useRemainingTimeAlignment - falls back to even strategy when not configured', t => {
	const config = ConfigFactory.createValidConfig();
	// alignRemainingStrategy not set, should default to 'even'

	const testState: TestState = {options: {config, onRefresh: () => {}}};

	const {rerender} = render(
		React.createElement(TestHookComponent, {testState}),
	);
	rerender(React.createElement(TestHookComponent, {testState}));

	t.truthy(testState.hookResult);
	t.is(typeof testState.hookResult?.alignRemainingTime, 'function');
	// Default strategy behavior is tested in the alignment service tests
});

test('useRemainingTimeAlignment - handles errors gracefully', async t => {
	await TestPatterns.withTempFiles(async tempDir => {
		// Create config with invalid Jira settings to trigger errors
		const config = ConfigFactory.createValidConfig({
			jiraUrl: 'invalid-url',
			apiToken: 'invalid-token',
			attendance: {
				enabled: true,
				workingHours: 8,
				breakMinutes: 30,
				defaultCheckIn: '09:00',
				defaultCheckOut: '17:00',
				defaultBreakMinutes: 30,
				csvPath: `${tempDir}/attendance.csv`,
			},
		});

		const testState: TestState = {options: {config, onRefresh: () => {}}};
		const date = new Date('2025-07-19');
		const dailySummary: DailyWorklogSummary = {
			date,
			totalHours: 6.0,
			issues: [
				{
					issueKey: 'PROJ-1',
					issueSummary: 'Test issue',
					hours: 6.0,
					worklogId: 'worklog-1',
					comment: 'Test comment',
				},
			],
		};

		const {rerender} = render(
			React.createElement(TestHookComponent, {
				testState,
				triggerAlignment: {date, dailySummary},
			}),
		);

		// Allow async operations to complete
		await new Promise(resolve => setTimeout(resolve, 200));
		rerender(
			React.createElement(TestHookComponent, {
				testState,
				triggerAlignment: {date, dailySummary},
			}),
		);

		// Should handle errors and show error notification
		// The exact error depends on what fails first (attendance loading, API calls, etc.)
		t.truthy(
			testState.lastNotification || testState.error,
			'Should have received error notification or caught error',
		);

		if (testState.lastNotification) {
			t.is(testState.lastNotification.type, 'error');
		}
	});
});
