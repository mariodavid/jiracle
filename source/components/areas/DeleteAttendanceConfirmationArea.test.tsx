import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import type {DeleteAttendanceCandidate} from '../../hooks/useDeleteOperations.js';
import {DeleteAttendanceConfirmationArea} from './DeleteAttendanceConfirmationArea.js';

const mockDeleteAttendanceCandidate: DeleteAttendanceCandidate = {
	date: new Date('2024-01-15'),
};

const mockFormatDate = (date: Date) => {
	const days = [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
	];
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	];
	return `${days[date.getDay()] ?? 'Unknown'}, ${
		months[date.getMonth()] ?? 'Unknown'
	} ${date.getDate()}`;
};

test('DeleteAttendanceConfirmationArea renders with formatted date', t => {
	const mockOnConfirm = () => {};

	const {lastFrame} = render(
		<DeleteAttendanceConfirmationArea
			deleteAttendanceCandidate={mockDeleteAttendanceCandidate}
			isDeletingAttendance={false}
			formatDate={mockFormatDate}
			onConfirm={mockOnConfirm}
		/>,
	);

	const output = lastFrame();
	t.truthy(output);
	t.true(output!.includes('Monday, Jan 15'));
});

test('DeleteAttendanceConfirmationArea shows loading state', t => {
	const mockOnConfirm = () => {};

	const {lastFrame} = render(
		<DeleteAttendanceConfirmationArea
			deleteAttendanceCandidate={mockDeleteAttendanceCandidate}
			isDeletingAttendance={true}
			formatDate={mockFormatDate}
			onConfirm={mockOnConfirm}
		/>,
	);

	const output = lastFrame();
	t.truthy(output);
	t.true(output!.includes('Deleting attendance...'));
});

test('DeleteAttendanceConfirmationArea handles confirmation callback', t => {
	let confirmCalled = false;
	let confirmValue: boolean | undefined;

	const mockOnConfirm = (confirmed: boolean) => {
		confirmCalled = true;
		confirmValue = confirmed;
	};

	const {stdin} = render(
		<DeleteAttendanceConfirmationArea
			deleteAttendanceCandidate={mockDeleteAttendanceCandidate}
			isDeletingAttendance={false}
			formatDate={mockFormatDate}
			onConfirm={mockOnConfirm}
		/>,
	);

	// Simulate pressing 'y' for confirm
	stdin.write('y');

	t.true(confirmCalled);
	t.is(confirmValue, true);
});

test('DeleteAttendanceConfirmationArea handles cancellation callback', t => {
	let confirmCalled = false;
	let confirmValue: boolean | undefined;

	const mockOnConfirm = (confirmed: boolean) => {
		confirmCalled = true;
		confirmValue = confirmed;
	};

	const {stdin} = render(
		<DeleteAttendanceConfirmationArea
			deleteAttendanceCandidate={mockDeleteAttendanceCandidate}
			isDeletingAttendance={false}
			formatDate={mockFormatDate}
			onConfirm={mockOnConfirm}
		/>,
	);

	// Simulate pressing 'n' for cancel
	stdin.write('n');

	t.true(confirmCalled);
	t.is(confirmValue, false);
});

test('DeleteAttendanceConfirmationArea handles different dates', t => {
	const differentCandidate: DeleteAttendanceCandidate = {
		date: new Date('2024-12-25'),
	};

	const mockOnConfirm = () => {};

	const {lastFrame} = render(
		<DeleteAttendanceConfirmationArea
			deleteAttendanceCandidate={differentCandidate}
			isDeletingAttendance={false}
			formatDate={mockFormatDate}
			onConfirm={mockOnConfirm}
		/>,
	);

	const output = lastFrame();
	t.truthy(output);
	t.true(output!.includes('Wednesday, Dec 25'));
});

test('DeleteAttendanceConfirmationArea uses correct dialog styling', t => {
	const mockOnConfirm = () => {};

	const {lastFrame} = render(
		<DeleteAttendanceConfirmationArea
			deleteAttendanceCandidate={mockDeleteAttendanceCandidate}
			isDeletingAttendance={false}
			formatDate={mockFormatDate}
			onConfirm={mockOnConfirm}
		/>,
	);

	const output = lastFrame();
	// Check that the component renders (red border and padding are handled by ConfirmationDialog)
	t.truthy(output);
	t.true(output!.length > 0);
});
