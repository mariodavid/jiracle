import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {InlineWorklogForm} from '../../components/InlineWorklogForm.js';
import {Duration} from '../../domain/Duration.js';
import {LocalDate} from '../../domain/LocalDate.js';

const mockProps = {
	date: LocalDate.fromString('2025-07-10'),
	defaultTimeSpent: new Duration('1h'),
	defaultComment: '',
	onSubmit() {},
	onCancel() {},
	isIssueKeyEditable: true,
};

test('InlineWorklogForm extracts issue key from pasted URL', async t => {
	const {lastFrame, stdin} = render(
		React.createElement(InlineWorklogForm, mockProps),
	);

	// Write a full URL
	const url = 'https://jira.convista.com/browse/FZSUITE-758';
	stdin.write(url);

	// Check immediately without hitting enter
	// Ink/React updates are async. We need to wait for the effect to process the input.
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	const output = lastFrame() ?? '';

	// Debug print if it fails
	if (!output.includes('FZSUITE-758') || output.includes('https://')) {
		console.log('DEBUG OUTPUT:', output);
	}

	t.true(output.includes('FZSUITE-758'), 'Output should contain the key');
	t.false(
		output.includes('https://'),
		'Output should NOT contain the full URL prefix',
	);
});

test('InlineWorklogForm extracts issue key from URL upon submission', async t => {
	let submittedData: any = null;

	const props = {
		...mockProps,
		onSubmit(data: any) {
			submittedData = data;
		},
	};

	const {stdin} = render(React.createElement(InlineWorklogForm, props));

	const url = 'https://jira.convista.com/browse/FZSUITE-758';

	// Type the URL
	stdin.write(url);
	// Enter to confirm IssueKey -> moves to Date
	stdin.write('\r');

	await new Promise(resolve => {
		setTimeout(resolve, 50);
	});

	// Enter to confirm Date -> moves to Time
	stdin.write('\r');
	await new Promise(resolve => {
		setTimeout(resolve, 50);
	});

	// Enter to confirm Time -> moves to Comment
	stdin.write('\r');
	await new Promise(resolve => {
		setTimeout(resolve, 50);
	});

	// Enter to confirm Comment -> moves to Submit button? Or submits?
	// Comment field usually submits on Enter if not multiline?
	// Let's check InlineWorklogForm:
	// TextInput for comment: onSubmit={handleSubmit}

	stdin.write('\r');
	await new Promise(resolve => {
		setTimeout(resolve, 50);
	});

	// Submit button might need another enter if focus moved there?
	// Logic:
	// comment -> submit (focus)
	// submit -> handleSubmit

	// So we might need one more Enter.
	stdin.write('\r');
	await new Promise(resolve => {
		setTimeout(resolve, 50);
	});

	t.truthy(submittedData, 'Should have submitted data');
	t.is(submittedData?.issueKey?.toString(), 'FZSUITE-758');
});
