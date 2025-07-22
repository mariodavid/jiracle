import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {Text} from 'ink';
import {ConfirmationDialog} from '../../components/confirmation-dialog.js';

test('ConfirmationDialog renders children when not loading', t => {
	const {lastFrame} = render(
		React.createElement(ConfirmationDialog, {
			children: React.createElement(Text, {}, 'Test content'),
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('Test content'));
	t.false(output.includes('Processing...'));
});

test('ConfirmationDialog shows loading state with default text', t => {
	const {lastFrame} = render(
		React.createElement(ConfirmationDialog, {
			isLoading: true,
			children: React.createElement(Text, {}, 'Test content'),
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('Processing...'));
	t.false(output.includes('Test content'));
});

test('ConfirmationDialog shows loading state with custom text', t => {
	const {lastFrame} = render(
		React.createElement(ConfirmationDialog, {
			isLoading: true,
			loadingText: 'Deleting worklogs...',
			children: React.createElement(Text, {}, 'Test content'),
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('Deleting worklogs...'));
	t.false(output.includes('Test content'));
});

test('ConfirmationDialog uses default width and border color', t => {
	const {lastFrame} = render(
		React.createElement(ConfirmationDialog, {
			children: React.createElement(Text, {}, 'Test content'),
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('Test content'));
});

test('ConfirmationDialog accepts custom width and border color', t => {
	const {lastFrame} = render(
		React.createElement(ConfirmationDialog, {
			width: 68,
			borderColor: 'red',
			children: React.createElement(Text, {}, 'Test content'),
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('Test content'));
});

test('ConfirmationDialog accepts custom padding', t => {
	const {lastFrame} = render(
		React.createElement(ConfirmationDialog, {
			paddingX: 2,
			paddingY: 2,
			children: React.createElement(Text, {}, 'Test content'),
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('Test content'));
});

test('ConfirmationDialog renders proper structure', t => {
	const {lastFrame} = render(
		React.createElement(ConfirmationDialog, {
			children: React.createElement(Text, {}, 'Test content'),
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('Test content'));
	// The component should render without errors
	t.pass();
});

test('ConfirmationDialog loading state structure', t => {
	const {lastFrame} = render(
		React.createElement(ConfirmationDialog, {
			isLoading: true,
			loadingText: 'Loading...',
			children: React.createElement(Text, {}, 'Hidden content'),
		}),
	);

	const output = lastFrame() || '';
	t.true(output.includes('Loading...'));
	t.false(output.includes('Hidden content'));
});
