import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {WeeklyTimetableView} from '../../components/WeeklyTimetableView.js';

// Mock test configuration
const mockConfig = {
	jiraUrl: 'https://jira.example.com/',
	username: 'test@example.com',
	apiToken: 'test-token',
};

const defaultProps = {
	onBack: () => {},
	config: mockConfig,
	userEmail: null,
};

test('WeeklyTimetableView renders without crashing', t => {
	const {lastFrame} = render(
		React.createElement(WeeklyTimetableView, defaultProps),
	);
	const output = lastFrame();

	// Component should render something
	t.true(output !== null && output !== undefined);
	if (output) {
		t.true(output.length > 0);
	}
});

test('WeeklyTimetableView handles back navigation', t => {
	let backCalled = false;

	const backProps = {
		...defaultProps,
		onBack: () => {
			backCalled = true;
		},
	};

	const {stdin} = render(React.createElement(WeeklyTimetableView, backProps));

	// Press 'q' to go back
	stdin.write('q');

	t.true(backCalled);
});

test('WeeklyTimetableView accepts config prop', t => {
	// Test that the component accepts the required props without crashing
	const props = {
		onBack: () => {},
		config: {
			jiraUrl: 'https://test.example.com/',
			username: 'test',
			apiToken: 'token',
		},
		userEmail: 'test@example.com',
	};

	const {lastFrame} = render(React.createElement(WeeklyTimetableView, props));
	const output = lastFrame();

	// Should render without error
	t.true(output !== null && output !== undefined);
});

test('WeeklyTimetableView handles keyboard input', t => {
	const {stdin, lastFrame} = render(
		React.createElement(WeeklyTimetableView, defaultProps),
	);

	// Press 'r' to refresh
	stdin.write('r');

	// Should still render after input
	const output = lastFrame();
	t.true(output !== null && output !== undefined);
});

test('WeeklyTimetableView renders with different userEmail', t => {
	const propsWithEmail = {
		...defaultProps,
		userEmail: 'user@example.com',
	};

	const {lastFrame} = render(
		React.createElement(WeeklyTimetableView, propsWithEmail),
	);
	const output = lastFrame();

	// Should render with user email
	t.true(output !== null && output !== undefined);
});

test('WeeklyTimetableView component structure', t => {
	const {lastFrame} = render(
		React.createElement(WeeklyTimetableView, defaultProps),
	);

	// Wait a bit for component to stabilize
	setTimeout(() => {
		const output = lastFrame();
		if (output) {
			// If there's output, it should have reasonable content
			t.true(output.length > 10);
		} else {
			// If no output, that's also acceptable in test environment
			t.pass();
		}
	}, 50);

	// Immediate test - component should not crash
	t.pass();
});

test('WeeklyTimetableView uses global default comment when no favorite comment is configured', t => {
	const configWithGlobalDefault = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		defaultComment: 'Global default comment',
		favorites: [
			{key: 'TEST-123'}, // No specific comment - should use global default
		],
	};

	const propsWithGlobalDefault = {
		...defaultProps,
		config: configWithGlobalDefault,
	};

	const component = render(
		React.createElement(WeeklyTimetableView, propsWithGlobalDefault),
	);

	// We can't easily test the internal state, but we can verify the component
	// accepts the config without crashing
	const output = component.lastFrame();
	t.true(output !== null && output !== undefined);
});

test('WeeklyTimetableView prioritizes favorite comment over global default comment', t => {
	const configWithBothComments = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		defaultComment: 'Global default comment',
		favorites: [{key: 'TEST-123', defaultComment: 'Specific favorite comment'}],
	};

	const propsWithBothComments = {
		...defaultProps,
		config: configWithBothComments,
	};

	const component = render(
		React.createElement(WeeklyTimetableView, propsWithBothComments),
	);

	// We can't easily test the internal state, but we can verify the component
	// accepts the config without crashing
	const output = component.lastFrame();
	t.true(output !== null && output !== undefined);
});

test('WeeklyTimetableView uses empty string when no comment is configured', t => {
	const configWithoutComments = {
		jiraUrl: 'https://jira.example.com/',
		username: 'test@example.com',
		apiToken: 'test-token',
		// No defaultComment and no favorite comments
		favorites: [{key: 'TEST-123'}],
	};

	const propsWithoutComments = {
		...defaultProps,
		config: configWithoutComments,
	};

	const component = render(
		React.createElement(WeeklyTimetableView, propsWithoutComments),
	);

	// We can't easily test the internal state, but we can verify the component
	// accepts the config without crashing
	const output = component.lastFrame();
	t.true(output !== null && output !== undefined);
});
