import test from 'ava';
import React from 'react';
import {Box, Text} from 'ink';
import {render} from 'ink-testing-library';
import {
	useFocusManagement,
	type UseFocusManagementResult,
} from '../../hooks/use-focus-management.js';

// Test component that captures hook state during render
function TestFocusManagementComponent() {
	const focusManagement = useFocusManagement();

	// Store hook result in a global variable for testing (test-only pattern)
	// @ts-expect-error: Test-only global variable to access hook state
	globalThis.__testHookResult = focusManagement;

	return (
		<Box>
			<Text>Test Component</Text>
		</Box>
	);
}

test('useFocusManagement: returns initial state with null focused cell', t => {
	render(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	const hook = globalThis.__testHookResult as UseFocusManagementResult;
	t.truthy(hook);
	t.is(hook.focusedCell, undefined);
	t.is(typeof hook.handleFocusChange, 'function');
	t.is(typeof hook.setFocusedCell, 'function');
	t.is(typeof hook.clearFocus, 'function');
	t.is(typeof hook.isCellFocused, 'function');
});
