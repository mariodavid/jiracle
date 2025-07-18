import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {WeekNavigator, getWeekTitle} from '../../components/WeekNavigator.js';

test('WeekNavigator renders navigation buttons', t => {
	const mockProps = {
		currentWeek: new Date('2024-10-19T12:00:00.000Z'),
		onPreviousWeek: () => {},
		onNextWeek: () => {},
		onCurrentWeek: () => {},
		activeArea: 'timetable' as const,
	};

	const {lastFrame} = render(React.createElement(WeekNavigator, mockProps));

	// WeekNavigator now only shows navigation buttons, not the week title
	t.true(lastFrame()!.includes('← Previous Week'));
	t.true(lastFrame()!.includes('Next Week →'));
});

test('getWeekTitle renders week spanning different months', t => {
	const currentWeek = new Date('2024-10-01T12:00:00.000Z'); // Tuesday in week Sep 30 - Oct 7
	const title = getWeekTitle(currentWeek);
	t.true(title.includes('Sep 30 - Oct 7, 2024'));
});

test('getWeekTitle renders week spanning different years', t => {
	const currentWeek = new Date('2025-01-01T12:00:00.000Z'); // Wednesday in week Dec 30, 2024 - Jan 6, 2025
	const title = getWeekTitle(currentWeek);
	t.true(title.includes('Dec 30, 2024 - Jan 6, 2025'));
});

test('getWeekTitle calculates correct week number', t => {
	const currentWeek = new Date('2024-10-19T12:00:00.000Z'); // Week 42 of 2024
	const title = getWeekTitle(currentWeek);
	t.true(title.includes('Week 42'));
});

test('getWeekTitle handles Monday start of week correctly', t => {
	const currentWeek = new Date('2024-10-20T12:00:00.000Z'); // Sunday, should be part of Oct 14-21 week
	const title = getWeekTitle(currentWeek);
	t.true(title.includes('Oct 14-21, 2024'));
});

test('getWeekTitle handles first week of year', t => {
	const currentWeek = new Date('2024-01-03T12:00:00.000Z'); // Wednesday of first week
	const title = getWeekTitle(currentWeek);
	t.true(title.includes('Week 1'));
	t.true(title.includes('Jan 1-8, 2024'));
});
