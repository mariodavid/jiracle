import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {AttendanceEditForm} from '../../components/AttendanceEditForm.js';

const mockProps = {
	date: new Date('2025-07-11T00:00:00.000Z'),
	onSubmit: () => {},
	onCancel: () => {},
};

test('AttendanceEditForm handles Tab navigation forward', t => {
	const {lastFrame, stdin} = render(
		React.createElement(AttendanceEditForm, mockProps),
	);

	// Initially should be on checkIn field
	let output = lastFrame() || '';
	t.true(output.includes('Beginn:'));

	// Tab to checkOut field
	stdin.write('\t');
	output = lastFrame() || '';
	t.true(output.includes('Ende:'));

	// Tab to break field
	stdin.write('\t');
	output = lastFrame() || '';
	t.true(output.includes('Pause:'));

	// Tab to submit button
	stdin.write('\t');
	output = lastFrame() || '';
	t.true(output.includes('[Speichern]'));

	// Tab to cancel button
	stdin.write('\t');
	output = lastFrame() || '';
	t.true(output.includes('[Abbrechen]'));

	// Tab should cycle back to checkIn field
	stdin.write('\t');
	output = lastFrame() || '';
	t.true(output.includes('Beginn:'));
});

test('AttendanceEditForm handles Shift+Tab navigation backward', t => {
	const {lastFrame, stdin} = render(
		React.createElement(AttendanceEditForm, mockProps),
	);

	// Initially should be on checkIn field
	let output = lastFrame() || '';
	t.true(output.includes('Beginn:'));

	// Shift+Tab should go to cancel (backward from checkIn)
	stdin.write('\u001b[Z'); // Shift+Tab escape sequence
	output = lastFrame() || '';
	t.true(output.includes('[Abbrechen]'));

	// Shift+Tab should go to submit
	stdin.write('\u001b[Z');
	output = lastFrame() || '';
	t.true(output.includes('[Speichern]'));

	// Shift+Tab should go to break
	stdin.write('\u001b[Z');
	output = lastFrame() || '';
	t.true(output.includes('Pause:'));

	// Shift+Tab should go to checkOut
	stdin.write('\u001b[Z');
	output = lastFrame() || '';
	t.true(output.includes('Ende:'));

	// Shift+Tab should go back to checkIn
	stdin.write('\u001b[Z');
	output = lastFrame() || '';
	t.true(output.includes('Beginn:'));
});

test('AttendanceEditForm Tab and Shift+Tab navigation cycles correctly', t => {
	const {lastFrame, stdin} = render(
		React.createElement(AttendanceEditForm, mockProps),
	);

	// Start at checkIn field
	let output = lastFrame() || '';
	t.true(output.includes('Beginn:'));

	// Tab forward twice to get to break
	stdin.write('\t'); // checkIn -> checkOut
	stdin.write('\t'); // checkOut -> break
	output = lastFrame() || '';
	t.true(output.includes('Pause:'));

	// Shift+Tab backward to checkOut
	stdin.write('\u001b[Z'); // break -> checkOut
	output = lastFrame() || '';
	t.true(output.includes('Ende:'));

	// Tab forward to break again
	stdin.write('\t'); // checkOut -> break
	output = lastFrame() || '';
	t.true(output.includes('Pause:'));

	// Continue forward to submit
	stdin.write('\t'); // break -> submit
	output = lastFrame() || '';
	t.true(output.includes('[Speichern]'));

	// Shift+Tab backward to break
	stdin.write('\u001b[Z'); // submit -> break
	output = lastFrame() || '';
	t.true(output.includes('Pause:'));
});

test('AttendanceEditForm shows correct help text for navigation', t => {
	const {lastFrame} = render(
		React.createElement(AttendanceEditForm, mockProps),
	);

	const output = lastFrame() || '';
	t.true(output.includes('[Tab] Feld wechseln'));
	t.true(output.includes('[Shift+Tab] Zurück'));
	t.true(output.includes('[Enter] Speichern'));
	t.true(output.includes('[Esc] Abbrechen'));
});

test('AttendanceEditForm Escape cancels from any focus area', t => {
	let cancelled = false;
	const cancelProps = {
		...mockProps,
		onCancel: () => {
			cancelled = true;
		},
	};

	const {stdin} = render(React.createElement(AttendanceEditForm, cancelProps));

	// Start at checkIn field, press Escape
	stdin.write('\u001b'); // Escape
	t.true(cancelled);

	// Reset and test from different focus areas
	cancelled = false;

	// Tab to checkOut field and press Escape
	stdin.write('\t'); // checkIn -> checkOut
	stdin.write('\u001b'); // Escape
	t.true(cancelled);
});

test('AttendanceEditForm Enter submits from submit button', t => {
	let submitted = false;
	const submitProps = {
		...mockProps,
		onSubmit: () => {
			submitted = true;
		},
	};

	const {stdin} = render(React.createElement(AttendanceEditForm, submitProps));

	// Tab to submit button
	stdin.write('\t'); // checkIn -> checkOut
	stdin.write('\t'); // checkOut -> break
	stdin.write('\t'); // break -> submit

	// Press Enter on submit button
	stdin.write('\r'); // Enter
	t.true(submitted);
});
