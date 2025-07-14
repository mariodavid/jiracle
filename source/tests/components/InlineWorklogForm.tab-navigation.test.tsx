import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {InlineWorklogForm} from '../../components/InlineWorklogForm.js';

const mockProps = {
	issueKey: 'TEST-123',
	date: new Date('2025-07-10T00:00:00.000Z'),
	defaultTimeSpent: '1h',
	defaultComment: '',
	onSubmit: () => {},
	onCancel: () => {},
};

test('InlineWorklogForm handles Tab navigation forward', t => {
	const {lastFrame, stdin} = render(
		React.createElement(InlineWorklogForm, mockProps),
	);

	// Initially should be on time field
	let output = lastFrame() || '';
	t.true(output.includes('Time spent:'));

	// Tab to comment field
	stdin.write('\t');
	output = lastFrame() || '';
	t.true(output.includes('Comment:'));

	// Tab to submit button
	stdin.write('\t');
	output = lastFrame() || '';
	t.true(output.includes('[Submit]'));

	// Tab to cancel button
	stdin.write('\t');
	output = lastFrame() || '';
	t.true(output.includes('[Cancel]'));

	// Tab should cycle back to time field
	stdin.write('\t');
	output = lastFrame() || '';
	t.true(output.includes('Time spent:'));
});

test('InlineWorklogForm handles Shift+Tab navigation backward', t => {
	const {lastFrame, stdin} = render(
		React.createElement(InlineWorklogForm, mockProps),
	);

	// Initially should be on time field
	let output = lastFrame() || '';
	t.true(output.includes('Time spent:'));

	// Shift+Tab should go to cancel (backward from time)
	stdin.write('\u001b[Z'); // Shift+Tab escape sequence
	output = lastFrame() || '';
	t.true(output.includes('[Cancel]'));

	// Shift+Tab should go to submit
	stdin.write('\u001b[Z');
	output = lastFrame() || '';
	t.true(output.includes('[Submit]'));

	// Shift+Tab should go to comment
	stdin.write('\u001b[Z');
	output = lastFrame() || '';
	t.true(output.includes('Comment:'));

	// Shift+Tab should go back to time
	stdin.write('\u001b[Z');
	output = lastFrame() || '';
	t.true(output.includes('Time spent:'));
});

test('InlineWorklogForm Tab and Shift+Tab navigation cycles correctly', t => {
	const {lastFrame, stdin} = render(
		React.createElement(InlineWorklogForm, mockProps),
	);

	// Start at time field
	let output = lastFrame() || '';
	t.true(output.includes('Time spent:'));

	// Tab forward twice to get to submit
	stdin.write('\t'); // time -> comment
	stdin.write('\t'); // comment -> submit
	output = lastFrame() || '';
	t.true(output.includes('[Submit]'));

	// Shift+Tab backward to comment
	stdin.write('\u001b[Z'); // submit -> comment
	output = lastFrame() || '';
	t.true(output.includes('Comment:'));

	// Tab forward to submit again
	stdin.write('\t'); // comment -> submit
	output = lastFrame() || '';
	t.true(output.includes('[Submit]'));

	// Continue forward to cancel
	stdin.write('\t'); // submit -> cancel
	output = lastFrame() || '';
	t.true(output.includes('[Cancel]'));

	// Shift+Tab backward to submit
	stdin.write('\u001b[Z'); // cancel -> submit
	output = lastFrame() || '';
	t.true(output.includes('[Submit]'));
});

test('InlineWorklogForm Escape cancels from any focus area', t => {
	let cancelled = false;
	const cancelProps = {
		...mockProps,
		onCancel: () => {
			cancelled = true;
		},
	};

	const {stdin} = render(React.createElement(InlineWorklogForm, cancelProps));

	// Start at time field, press Escape
	stdin.write('\u001b'); // Escape
	t.true(cancelled);

	// Reset and test from different focus areas
	cancelled = false;

	// Tab to comment field and press Escape
	stdin.write('\t'); // time -> comment
	stdin.write('\u001b'); // Escape
	t.true(cancelled);
});
