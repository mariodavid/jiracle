import test from 'ava';
import React from 'react';
import {Box, Text} from 'ink';
import {render} from 'ink-testing-library';
import {
	useNavigationState,
	type ActiveArea,
	type UseNavigationStateReturn,
} from '../../hooks/useNavigationState.js';
import {InkTestHelpers} from '../utils/ink-test-helpers.js';

// Test component that uses the navigation hook and reports state changes
function TestNavigationComponent({
	options,
	onStateChange,
}: {
	options?: Parameters<typeof useNavigationState>[0];
	onStateChange?: (state: UseNavigationStateReturn) => void;
}) {
	const navigationState = useNavigationState(options);

	// Report state changes to test
	React.useEffect(() => {
		if (onStateChange) {
			onStateChange(navigationState);
		}
	}); // No dependencies - runs on every render

	return (
		<Box>
			<Text>Week: {navigationState.currentWeek.toISOString()}</Text>
			<Text>ActiveArea: {navigationState.activeArea}</Text>
		</Box>
	);
}

test('useNavigationState returns initial state with defaults', (t: any) => {
	let capturedState: UseNavigationStateReturn;

	render(
		React.createElement(TestNavigationComponent, {
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	// Check initial state
	t.truthy(capturedState!);
	t.truthy(capturedState!.currentWeek);
	t.is(capturedState!.activeArea, 'timetable');

	// Check all functions are present
	t.is(typeof capturedState!.navigateToPreviousWeek, 'function');
	t.is(typeof capturedState!.navigateToNextWeek, 'function');
	t.is(typeof capturedState!.navigateToCurrentWeek, 'function');
	t.is(typeof capturedState!.setActiveArea, 'function');
	t.is(typeof capturedState!.returnToTimetable, 'function');
});

test('useNavigationState uses provided initial values', (t: any) => {
	let capturedState: UseNavigationStateReturn;
	const initialWeek = new Date('2024-01-15');
	const initialActiveArea: ActiveArea = 'worklog-form';

	render(
		React.createElement(TestNavigationComponent, {
			options: {
				initialWeek,
				initialActiveArea,
			},
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	// Check initial state uses provided values
	t.is(capturedState!.currentWeek.getTime(), initialWeek.getTime());
	t.is(capturedState!.activeArea, initialActiveArea);
});

test('navigateToPreviousWeek moves week back by 7 days and returns to timetable', async (t: any) => {
	let capturedState: UseNavigationStateReturn;
	const initialWeek = new Date('2024-01-15'); // Monday

	const {rerender} = render(
		React.createElement(TestNavigationComponent, {
			options: {
				initialWeek,
				initialActiveArea: 'worklog-form',
			},
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	// Navigate to previous week
	capturedState!.navigateToPreviousWeek();

	// Wait for state update
	await InkTestHelpers.delay(100);
	rerender(
		React.createElement(TestNavigationComponent, {
			options: {
				initialWeek,
				initialActiveArea: 'worklog-form',
			},
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	// Check week moved back 7 days
	const expectedDate = new Date('2024-01-08');
	t.is(capturedState!.currentWeek.getTime(), expectedDate.getTime());
	// Check active area returned to timetable
	t.is(capturedState!.activeArea, 'timetable');
});

test('navigateToNextWeek moves week forward by 7 days and returns to timetable', async (t: any) => {
	let capturedState: UseNavigationStateReturn;
	const initialWeek = new Date('2024-01-15'); // Monday

	const {rerender} = render(
		React.createElement(TestNavigationComponent, {
			options: {
				initialWeek,
				initialActiveArea: 'attendance-edit',
			},
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	// Navigate to next week
	capturedState!.navigateToNextWeek();

	// Wait for state update
	await InkTestHelpers.delay(100);
	rerender(
		React.createElement(TestNavigationComponent, {
			options: {
				initialWeek,
				initialActiveArea: 'attendance-edit',
			},
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	// Check week moved forward 7 days
	const expectedDate = new Date('2024-01-22');
	t.is(capturedState!.currentWeek.getTime(), expectedDate.getTime());
	// Check active area returned to timetable
	t.is(capturedState!.activeArea, 'timetable');
});

test('navigateToCurrentWeek sets week to current date and returns to timetable', async (t: any) => {
	let capturedState: UseNavigationStateReturn;
	const initialWeek = new Date('2024-01-15'); // Old date

	const {rerender} = render(
		React.createElement(TestNavigationComponent, {
			options: {
				initialWeek,
				initialActiveArea: 'delete-confirmation',
			},
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	// Navigate to current week
	capturedState!.navigateToCurrentWeek();

	// Wait for state update
	await InkTestHelpers.delay(100);
	rerender(
		React.createElement(TestNavigationComponent, {
			options: {
				initialWeek,
				initialActiveArea: 'delete-confirmation',
			},
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	// Check week is close to current date (within 1 day to account for test execution time)
	const now = new Date();
	const timeDiff = Math.abs(
		capturedState!.currentWeek.getTime() - now.getTime(),
	);
	const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
	t.true(daysDiff < 1, 'Week should be set to current date');

	// Check active area returned to timetable
	t.is(capturedState!.activeArea, 'timetable');
});

test('setActiveArea changes active area', async (t: any) => {
	let capturedState: UseNavigationStateReturn;

	const {rerender} = render(
		React.createElement(TestNavigationComponent, {
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	// Change active area
	capturedState!.setActiveArea('worklog-form');

	// Wait for state update
	await InkTestHelpers.delay(100);
	rerender(
		React.createElement(TestNavigationComponent, {
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	t.is(capturedState!.activeArea, 'worklog-form');
});

test('returnToTimetable sets active area to timetable', async (t: any) => {
	let capturedState: UseNavigationStateReturn;

	const {rerender} = render(
		React.createElement(TestNavigationComponent, {
			options: {
				initialActiveArea: 'checkin-confirmation',
			},
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	// Return to timetable
	capturedState!.returnToTimetable();

	// Wait for state update
	await InkTestHelpers.delay(100);
	rerender(
		React.createElement(TestNavigationComponent, {
			options: {
				initialActiveArea: 'checkin-confirmation',
			},
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	t.is(capturedState!.activeArea, 'timetable');
});

test('all active area values work correctly', async (t: any) => {
	const activeAreas: ActiveArea[] = [
		'timetable',
		'worklog-form',
		'delete-confirmation',
		'delete-attendance-confirmation',
		'attendance-edit',
		'checkin-confirmation',
		'checkout-confirmation',
	];

	for (const area of activeAreas) {
		let capturedState: UseNavigationStateReturn;

		const {rerender} = render(
			React.createElement(TestNavigationComponent, {
				onStateChange(state: UseNavigationStateReturn) {
					capturedState = state;
				},
			}),
		);

		// Set each active area
		capturedState!.setActiveArea(area);

		// Wait for state update
		await InkTestHelpers.delay(50);
		rerender(
			React.createElement(TestNavigationComponent, {
				onStateChange(state: UseNavigationStateReturn) {
					capturedState = state;
				},
			}),
		);

		t.is(capturedState!.activeArea, area, `Failed to set active area: ${area}`);
	}
});

test('week navigation preserves week calculations correctly', async (t: any) => {
	let capturedState: UseNavigationStateReturn;
	const startDate = new Date('2024-01-15'); // Monday

	const {rerender} = render(
		React.createElement(TestNavigationComponent, {
			options: {
				initialWeek: startDate,
			},
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	// Navigate through multiple weeks
	capturedState!.navigateToNextWeek();
	await InkTestHelpers.delay(50);
	rerender(
		React.createElement(TestNavigationComponent, {
			options: {
				initialWeek: startDate,
			},
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	capturedState!.navigateToNextWeek();
	await InkTestHelpers.delay(50);
	rerender(
		React.createElement(TestNavigationComponent, {
			options: {
				initialWeek: startDate,
			},
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	capturedState!.navigateToPreviousWeek();
	await InkTestHelpers.delay(50);
	rerender(
		React.createElement(TestNavigationComponent, {
			options: {
				initialWeek: startDate,
			},
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	// Should be 1 week ahead of start (15 + 7 + 7 - 7 = 22)
	const expectedDate = new Date('2024-01-22');
	t.is(capturedState!.currentWeek.getTime(), expectedDate.getTime());
});

test('hook structure and interface validation', (t: any) => {
	let capturedState: UseNavigationStateReturn;

	render(
		React.createElement(TestNavigationComponent, {
			onStateChange(state: UseNavigationStateReturn) {
				capturedState = state;
			},
		}),
	);

	// Validate hook interface structure
	const expectedKeys = [
		'currentWeek',
		'activeArea',
		'navigateToPreviousWeek',
		'navigateToNextWeek',
		'navigateToCurrentWeek',
		'setActiveArea',
		'returnToTimetable',
	];

	for (const key of expectedKeys) {
		t.true(key in capturedState!, `Missing key: ${key}`);
	}

	// Validate state types
	t.true(capturedState!.currentWeek instanceof Date);
	t.is(typeof capturedState!.activeArea, 'string');

	// Validate function types
	t.is(typeof capturedState!.navigateToPreviousWeek, 'function');
	t.is(typeof capturedState!.navigateToNextWeek, 'function');
	t.is(typeof capturedState!.navigateToCurrentWeek, 'function');
	t.is(typeof capturedState!.setActiveArea, 'function');
	t.is(typeof capturedState!.returnToTimetable, 'function');
});
