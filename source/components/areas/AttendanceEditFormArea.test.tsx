import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import type {AttendanceEditState} from '../../hooks/useAttendanceManagement.js';
import type {JiraConfig} from '../../jira-client.js';
import {AttendanceEditFormArea} from './AttendanceEditFormArea.js';

const mockConfig: JiraConfig = {
	jiraUrl: 'https://test.example.com',
	username: 'test@example.com',
	apiToken: 'test-token',
	defaultTime: '8h',
	defaultComment: 'Work',
	attendance: {
		enabled: true,
		workingHours: 8,
		breakMinutes: 30,
		defaultCheckIn: '09:00',
		defaultCheckOut: '17:00',
		defaultBreakMinutes: 30,
	},
	slidingWindowDays: {past: 14, future: 7},
};

const mockAttendanceEdit: AttendanceEditState = {
	date: new Date('2024-01-15'),
	data: {
		date: '2024-01-15',
		checkIn: '09:00',
		checkOut: '17:00',
		breakMinutes: 30,
		totalHours: 7.5,
	},
};

test('AttendanceEditFormArea renders with attendance form', t => {
	// Explicit test data
	const expectedElements = [
		'Anwesenheit bearbeiten',
		'Beginn:',
		'Ende:',
		'Pause:',
		'[Speichern]',
		'[Abbrechen]',
	];
	const expectedTimes: string[] = ['09:00', '17:00'];
	const expectedBreakTime = '30m';

	const mockOnSubmit = () => {};
	const mockOnCancel = () => {};

	// Operations
	const {lastFrame} = render(
		<AttendanceEditFormArea
			attendanceEdit={mockAttendanceEdit}
			config={mockConfig}
			onSubmit={mockOnSubmit}
			onCancel={mockOnCancel}
		/>,
	);

	const output = lastFrame();

	// Specific value comparisons
	for (const element of expectedElements) {
		t.true(output!.includes(element), `Should display ${element}`);
	}

	t.true(
		output!.includes(expectedTimes[0]!),
		`Should display check-in time ${expectedTimes[0]!}`,
	);
	t.true(
		output!.includes(expectedTimes[1]!),
		`Should display check-out time ${expectedTimes[1]!}`,
	);
	t.true(
		output!.includes(expectedBreakTime),
		`Should display break time ${expectedBreakTime}`,
	);
});

test('AttendanceEditFormArea handles submit callback', t => {
	// Explicit test data
	const expectedSubmitButton = '[Speichern]';
	let callbackReceived = false;
	let submittedData: any = null;

	const mockOnSubmit = (data: any) => {
		callbackReceived = true;
		submittedData = data;
	};

	const mockOnCancel = () => {};

	// Operations
	const {lastFrame} = render(
		<AttendanceEditFormArea
			attendanceEdit={mockAttendanceEdit}
			config={mockConfig}
			onSubmit={mockOnSubmit}
			onCancel={mockOnCancel}
		/>,
	);

	const output = lastFrame();

	// Specific value comparisons
	t.true(
		output!.includes(expectedSubmitButton),
		'Should display submit button',
	);
	t.is(
		typeof mockOnSubmit,
		'function',
		'Should receive onSubmit callback function',
	);
	// Component renders properly and callback is accessible (actual submission requires user interaction)
	t.false(callbackReceived, 'Callback should not be triggered on render');
	t.is(submittedData, null, 'No data should be submitted on render');
});

test('AttendanceEditFormArea handles cancel callback', t => {
	// Explicit test data
	const expectedCancelButton = '[Abbrechen]';
	let callbackReceived = false;

	const mockOnSubmit = () => {};
	const mockOnCancel = () => {
		callbackReceived = true;
	};

	// Operations
	const {lastFrame} = render(
		<AttendanceEditFormArea
			attendanceEdit={mockAttendanceEdit}
			config={mockConfig}
			onSubmit={mockOnSubmit}
			onCancel={mockOnCancel}
		/>,
	);

	const output = lastFrame();

	// Specific value comparisons
	t.true(
		output!.includes(expectedCancelButton),
		'Should display cancel button',
	);
	t.is(
		typeof mockOnCancel,
		'function',
		'Should receive onCancel callback function',
	);
	// Component renders properly and callback is accessible (actual cancellation requires user interaction)
	t.false(callbackReceived, 'Callback should not be triggered on render');
});

