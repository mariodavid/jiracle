import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {WeekNavigator} from '../../components/WeekNavigator.js';

test('WeekNavigator renders current week range', t => {
	const currentWeek = new Date('2024-10-19T12:00:00.000Z'); // Saturday in week Oct 14-20
	const mockProps = {
		currentWeek,
		onPreviousWeek: () => {},
		onNextWeek: () => {},
		onCurrentWeek: () => {},
	};

	const {lastFrame} = render(React.createElement(WeekNavigator, mockProps));

	t.true(lastFrame()!.includes('Week'));
	t.true(lastFrame()!.includes('Oct 14-20, 2024'));
	t.true(lastFrame()!.includes('← Previous Week'));
	t.true(lastFrame()!.includes('Next Week →'));
});

test('WeekNavigator renders week spanning different months', t => {
	const currentWeek = new Date('2024-10-01T12:00:00.000Z'); // Tuesday in week Sep 30 - Oct 6
	const mockProps = {
		currentWeek,
		onPreviousWeek: () => {},
		onNextWeek: () => {},
		onCurrentWeek: () => {},
	};

	const {lastFrame} = render(React.createElement(WeekNavigator, mockProps));

	t.true(lastFrame()!.includes('Sep 30 - Oct 6, 2024'));
});

test('WeekNavigator renders week spanning different years', t => {
	const currentWeek = new Date('2025-01-01T12:00:00.000Z'); // Wednesday in week Dec 30, 2024 - Jan 5, 2025
	const mockProps = {
		currentWeek,
		onPreviousWeek: () => {},
		onNextWeek: () => {},
		onCurrentWeek: () => {},
	};

	const {lastFrame} = render(React.createElement(WeekNavigator, mockProps));

	t.true(lastFrame()!.includes('Dec 30, 2024 - Jan 5, 2025'));
});

test('WeekNavigator calculates correct week number', t => {
	const currentWeek = new Date('2024-10-19T12:00:00.000Z'); // Week 42 of 2024
	const mockProps = {
		currentWeek,
		onPreviousWeek: () => {},
		onNextWeek: () => {},
		onCurrentWeek: () => {},
	};

	const {lastFrame} = render(React.createElement(WeekNavigator, mockProps));

	t.true(lastFrame()!.includes('Week 42'));
});

test('WeekNavigator handles Monday start of week correctly', t => {
	const currentWeek = new Date('2024-10-20T12:00:00.000Z'); // Sunday, should be part of Oct 14-20 week
	const mockProps = {
		currentWeek,
		onPreviousWeek: () => {},
		onNextWeek: () => {},
		onCurrentWeek: () => {},
	};

	const {lastFrame} = render(React.createElement(WeekNavigator, mockProps));

	t.true(lastFrame()!.includes('Oct 14-20, 2024'));
});

test('WeekNavigator handles first week of year', t => {
	const currentWeek = new Date('2024-01-03T12:00:00.000Z'); // Wednesday of first week
	const mockProps = {
		currentWeek,
		onPreviousWeek: () => {},
		onNextWeek: () => {},
		onCurrentWeek: () => {},
	};

	const {lastFrame} = render(React.createElement(WeekNavigator, mockProps));

	t.true(lastFrame()!.includes('Week 1'));
	t.true(lastFrame()!.includes('Jan 1-7, 2024'));
});
