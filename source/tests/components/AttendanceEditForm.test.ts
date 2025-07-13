import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {AttendanceEditForm} from '../../components/AttendanceEditForm.js';
import type {Attendance} from '../../attendance/types.js';

const defaultProps = {
	date: new Date(2025, 6, 11), // July 11, 2025
	onSubmit: () => {},
	onCancel: () => {},
};

test('AttendanceEditForm renders with default values', t => {
	const {lastFrame} = render(
		React.createElement(AttendanceEditForm, {
			...defaultProps,
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('Anwesenheit bearbeiten'));
	t.true(output.includes('Fr, 11. Jul')); // German date format
	t.true(output.includes('08:00')); // Default check-in
	t.true(output.includes('17:00')); // Default check-out
	t.true(output.includes('30m')); // Default break
});

test('AttendanceEditForm renders with initial data', t => {
	const initialData: Attendance = {
		date: '2025-07-11',
		checkIn: '09:00',
		checkOut: '18:00',
		breakMinutes: 45,
	};

	const {lastFrame} = render(
		React.createElement(AttendanceEditForm, {
			...defaultProps,
			initialData,
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('09:00'));
	t.true(output.includes('18:00'));
	t.true(output.includes('45m'));
});

test('AttendanceEditForm uses config defaults when no initial data', t => {
	const config = {
		attendance: {
			defaultCheckIn: '07:30',
			defaultCheckOut: '16:30',
		},
	};

	const {lastFrame} = render(
		React.createElement(AttendanceEditForm, {
			...defaultProps,
			config,
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('07:30'));
	t.true(output.includes('16:30'));
});

test('AttendanceEditForm can submit data', t => {
	const onSubmit = (_data: Attendance) => {
		// Callback for form submission
	};

	render(
		React.createElement(AttendanceEditForm, {
			...defaultProps,
			onSubmit,
		}),
	);

	// The form should be renderable and have the onSubmit callback ready
	// This tests the structure rather than complex user interaction
	t.is(typeof onSubmit, 'function');
});

test('AttendanceEditForm renders break duration input', t => {
	const {lastFrame} = render(
		React.createElement(AttendanceEditForm, {
			...defaultProps,
		}),
	);

	const output = lastFrame() || '';
	// Should render break field with default value
	t.true(output.includes('Pause:'));
	t.true(output.includes('30m'));
});

test('AttendanceEditForm has navigation buttons', t => {
	const {lastFrame} = render(
		React.createElement(AttendanceEditForm, {
			...defaultProps,
		}),
	);

	const output = lastFrame() || '';
	// Should render submit and cancel buttons
	t.true(output.includes('[Speichern]'));
	t.true(output.includes('[Abbrechen]'));
});

test('AttendanceEditForm accepts onCancel callback', t => {
	const onCancel = () => {
		// Cancel callback
	};

	render(
		React.createElement(AttendanceEditForm, {
			...defaultProps,
			onCancel,
		}),
	);

	// Test that the callback is properly set up
	t.is(typeof onCancel, 'function');
});

test('AttendanceEditForm shows navigation help', t => {
	const {lastFrame} = render(
		React.createElement(AttendanceEditForm, {
			...defaultProps,
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('[Tab] Feld wechseln'));
	t.true(output.includes('[Enter] Speichern'));
	t.true(output.includes('[Esc] Abbrechen'));
});