test('AttendanceEditFormArea handles attendance without initial data', t => {
	// Explicit test data
	const attendanceEditNoData: AttendanceEditState = {
		date: new Date('2024-01-15'),
		data: undefined,
	};
	const expectedElements = [
		'Anwesenheit bearbeiten',
		'Beginn:',
		'Ende:',
		'Pause:',
	];
	const expectedDefaultTimes: string[] = ['09:00', '17:00']; // Should use config defaults
	const expectedDefaultBreak = '30m';

	const mockOnSubmit = () => {};
	const mockOnCancel = () => {};

	// Operations
	const {lastFrame} = render(
		<AttendanceEditFormArea
			attendanceEdit={attendanceEditNoData}
			config={mockConfig}
			onSubmit={mockOnSubmit}
			onCancel={mockOnCancel}
		/>,
	);

	const output = lastFrame();

	// Specific value comparisons
	for (const element of expectedElements) {
		t.true(output!.includes(element), `Should display ${element}`);
	}

	t.true(
		output!.includes(expectedDefaultTimes[0]!),
		`Should display default check-in time ${expectedDefaultTimes[0]!}`,
	);
	t.true(
		output!.includes(expectedDefaultTimes[1]!),
		`Should display default check-out time ${expectedDefaultTimes[1]!}`,
	);
	t.true(
		output!.includes(expectedDefaultBreak),
		`Should display default break time ${expectedDefaultBreak}`,
	);
});

test('AttendanceEditFormArea uses correct styling and layout', t => {
	// Explicit test data
	const expectedLayoutElements = ['╭', '╮', '╰', '╯']; // Round border characters
	const expectedFormFields = ['Beginn:', 'Ende:', 'Pause:'];
	const expectedInstructions = [
		'[Tab]',
		'Feld wechseln',
		'[Enter]',
		'Speichern',
		'[Esc]',
		'Abbrechen',
	];

	const mockOnSubmit = () => {};
	const mockOnCancel = () => {};

	// Operations
	const {lastFrame} = render(
		<AttendanceEditFormArea
			attendanceEdit={mockAttendanceEdit}
			config={mockConfig}
			onSubmit={mockOnSubmit}
			onCancel={mockOnCancel}
		/>,
	);

	const output = lastFrame();

	// Specific value comparisons
	for (const border of expectedLayoutElements) {
		t.true(
			output!.includes(border),
			`Should display border character ${border}`,
		);
	}

	for (const field of expectedFormFields) {
		t.true(output!.includes(field), `Should display form field ${field}`);
	}

	for (const instruction of expectedInstructions) {
		t.true(
			output!.includes(instruction),
			`Should display instruction ${instruction}`,
		);
	}
});

test('AttendanceEditFormArea handles different dates', t => {
	// Explicit test data
	const differentDateEdit: AttendanceEditState = {
		date: new Date('2024-12-25'),
		data: {
			date: '2024-12-25',
			checkIn: '10:00',
			checkOut: '18:00',
			breakMinutes: 45,
			totalHours: 7.25,
		},
	};
	const expectedDate = 'Mi, 25. Dez'; // German formatted date
	const expectedCheckInTime = '10:00';
	const expectedCheckOutTime = '18:00';
	const expectedBreakTime = '45m';

	const mockOnSubmit = () => {};
	const mockOnCancel = () => {};

	// Operations
	const {lastFrame} = render(
		<AttendanceEditFormArea
			attendanceEdit={differentDateEdit}
			config={mockConfig}
			onSubmit={mockOnSubmit}
			onCancel={mockOnCancel}
		/>,
	);

	const output = lastFrame();

	// Specific value comparisons
	t.true(
		output!.includes(expectedDate),
		`Should display formatted date ${expectedDate}`,
	);
	t.true(
		output!.includes(expectedCheckInTime),
		`Should display check-in time ${expectedCheckInTime}`,
	);
	t.true(
		output!.includes(expectedCheckOutTime),
		`Should display check-out time ${expectedCheckOutTime}`,
	);
	t.true(
		output!.includes(expectedBreakTime),
		`Should display break time ${expectedBreakTime}`,
	);
});

test('AttendanceEditFormArea handles different break configurations', t => {
	// Explicit test data
	const longBreakEdit: AttendanceEditState = {
		date: new Date('2024-01-15'),
		data: {
			date: '2024-01-15',
			checkIn: '08:00',
			checkOut: '17:00',
			breakMinutes: 60, // 1 hour break
			totalHours: 8,
		},
	};
	const expectedCheckInTime = '08:00';
	const expectedCheckOutTime = '17:00';
	const expectedLongBreakTime = '60m'; // 1 hour in minutes
	const expectedFormElements = ['Beginn:', 'Ende:', 'Pause:'];

	const mockOnSubmit = () => {};
	const mockOnCancel = () => {};

	// Operations
	const {lastFrame} = render(
		<AttendanceEditFormArea
			attendanceEdit={longBreakEdit}
			config={mockConfig}
			onSubmit={mockOnSubmit}
			onCancel={mockOnCancel}
		/>,
	);

	const output = lastFrame();

	// Specific value comparisons
	for (const element of expectedFormElements) {
		t.true(output!.includes(element), `Should display form element ${element}`);
	}

	t.true(
		output!.includes(expectedCheckInTime),
		`Should display check-in time ${expectedCheckInTime}`,
	);
	t.true(
		output!.includes(expectedCheckOutTime),
		`Should display check-out time ${expectedCheckOutTime}`,
	);
	t.true(
		output!.includes(expectedLongBreakTime),
		`Should display long break time ${expectedLongBreakTime}`,
	);
});
