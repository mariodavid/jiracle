import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {
	useConfirmation,
	type ConfirmationConfig,
} from '../../hooks/useConfirmation.js';

// Test component that uses the hook
function TestConfirmationComponent({
	onStateChange,
}: {
	onStateChange?: (hookState: ReturnType<typeof useConfirmation>) => void;
}) {
	const hookState = useConfirmation();

	// Report state changes to test
	React.useEffect(() => {
		if (onStateChange) {
			onStateChange(hookState);
		}
	}, [hookState, onStateChange]);

	return null;
}

test('useConfirmation returns correct initial state', t => {
	// EXPLICIT TEST DATA
	const expectedInitialState = {
		isVisible: false,
		isLoading: false,
		config: {},
		onConfirm: undefined,
	};
	let hookState: ReturnType<typeof useConfirmation> | undefined;

	// OPERATIONS
	render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);

	// SPECIFIC VALUE COMPARISONS
	t.not(hookState, undefined, 'Hook state should be captured');
	t.is(
		hookState!.isVisible,
		expectedInitialState.isVisible,
		'Should start with dialog hidden',
	);
	t.is(
		hookState!.isLoading,
		expectedInitialState.isLoading,
		'Should start without loading state',
	);
	t.deepEqual(
		hookState!.config,
		expectedInitialState.config,
		'Should start with empty config',
	);
	t.is(
		hookState!.onConfirm,
		expectedInitialState.onConfirm,
		'Should start without confirm handler',
	);
});

test('useConfirmation show() displays dialog with custom config', async t => {
	// EXPLICIT TEST DATA
	const expectedConfig: ConfirmationConfig = {
		width: 50,
		borderColor: 'red',
		paddingX: 2,
	};
	let hookState: ReturnType<typeof useConfirmation> | undefined;

	// OPERATIONS
	const {rerender} = render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);

	t.not(hookState, undefined, 'Hook state should be captured');
	const confirmationPromise = hookState!.show(expectedConfig);
	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);

	// SPECIFIC VALUE COMPARISONS
	t.true(hookState!.isVisible, 'Dialog should be visible after show()');
	t.is(
		hookState!.config.width,
		expectedConfig.width,
		'Should apply custom width',
	);
	t.is(
		hookState!.config.borderColor,
		expectedConfig.borderColor,
		'Should apply custom border color',
	);
	t.is(
		hookState!.config.paddingX,
		expectedConfig.paddingX,
		'Should apply custom padding',
	);
	t.not(hookState!.onConfirm, undefined, 'Should set confirm handler');

	// Clean up
	hookState!.handleConfirm(false);
	await confirmationPromise;
});

test('useConfirmation resolves promise when user confirms', async t => {
	// EXPLICIT TEST DATA
	const expectedResult = true;
	let hookState: ReturnType<typeof useConfirmation> | undefined;

	// OPERATIONS
	const {rerender} = render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);

	t.not(hookState, undefined, 'Hook state should be captured');
	const confirmationPromise = hookState!.show();
	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);

	hookState!.handleConfirm(true);
	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);
	const result = await confirmationPromise;

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedResult, 'Promise should resolve to true when confirmed');
	t.false(hookState!.isVisible, 'Dialog should be hidden after confirmation');
});

test('useConfirmation resolves promise when user cancels', async t => {
	// EXPLICIT TEST DATA
	const expectedResult = false;
	let hookState: ReturnType<typeof useConfirmation> | undefined;

	// OPERATIONS
	const {rerender} = render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);

	t.not(hookState, undefined, 'Hook state should be captured');
	const confirmationPromise = hookState!.show();
	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);

	hookState!.handleConfirm(false);
	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);
	const result = await confirmationPromise;

	// SPECIFIC VALUE COMPARISONS
	t.is(
		result,
		expectedResult,
		'Promise should resolve to false when cancelled',
	);
	t.false(hookState!.isVisible, 'Dialog should be hidden after cancellation');
});

