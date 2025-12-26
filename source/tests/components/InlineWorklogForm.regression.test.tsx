import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {InlineWorklogForm} from '../../components/InlineWorklogForm.js';
import {Duration} from '../../domain/Duration.js';
import {LocalDate} from '../../domain/LocalDate.js';
import type {JiraConfig} from '../../jira-client.js';

const mockConfig: JiraConfig = {
	jiraUrl: 'https://example.com',
	username: 'user',
	apiToken: 'token',
};

test('Regression: InlineWorklogForm handles rapid input (paste) without infinite loop', async t => {
	const props = {
		issueKey: undefined,
		date: LocalDate.today(),
		defaultTimeSpent: new Duration('1h'),
		defaultComment: '',
		onSubmit() {},
		onCancel() {},
		config: mockConfig,
		isIssueKeyEditable: true,
	};

	const {stdin, lastFrame, unmount} = render(
		React.createElement(InlineWorklogForm, props),
	);

	// Wait for initial render
	await new Promise(resolve => {
		setTimeout(resolve, 100);
	});

	// Simulate "pasting" a valid issue key (sending characters quickly)
	// This previously triggered "Maximum update depth exceeded" due to unstable state updates
	stdin.write('PROJ-123');

	// Wait a bit to ensure no infinite loop triggers (which would crash or timeout)
	await new Promise(resolve => {
		setTimeout(resolve, 200);
	});

	// Verify the input accepted the value
	// If the component crashed, lastFrame() might be empty or this line presumably wouldn't be reached in case of a hard crash
	const output = lastFrame() ?? '';
	t.true(output.includes('PROJ-123'), 'Input should display the pasted value');

	unmount();
});
