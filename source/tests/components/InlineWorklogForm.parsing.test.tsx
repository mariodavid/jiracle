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
	// EXPLICIT TEST DATA
	const inputUrl = 'https://jira.convista.com/browse/FZSUITE-758';
	const expectedIssueKey = 'FZSUITE-758';
	const expectedDate = '2025-07-10';
	const expectedTime = '1h';

	let submittedData: any = null;

	const testProps = {
		...mockProps,
		onSubmit(data: any) {
			submittedData = data;
		},
	};

	// OPERATIONS
	const {stdin, lastFrame} = render(
		React.createElement(InlineWorklogForm, testProps),
	);

	// Type the URL and navigate through form
	stdin.write(inputUrl);
	stdin.write('\r'); // Confirm issue key

	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	stdin.write('\r'); // Confirm date

	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	stdin.write('\r'); // Confirm time

	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	stdin.write('\r'); // Confirm comment/submit

	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// Additional submit if needed
	if (submittedData === null) {
		stdin.write('\r');
		await new Promise(resolve => {
			setTimeout(resolve, 100);
		});
	}

	// SPECIFIC VALUE COMPARISONS
	t.truthy(submittedData, 'Should have submitted form data');
	t.is(
		submittedData?.issueKey?.toString(),
		expectedIssueKey,
		'Should extract correct issue key from URL',
	);
	t.is(
		submittedData?.date?.toISOString(),
		expectedDate,
		'Should use default date',
	);
	t.is(
		submittedData?.timeSpent?.toString(),
		expectedTime,
		'Should use default time',
	);

	// Verify form actually displayed the extracted issue key
	const finalOutput = lastFrame();
	t.false(
		finalOutput?.includes('https://'),
		'Should not display full URL in form',
	);
});