test('useConfirmation setLoading updates loading state correctly', t => {
	// EXPLICIT TEST DATA
	const expectedLoadingState = true;
	let hookState: ReturnType<typeof useConfirmation> | undefined;

	// OPERATIONS
	const {rerender} = render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);

	t.not(hookState, undefined, 'Hook state should be captured');
	hookState!.setLoading(expectedLoadingState);
	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);

	// SPECIFIC VALUE COMPARISONS
	t.is(
		hookState!.isLoading,
		expectedLoadingState,
		'Should update loading state to true',
	);

	// Test setting back to false
	hookState!.setLoading(false);
	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);

	t.false(hookState!.isLoading, 'Should update loading state to false');
});

test('useConfirmation hide() resets all state to initial values', t => {
	// EXPLICIT TEST DATA
	const customConfig: ConfirmationConfig = {width: 100, borderColor: 'blue'};
	const expectedResetState = {
		isVisible: false,
		isLoading: false,
		config: {},
		onConfirm: undefined,
	};
	let hookState: ReturnType<typeof useConfirmation> | undefined;

	// OPERATIONS
	const {rerender} = render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);

	// Set up state first
	t.not(hookState, undefined, 'Hook state should be captured');
	void hookState!.show(customConfig); // Don't await, we'll test hide() directly
	hookState!.setLoading(true);
	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);

	// Verify state is set up
	t.true(hookState!.isVisible, 'Dialog should be visible before hide');
	t.true(hookState!.isLoading, 'Should be loading before hide');

	// Reset state
	hookState!.hide();
	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);

	// SPECIFIC VALUE COMPARISONS
	t.is(
		hookState!.isVisible,
		expectedResetState.isVisible,
		'Should reset visibility to false',
	);
	t.is(
		hookState!.isLoading,
		expectedResetState.isLoading,
		'Should reset loading to false',
	);
	t.deepEqual(
		hookState!.config,
		expectedResetState.config,
		'Should reset config to empty object',
	);
	t.is(
		hookState!.onConfirm,
		expectedResetState.onConfirm,
		'Should reset confirm handler to undefined',
	);
});

test('useConfirmation handles concurrent confirmation requests', async t => {
	// EXPLICIT TEST DATA
	const firstConfig: ConfirmationConfig = {width: 50};
	const secondConfig: ConfirmationConfig = {width: 100, borderColor: 'green'};
	const expectedSecondResult = true;
	let hookState: ReturnType<typeof useConfirmation> | undefined;

	// OPERATIONS
	const {rerender} = render(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);

	// Start first confirmation
	t.not(hookState, undefined, 'Hook state should be captured');
	const firstPromise = hookState!.show(firstConfig);
	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);

	// Start second confirmation (should override first)
	const secondPromise = hookState!.show(secondConfig);
	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);

	// Verify second config is applied before confirmation
	t.is(
		hookState!.config.width,
		secondConfig.width,
		'Should apply second config width before confirmation',
	);
	t.is(
		hookState!.config.borderColor,
		secondConfig.borderColor,
		'Should apply second config border color before confirmation',
	);

	// Confirm second dialog
	hookState!.handleConfirm(true);
	rerender(
		React.createElement(TestConfirmationComponent, {
			onStateChange(state) {
				hookState = state;
			},
		}),
	);
	const secondResult = await secondPromise;

	// SPECIFIC VALUE COMPARISONS
	t.is(
		secondResult,
		expectedSecondResult,
		'Second confirmation should succeed',
	);
	t.false(
		hookState!.isVisible,
		'Dialog should be hidden after second confirmation',
	);

	// Clean up first promise - it should be left unresolved
	// since the second show() call overrides it
	let firstPromiseResolved = false;
	firstPromise
		.then(() => {
			firstPromiseResolved = true;
		})
		.catch(() => {
			firstPromiseResolved = true;
		});

	// Give it a moment to potentially resolve (it shouldn't)
	await new Promise<void>(resolve => {
		setTimeout(() => {
			resolve();
		}, 10);
	});
	t.false(
		firstPromiseResolved,
		'First promise should not resolve when overridden by second',
	);
});
