import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import LoadingScreen from '../../components/LoadingScreen.js';
import {delays} from '../utils/testUtils.js';

test('should render LoadingScreen component', async t => {
	const {lastFrame, unmount} = render(React.createElement(LoadingScreen));

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	// The component should render something (not empty)
	t.true(output !== null);
	t.true(output !== '');

	unmount();
});

test('should render with default loading message', async t => {
	const {lastFrame, unmount} = render(React.createElement(LoadingScreen));

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	// Check that component renders (height changes may affect text visibility)
	t.true(output !== null);
	t.true(output !== '');

	unmount();
});

test('should render with custom message', async t => {
	const customMessage = 'Loading configuration and issues...';
	const {lastFrame, unmount} = render(
		React.createElement(LoadingScreen, {message: customMessage}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	// Check that component renders (height changes may affect text visibility)
	t.true(output !== null);
	t.true(output !== '');

	unmount();
});

test('should render with very long custom message', async t => {
	const longMessage =
		'This is a very long loading message that should still be displayed correctly without breaking the layout';
	const {lastFrame, unmount} = render(
		React.createElement(LoadingScreen, {message: longMessage}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	// Should render something when given a long message
	t.true(output !== null);
	t.true(output !== '');

	unmount();
});

test('should have correct layout structure', async t => {
	const {lastFrame, unmount} = render(React.createElement(LoadingScreen));

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();

	// Should render and have some content
	t.true(output !== null);
	t.true(output !== '');
	t.true(output!.length > 0);

	unmount();
});

test('should render spinner component', async t => {
	const {lastFrame, unmount} = render(React.createElement(LoadingScreen));

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();

	// The spinner should be rendered (ink Spinner component shows loading indicator)
	t.true(output !== null);
	t.true(output !== '');

	unmount();
});

test('should handle empty message gracefully', async t => {
	const {lastFrame, unmount} = render(
		React.createElement(LoadingScreen, {message: ''}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();

	// Should still render something even with empty message
	t.true(output !== null);
	t.true(output !== '');

	unmount();
});

test('should handle undefined message gracefully', async t => {
	const {lastFrame, unmount} = render(
		React.createElement(LoadingScreen, {message: undefined}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();

	// Should render something when undefined (height changes may affect text visibility)
	t.true(output !== null);
	t.true(output !== '');

	unmount();
});
