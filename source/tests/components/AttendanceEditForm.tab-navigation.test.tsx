import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {AttendanceEditForm} from '../../components/AttendanceEditForm.js';
import {InkTestHelpers} from '../utils/ink-test-helpers.js';
import {LocalDate} from '../../domain/LocalDate.js';

const mockProps = {
	date: LocalDate.fromString('2025-07-11'),
	onSubmit() {},
	onCancel() {},
};

test('AttendanceEditForm handles Tab navigation forward', t => {
	const {lastFrame, stdin} = render(
		React.createElement(AttendanceEditForm, mockProps),
	);

	// Initially should be on checkIn field
	let output = lastFrame() ?? '';
	t.true(output.includes('Beginn:'));

	// Tab to checkOut field
	stdin.write('\t');
	output = lastFrame() ?? '';
	t.true(output.includes('Ende:'));

	// Tab to break field
	stdin.write('\t');
	output = lastFrame() ?? '';
	t.true(output.includes('Pause:'));

	// Tab to submit button
	stdin.write('\t');
	output = lastFrame() ?? '';
	t.true(output.includes('[Speichern]'));

	// Tab to cancel button
	stdin.write('\t');
	output = lastFrame() ?? '';
	t.true(output.includes('[Abbrechen]'));

	// Tab should cycle back to checkIn field
	stdin.write('\t');
	output = lastFrame() ?? '';
	t.true(output.includes('Beginn:'));
});

test('AttendanceEditForm handles Shift+Tab navigation backward', t => {
	const {lastFrame, stdin} = render(
		React.createElement(AttendanceEditForm, mockProps),
	);

	// Initially should be on checkIn field
	let output = lastFrame() ?? '';
	t.true(output.includes('Beginn:'));

	// Shift+Tab should go to cancel (backward from checkIn)
	stdin.write('\u001B[Z'); // Shift+Tab escape sequence
	output = lastFrame() ?? '';
	t.true(output.includes('[Abbrechen]'));

	// Shift+Tab should go to submit
	stdin.write('\u001B[Z');
	output = lastFrame() ?? '';
	t.true(output.includes('[Speichern]'));

	// Shift+Tab should go to break
	stdin.write('\u001B[Z');
	output = lastFrame() ?? '';
	t.true(output.includes('Pause:'));

	// Shift+Tab should go to checkOut
	stdin.write('\u001B[Z');
	output = lastFrame() ?? '';
	t.true(output.includes('Ende:'));

	// Shift+Tab should go back to checkIn
	stdin.write('\u001B[Z');
	output = lastFrame() ?? '';
	t.true(output.includes('Beginn:'));
});

test('AttendanceEditForm Tab and Shift+Tab navigation cycles correctly', t => {
	const {lastFrame, stdin} = render(
		React.createElement(AttendanceEditForm, mockProps),
	);

	// Start at checkIn field
	let output = lastFrame() ?? '';
	t.true(output.includes('Beginn:'));

	// Tab forward twice to get to break
	stdin.write('\t'); // CheckIn -> checkOut
	stdin.write('\t'); // CheckOut -> break
	output = lastFrame() ?? '';
	t.true(output.includes('Pause:'));

	// Shift+Tab backward to checkOut
	stdin.write('\u001B[Z'); // Break -> checkOut
	output = lastFrame() ?? '';
	t.true(output.includes('Ende:'));

	// Tab forward to break again
	stdin.write('\t'); // CheckOut -> break
	output = lastFrame() ?? '';
	t.true(output.includes('Pause:'));

	// Continue forward to submit
	stdin.write('\t'); // Break -> submit
	output = lastFrame() ?? '';
	t.true(output.includes('[Speichern]'));

	// Shift+Tab backward to break
	stdin.write('\u001B[Z'); // Submit -> break
	output = lastFrame() ?? '';
	t.true(output.includes('Pause:'));
});

test('AttendanceEditForm shows correct help text for navigation', t => {
	const {lastFrame} = render(
		React.createElement(AttendanceEditForm, mockProps),
	);

	const output = lastFrame() ?? '';
	t.true(output.includes('[Tab] Feld wechseln'));
	t.true(output.includes('[Shift+Tab] Zurück'));
	t.true(output.includes('[Enter] Speichern'));
	t.true(output.includes('[Esc] Abbrechen'));
});

test('AttendanceEditForm Escape cancels from any focus area', async t => {
	let cancelled = false;
	const cancelProps = {
		...mockProps,
		onCancel() {
			cancelled = true;
		},
	};

	const {stdin, lastFrame} = render(
		React.createElement(AttendanceEditForm, cancelProps),
	);

	// Allow component to fully initialize focus and input handling
	await InkTestHelpers.delay(100);

	// Verify tab works first
	stdin.write('\t'); // CheckIn -> checkOut
	await InkTestHelpers.delay(50);
	const output = lastFrame() ?? '';
	t.true(output.includes('Ende:')); // Should be on checkOut field

	// Now try escape
	stdin.write('\u001B'); // Hex escape sequence
	await InkTestHelpers.delay(100); // Allow event processing
	t.true(cancelled);

	// Reset and test from original position
	cancelled = false;
	const {stdin: stdin2} = render(
		React.createElement(AttendanceEditForm, cancelProps),
	);
	await InkTestHelpers.delay(100);
	stdin2.write('\u001B'); // Escape from checkIn field
	await InkTestHelpers.delay(100);
	t.true(cancelled);
});

test('AttendanceEditForm Enter submits from submit button', async t => {
	let submitted = false;
	const submitProps = {
		...mockProps,
		onSubmit() {
			submitted = true;
		},
	};

	const {stdin} = render(React.createElement(AttendanceEditForm, submitProps));

	// Allow component to fully initialize focus and input handling
	await InkTestHelpers.delay(100);

	// Navigate to submit button using Tab (checkIn -> checkOut -> break -> submit)
	stdin.write('\t'); // CheckIn -> checkOut
	await InkTestHelpers.delay(50);
	stdin.write('\t'); // CheckOut -> break
	await InkTestHelpers.delay(50);
	stdin.write('\t'); // Break -> submit
	await InkTestHelpers.delay(50);

	// Verify we haven't submitted yet
	t.false(submitted, 'Should not submit before Enter key');

	// Now press Enter to submit
	stdin.write('\r');
	await InkTestHelpers.delay(100);

	// Now we should have submitted
	t.true(submitted, 'Enter on submit button should trigger submit');
});
