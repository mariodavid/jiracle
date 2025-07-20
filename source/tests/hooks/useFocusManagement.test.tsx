import test from 'ava';
import React from 'react';
import {Box} from 'ink';
import {render} from 'ink-testing-library';
import {
	useFocusManagement,
	type UseFocusManagementResult,
} from '../../hooks/useFocusManagement.js';

// Test component that captures hook state during render
function TestFocusManagementComponent() {
	const focusManagement = useFocusManagement();

	// Store hook result in a global variable for testing (test-only pattern)
	// @ts-ignore
	globalThis.__testHookResult = focusManagement;

	return <Box>Test Component</Box>;
}

test('useFocusManagement: returns initial state with null focused cell', t => {
	render(React.createElement(TestFocusManagementComponent));

	// @ts-ignore
	const hook = globalThis.__testHookResult as UseFocusManagementResult;
	t.truthy(hook);
	t.is(hook.focusedCell, null);
	t.is(typeof hook.handleFocusChange, 'function');
	t.is(typeof hook.setFocusedCell, 'function');
	t.is(typeof hook.clearFocus, 'function');
	t.is(typeof hook.isCellFocused, 'function');
});
