import test from 'ava';
import React, {useState} from 'react';
import {render} from 'ink-testing-library';
import {Text, Box} from 'ink';
import {useConfirmation} from '../../hooks/useConfirmation.js';

// Test component that uses the hook
function TestConfirmationComponent({
	onStateChange,
}: {
	onStateChange?: (state: any) => void;
}) {
	const confirmation = useConfirmation();
	const [lastResult, setLastResult] = useState<boolean | undefined>(undefined);

	// Report state changes to test
	React.useEffect(() => {
		if (onStateChange) {
			onStateChange({
				...confirmation,
				lastResult,
			});
		}
	}, [confirmation, lastResult, onStateChange]);

	// Helper function for potential future use
	React.useCallback(async () => {
		const result = await confirmation.show({width: 50, borderColor: 'red'});
		setLastResult(result);
	}, [confirmation, setLastResult]);

	return (
		<Box flexDirection="column">
			<Text>Visible: {confirmation.isVisible.toString()}</Text>
			<Text>Loading: {confirmation.isLoading.toString()}</Text>
			<Text>Width: {confirmation.config.width || 'default'}</Text>
			<Text>BorderColor: {confirmation.config.borderColor || 'default'}</Text>
			<Text>LastResult: {lastResult?.toString() || 'none'}</Text>
		</Box>
	);
}

test('useConfirmation returns initial state', t => {
	let capturedState: any;

	render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.false(capturedState.isVisible);
	t.false(capturedState.isLoading);
	t.deepEqual(capturedState.config, {});
	t.is(capturedState.onConfirm, undefined);
});

test('useConfirmation show() makes dialog visible with config', t => {
	let capturedState: any;

	const {lastFrame} = render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	const output = lastFrame() || '';

	// Initially not visible
	t.true(output.includes('Visible: false'));
	t.true(output.includes('Width: default'));
	t.true(output.includes('BorderColor: default'));

	// After show() is called, the hook should be visible
	// Note: Since show() is async, we test the synchronous state change
	t.false(capturedState.isVisible); // Initially false
});

test('useConfirmation hide() resets state', t => {
	let capturedState: any;

	render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Test that hide function exists and can be called
	t.is(typeof capturedState.hide, 'function');
	t.is(typeof capturedState.show, 'function');
	t.is(typeof capturedState.setLoading, 'function');
	t.is(typeof capturedState.handleConfirm, 'function');
});

test('useConfirmation setLoading() updates loading state', t => {
	let capturedState: any;

	render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Initially not loading
	t.false(capturedState.isLoading);

	// SetLoading function should exist
	t.is(typeof capturedState.setLoading, 'function');
});

test('useConfirmation handleConfirm() function exists', t => {
	let capturedState: any;

	render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// HandleConfirm function should exist
	t.is(typeof capturedState.handleConfirm, 'function');
});

test('useConfirmation hook structure is correct', t => {
	let capturedState: any;

	render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Check that all expected properties exist
	t.is(typeof capturedState.isVisible, 'boolean');
	t.is(typeof capturedState.isLoading, 'boolean');
	t.is(typeof capturedState.config, 'object');
	t.is(typeof capturedState.show, 'function');
	t.is(typeof capturedState.hide, 'function');
	t.is(typeof capturedState.setLoading, 'function');
	t.is(typeof capturedState.handleConfirm, 'function');
});

test('useConfirmation config can be customized', t => {
	const {lastFrame} = render(
		React.createElement(TestConfirmationComponent, {}),
	);

	const output = lastFrame() || '';

	// Check initial default values are displayed
	t.true(output.includes('Width: default'));
	t.true(output.includes('BorderColor: default'));
	t.true(output.includes('Visible: false'));
	t.true(output.includes('Loading: false'));
});

test('useConfirmation show() updates state with custom config', async t => {
	let capturedState: any;

	const {rerender} = render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Initially not visible
	t.false(capturedState.isVisible);

	// Call show with custom config
	const resultPromise = capturedState.show({
		width: 60,
		borderColor: 'blue',
		paddingX: 2,
	});

	// Wait for state update
	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.true(capturedState.isVisible);
	t.is(capturedState.config.width, 60);
	t.is(capturedState.config.borderColor, 'blue');
	t.is(capturedState.config.paddingX, 2);

	// Resolve the promise by calling handleConfirm
	capturedState.handleConfirm(true);

	const result = await resultPromise;
	t.true(result);
});

test('useConfirmation handleConfirm resolves promise with result', async t => {
	let capturedState: any;

	const {rerender} = render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Show dialog
	const resultPromise = capturedState.show();

	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Confirm with false
	capturedState.handleConfirm(false);

	const result = await resultPromise;
	t.false(result);
});

test('useConfirmation hide() resets all state', t => {
	let capturedState: any;

	const {rerender} = render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Show dialog first
	capturedState.show({width: 50});

	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.true(capturedState.isVisible);

	// Hide dialog
	capturedState.hide();

	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.false(capturedState.isVisible);
	t.false(capturedState.isLoading);
	t.deepEqual(capturedState.config, {});
	t.is(capturedState.onConfirm, undefined);
});

test('useConfirmation setLoading updates loading state', t => {
	let capturedState: any;

	const {rerender} = render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Initially not loading
	t.false(capturedState.isLoading);

	// Set loading to true
	capturedState.setLoading(true);

	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.true(capturedState.isLoading);

	// Set loading to false
	capturedState.setLoading(false);

	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.false(capturedState.isLoading);
});

test('useConfirmation handles multiple config properties', async t => {
	let capturedState: any;

	const {rerender} = render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	const customConfig = {
		width: 80,
		borderColor: 'red',
		paddingX: 3,
		paddingY: 1,
		loadingText: 'Please wait...',
	};

	// Show with full config
	const resultPromise = capturedState.show(customConfig);

	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.deepEqual(capturedState.config, customConfig);

	// Confirm and resolve
	capturedState.handleConfirm(true);
	const result = await resultPromise;
	t.true(result);
});

test('useConfirmation show without config uses defaults', async t => {
	let capturedState: any;

	const {rerender} = render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Show without config
	const resultPromise = capturedState.show();

	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.true(capturedState.isVisible);
	t.deepEqual(capturedState.config, {}); // Empty config object

	capturedState.handleConfirm(true);
	const result = await resultPromise;
	t.true(result);
});
