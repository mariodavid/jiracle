import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import MainMenu from '../../components/MainMenu.js';
import {delays} from '../utils/testUtils.js';

test('should render main menu question', async t => {
	const onSelect = (_value: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(MainMenu, {onSelect}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	t.true(output?.includes('What would you like to do?') ?? false);

	unmount();
});

test('should render all menu options', async t => {
	const onSelect = (_value: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(MainMenu, {onSelect}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	t.true(output?.includes('Log Work') ?? false);
	t.true(output?.includes('Week Overview') ?? false);
	t.true(output?.includes('Settings') ?? false);

	unmount();
});

test('should call onSelect when first option is selected', async t => {
	let selectedValue = '';
	const onSelect = (value: string) => {
		selectedValue = value;
	};

	const {stdin, unmount} = render(React.createElement(MainMenu, {onSelect}));

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	// Select first option (Log Work)
	stdin.write('\r');
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	t.is(selectedValue, 'log-work');

	unmount();
});

test('should call onSelect when second option is selected', async t => {
	let selectedValue = '';
	const onSelect = (value: string) => {
		selectedValue = value;
	};

	const {stdin, unmount} = render(React.createElement(MainMenu, {onSelect}));

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	// Navigate to second option (Week Overview)
	stdin.write('\u001B\u005B\u0042'); // Arrow down
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));
	stdin.write('\r'); // Enter
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	t.is(selectedValue, 'week-overview');

	unmount();
});

test('should call onSelect when third option is selected', async t => {
	let selectedValue = '';
	const onSelect = (value: string) => {
		selectedValue = value;
	};

	const {stdin, unmount} = render(React.createElement(MainMenu, {onSelect}));

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	// Navigate to third option (Settings)
	stdin.write('\u001B\u005B\u0042'); // Arrow down
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));
	stdin.write('\u001B\u005B\u0042'); // Arrow down
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));
	stdin.write('\r'); // Enter
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	t.is(selectedValue, 'settings');

	unmount();
});

test('should handle navigation with arrow keys', async t => {
	let selectedValue = '';
	const onSelect = (value: string) => {
		selectedValue = value;
	};

	const {stdin, unmount} = render(React.createElement(MainMenu, {onSelect}));

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

	t.is(selectedValue, 'week-overview');

	unmount();
});

test('should not call onSelect multiple times', async t => {
	let callCount = 0;
	const onSelect = (_value: string) => {
		callCount++;
	};

	const {stdin, unmount} = render(React.createElement(MainMenu, {onSelect}));

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
		React.createElement(MainMenu, {onSelect}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();

	// Should render something substantial
	t.true(output !== null);
	t.true(output !== '');
	t.true(output!.length > 20); // Should have substantial content

	unmount();
});

test('should handle onSelect callback errors gracefully', async t => {
	const onSelect = (_value: string) => {
		throw new Error('Test error');
	};

	const {stdin, unmount} = render(React.createElement(MainMenu, {onSelect}));

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	// This should not crash the test
	t.notThrows(() => {
		stdin.write('\r');
	});

	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	unmount();
});
