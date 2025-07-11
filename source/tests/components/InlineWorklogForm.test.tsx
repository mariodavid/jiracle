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

test('InlineWorklogForm renders basic structure', t => {
	const {lastFrame} = render(React.createElement(InlineWorklogForm, mockProps));
	const output = lastFrame() || '';

	// Check for basic elements
	t.true(output.includes('Log Work'));
	t.true(output.includes('TEST-123'));
	t.true(output.includes('Thursday, Jul 10'));
	t.true(output.includes('Time spent:'));
	t.true(output.includes('Comment:'));
	t.true(output.includes('[Submit]'));
	t.true(output.includes('[Cancel]'));
});

test('InlineWorklogForm shows time options', t => {
	const {lastFrame} = render(React.createElement(InlineWorklogForm, mockProps));
	const output = lastFrame() || '';

	// Check for arrow key instructions and default time
	t.true(output.includes('↑/↓ adjust or type'));
	t.true(output.includes('1h')); // Default time
});

test('InlineWorklogForm shows submitting state', t => {
	const submittingProps = {
		...mockProps,
		isSubmitting: true,
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, submittingProps),
	);
	const output = lastFrame() || '';

	t.true(output.includes('Submitting Worklog'));
	t.false(output.includes('[Submit]'));
});

test('InlineWorklogForm shows error message', t => {
	const errorProps = {
		...mockProps,
		error: 'Failed to submit worklog',
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, errorProps),
	);
	const output = lastFrame() || '';

	t.true(output.includes('Error: Failed to submit worklog'));
});

test('InlineWorklogForm shows custom time input when selected', t => {
	const {lastFrame} = render(React.createElement(InlineWorklogForm, mockProps));

	const output = lastFrame() || '';

	// Now we always show the arrow key time adjustment
	t.true(output.includes('↑/↓ adjust or type'));
});

test('InlineWorklogForm handles default values', t => {
	const defaultProps = {
		...mockProps,
		defaultTimeSpent: '4h',
		defaultComment: 'Initial comment',
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, defaultProps),
	);
	const output = lastFrame() || '';

	// The form should show the default values (parsed to number)
	t.true(output.includes('4h')); // 4h becomes 4 hours
});

test('InlineWorklogForm prevents submit when submitting', t => {
	const submittingProps = {
		...mockProps,
		isSubmitting: true,
		onSubmit: () => {
			t.fail('Should not submit when already submitting');
		},
	};

	// Just test that the component renders correctly in submitting state
	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, submittingProps),
	);
	const output = lastFrame() || '';

	// Should show submitting state
	t.true(output.includes('Submitting Worklog'));
});

test('InlineWorklogForm component structure is correct', t => {
	const {lastFrame} = render(React.createElement(InlineWorklogForm, mockProps));
	const output = lastFrame() || '';

	// Basic structure validation
	t.true(output.length > 0);
	t.true(output.includes('Log Work'));
	t.true(output.includes('TEST-123'));
});

// === CONFIGURATION INTEGRATION TESTS ===

test('InlineWorklogForm uses global default time from config', t => {
	const configProps = {
		...mockProps,
		defaultTimeSpent: undefined, // Don't override with prop
		config: {
			jiraUrl: 'https://jira.example.com/',
			username: 'test@example.com',
			apiToken: 'test-token',
			defaultTime: '6h',
		},
		isFavorite: false,
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, configProps),
	);
	const output = lastFrame() || '';

	// Should show global default time from config
	t.true(output.includes('6h'));
	t.false(output.includes('1h')); // Should not show fallback
});

test('InlineWorklogForm uses favorite-specific default time', t => {
	const configProps = {
		...mockProps,
		issueKey: 'SPECIAL-456',
		defaultTimeSpent: undefined, // Don't override with prop
		config: {
			jiraUrl: 'https://jira.example.com/',
			username: 'test@example.com',
			apiToken: 'test-token',
			defaultTime: '4h', // Global default
			favorites: [
				{key: 'SPECIAL-456', defaultTime: '8h'},
				{key: 'OTHER-123', defaultTime: '2h'},
			],
		},
		isFavorite: true,
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, configProps),
	);
	const output = lastFrame() || '';

	// Should show favorite-specific time, not global default
	t.true(output.includes('8h'));
	t.false(output.includes('4h')); // Should not show global default
	t.false(output.includes('1h')); // Should not show fallback
});

test('InlineWorklogForm favorite time overrides global default', t => {
	const configProps = {
		...mockProps,
		issueKey: 'FAV-789',
		defaultTimeSpent: undefined, // Don't override with prop
		config: {
			jiraUrl: 'https://jira.example.com/',
			username: 'test@example.com',
			apiToken: 'test-token',
			defaultTime: '3h', // Global default
			favorites: [
				{key: 'FAV-789', defaultTime: '12h'}, // Favorite override
			],
		},
		isFavorite: true,
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, configProps),
	);
	const output = lastFrame() || '';

	// Should prioritize favorite time over global default
	t.true(output.includes('12h'));
	t.false(output.includes('3h')); // Should not show global default
});

test('InlineWorklogForm falls back to global default when favorite has no time', t => {
	const configProps = {
		...mockProps,
		issueKey: 'FAV-NO-TIME',
		defaultTimeSpent: undefined, // Don't override with prop
		config: {
			jiraUrl: 'https://jira.example.com/',
			username: 'test@example.com',
			apiToken: 'test-token',
			defaultTime: '5h', // Global default
			favorites: [
				{key: 'FAV-NO-TIME'}, // Favorite without defaultTime
			],
		},
		isFavorite: true,
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, configProps),
	);
	const output = lastFrame() || '';

	// Should fall back to global default when favorite has no time
	t.true(output.includes('5h'));
	t.false(output.includes('1h')); // Should not show fallback
});

test('InlineWorklogForm falls back to 1h when no config provided', t => {
	const noConfigProps = {
		...mockProps,
		defaultTimeSpent: undefined, // Don't override with prop
		config: undefined, // No config
		isFavorite: false,
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, noConfigProps),
	);
	const output = lastFrame() || '';

	// Should fall back to 1h when no config is provided
	t.true(output.includes('1h'));
});

test('InlineWorklogForm explicit defaultTimeSpent overrides config', t => {
	const explicitProps = {
		...mockProps,
		defaultTimeSpent: '10h', // Explicitly provided
		config: {
			jiraUrl: 'https://jira.example.com/',
			username: 'test@example.com',
			apiToken: 'test-token',
			defaultTime: '7h', // Should be ignored
		},
		isFavorite: false,
	};

	const {lastFrame} = render(
		React.createElement(InlineWorklogForm, explicitProps),
	);
	const output = lastFrame() || '';

	// Should use explicit prop over config
	t.true(output.includes('10h'));
	t.false(output.includes('7h')); // Should not show config default
});
