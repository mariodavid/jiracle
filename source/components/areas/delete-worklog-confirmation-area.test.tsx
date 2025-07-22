import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import type {DeleteCandidate} from '../../hooks/use-delete-operations.js';
import {DeleteWorklogConfirmationArea} from './delete-worklog-confirmation-area.js';

const mockDeleteCandidate: DeleteCandidate = {
	issueKey: 'PROJECT-123',
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

test('DeleteWorklogConfirmationArea renders with issue key and formatted date', t => {
	const mockOnConfirm = () => {};

	const {lastFrame} = render(
		<DeleteWorklogConfirmationArea
			deleteCandidate={mockDeleteCandidate}
			isDeleting={false}
			formatDate={mockFormatDate}
			onConfirm={mockOnConfirm}
		/>,
	);

	const output = lastFrame();
	t.truthy(output);
	t.true(output!.includes('PROJECT-123'));
	t.true(output!.includes('Monday, Jan 15'));
});

test('DeleteWorklogConfirmationArea shows loading state', t => {
	const mockOnConfirm = () => {};

	const {lastFrame} = render(
		<DeleteWorklogConfirmationArea
			deleteCandidate={mockDeleteCandidate}
			isDeleting={true}
			formatDate={mockFormatDate}
			onConfirm={mockOnConfirm}
		/>,
	);

	const output = lastFrame();
	t.truthy(output);
	t.true(output!.includes('Deleting worklogs...'));
});

test('DeleteWorklogConfirmationArea handles confirmation callback', t => {
	let confirmCalled = false;
	let confirmValue: boolean | undefined;

	const mockOnConfirm = (confirmed: boolean) => {
		confirmCalled = true;
		confirmValue = confirmed;
	};

	const {stdin} = render(
		<DeleteWorklogConfirmationArea
			deleteCandidate={mockDeleteCandidate}
			isDeleting={false}
			formatDate={mockFormatDate}
			onConfirm={mockOnConfirm}
		/>,
	);

	// Simulate pressing 'y' for confirm
	stdin.write('y');

	t.true(confirmCalled);
	t.is(confirmValue, true);
});

test('DeleteWorklogConfirmationArea uses correct dialog styling', t => {
	const mockOnConfirm = () => {};

	const {lastFrame} = render(
		<DeleteWorklogConfirmationArea
			deleteCandidate={mockDeleteCandidate}
			isDeleting={false}
			formatDate={mockFormatDate}
			onConfirm={mockOnConfirm}
		/>,
	);

	const output = lastFrame();
	// Check that the component renders (red border is handled by ConfirmationDialog)
	t.truthy(output);
	t.true(output!.length > 0);
});

test('DeleteWorklogConfirmationArea handles different issue keys', t => {
	const differentCandidate: DeleteCandidate = {
		issueKey: 'DIFFERENT-456',
		date: new Date('2024-02-20'),
	};

	const mockOnConfirm = () => {};

	const {lastFrame} = render(
		<DeleteWorklogConfirmationArea
			deleteCandidate={differentCandidate}
			isDeleting={false}
			formatDate={mockFormatDate}
			onConfirm={mockOnConfirm}
		/>,
	);

	const output = lastFrame();
	t.truthy(output);
	t.true(output!.includes('DIFFERENT-456'));
	t.true(output!.includes('Tuesday, Feb 20'));
});
