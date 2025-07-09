import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import IssueSelectionMode from '../../components/IssueSelectionMode.js';
import {delays} from '../utils/testUtils.js';

test('should render issue selection mode question', async t => {
	const onSelect = (_value: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(IssueSelectionMode, {onSelect}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	t.true(output?.includes('How would you like to select an issue?') ?? false);

	unmount();
});

test('should render all issue selection mode options', async t => {
	const onSelect = (_value: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(IssueSelectionMode, {onSelect}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	t.true(output?.includes('Favorites') ?? false);
	t.true(output?.includes('Assigned Issues') ?? false);
	t.true(output?.includes('Other (Enter Issue Key)') ?? false);

	unmount();
});

test('should display ESC hint for going back to main menu', async t => {
	const onSelect = (_value: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(IssueSelectionMode, {onSelect}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	t.true(output?.includes('Press ESC to go back to main menu') ?? false);

	unmount();
});

test('should call onSelect when favorites option is selected', async t => {
	let selectedValue = '';
	const onSelect = (value: string) => {
		selectedValue = value;
	};

	const {stdin, unmount} = render(
		React.createElement(IssueSelectionMode, {onSelect}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	// Select first option (Favorites)
	stdin.write('\r');
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	t.is(selectedValue, 'favorites');

	unmount();
});

test('should call onSelect when assigned option is selected', async t => {
	let selectedValue = '';
	const onSelect = (value: string) => {
		selectedValue = value;
	};

	const {stdin, unmount} = render(
		React.createElement(IssueSelectionMode, {onSelect}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	// Navigate to second option (Assigned Issues)
	stdin.write('\u001B\u005B\u0042'); // Arrow down
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));
	stdin.write('\r'); // Enter
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	t.is(selectedValue, 'assigned');

	unmount();
});

test('should call onSelect when other option is selected', async t => {
	let selectedValue = '';
	const onSelect = (value: string) => {
		selectedValue = value;
	};

	const {stdin, unmount} = render(
		React.createElement(IssueSelectionMode, {onSelect}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	// Navigate to third option (Other)
	stdin.write('\u001B\u005B\u0042'); // Arrow down
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));
	stdin.write('\u001B\u005B\u0042'); // Arrow down
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));
	stdin.write('\r'); // Enter
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	t.is(selectedValue, 'other');

	unmount();
});

test('should handle navigation with arrow keys', async t => {
	let selectedValue = '';
	const onSelect = (value: string) => {
		selectedValue = value;
	};

	const {stdin, unmount} = render(
		React.createElement(IssueSelectionMode, {onSelect}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	// Navigate down then up then down then select
	stdin.write('\u001B\u005B\u0042'); // Arrow down
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));
	stdin.write('\u001B\u005B\u0041'); // Arrow up
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));
	stdin.write('\u001B\u005B\u0042'); // Arrow down
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));
	stdin.write('\r'); // Enter
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	t.is(selectedValue, 'assigned');

	unmount();
});

test('should not call onSelect multiple times', async t => {
	let callCount = 0;
	const onSelect = (_value: string) => {
		callCount++;
	};

	const {stdin, unmount} = render(
		React.createElement(IssueSelectionMode, {onSelect}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	// Select first option
	stdin.write('\r');
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	t.is(callCount, 1);

	unmount();
});

test('should render with proper layout structure', async t => {
	const onSelect = (_value: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(IssueSelectionMode, {onSelect}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();

	// Should render something substantial
	t.true(output !== null);
	t.true(output !== '');
	t.true(output!.length > 30); // Should have substantial content

	unmount();
});

test('should handle onSelect callback errors gracefully', async t => {
	const onSelect = (_value: string) => {
		throw new Error('Test error');
	};

	const {stdin, unmount} = render(
		React.createElement(IssueSelectionMode, {onSelect}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	// This should not crash the test
	t.notThrows(() => {
		stdin.write('\r');
	});

	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	unmount();
});
