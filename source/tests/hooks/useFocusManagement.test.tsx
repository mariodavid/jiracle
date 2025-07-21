import test from 'ava';
import React from 'react';
import {Box, Text} from 'ink';
import {render} from 'ink-testing-library';
import {
	useFocusManagement,
	type UseFocusManagementResult,
} from '../../hooks/useFocusManagement.js';

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

test('useFocusManagement: handleFocusChange sets focus when isFocused is true', t => {
	const {rerender} = render(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	let hook = globalThis.__testHookResult as UseFocusManagementResult;

	// Call handleFocusChange with isFocused = true
	hook.handleFocusChange('PROJECT-123', 2, true);
	rerender(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	hook = globalThis.__testHookResult as UseFocusManagementResult;
	t.truthy(hook.focusedCell);
	t.is(hook.focusedCell?.issueKey, 'PROJECT-123');
	t.is(hook.focusedCell?.columnIndex, 2);
	t.false(hook.focusedCell?.isAttendance);
});

test('useFocusManagement: handleFocusChange ignores blur events (isFocused=false)', t => {
	const {rerender} = render(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	let hook = globalThis.__testHookResult as UseFocusManagementResult;

	// First set a focus
	hook.handleFocusChange('PROJECT-456', 1, true);
	rerender(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	hook = globalThis.__testHookResult as UseFocusManagementResult;
	t.truthy(hook.focusedCell);
	t.is(hook.focusedCell?.issueKey, 'PROJECT-456');

	// Now try to blur - should be ignored
	hook.handleFocusChange('PROJECT-456', 1, false);
	rerender(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	hook = globalThis.__testHookResult as UseFocusManagementResult;
	// Focus should still be there (blur ignored)
	t.truthy(hook.focusedCell);
	t.is(hook.focusedCell?.issueKey, 'PROJECT-456');
});

test('useFocusManagement: handleFocusChange detects attendance cells', t => {
	const {rerender} = render(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	let hook = globalThis.__testHookResult as UseFocusManagementResult;

	// Focus on an attendance cell (starts with 'attendance-')
	hook.handleFocusChange('attendance-row', 0, true);
	rerender(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	hook = globalThis.__testHookResult as UseFocusManagementResult;
	t.truthy(hook.focusedCell);
	t.is(hook.focusedCell?.issueKey, 'attendance-row');
	t.is(hook.focusedCell?.columnIndex, 0);
	t.true(hook.focusedCell?.isAttendance);
});

test('useFocusManagement: setFocusedCell directly sets the focused cell', t => {
	const {rerender} = render(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	let hook = globalThis.__testHookResult as UseFocusManagementResult;

	// Set focus directly
	hook.setFocusedCell({
		issueKey: 'DIRECT-789',
		columnIndex: 3,
		isAttendance: false,
	});
	rerender(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	hook = globalThis.__testHookResult as UseFocusManagementResult;
	t.truthy(hook.focusedCell);
	t.is(hook.focusedCell?.issueKey, 'DIRECT-789');
	t.is(hook.focusedCell?.columnIndex, 3);
	t.false(hook.focusedCell?.isAttendance);
});

test('useFocusManagement: setFocusedCell can set to undefined', t => {
	const {rerender} = render(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	let hook = globalThis.__testHookResult as UseFocusManagementResult;

	// Set a focus first
	hook.setFocusedCell({
		issueKey: 'TEMP-001',
		columnIndex: 0,
		isAttendance: false,
	});
	rerender(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	hook = globalThis.__testHookResult as UseFocusManagementResult;
	t.truthy(hook.focusedCell);

	// Now clear it by setting to undefined
	hook.setFocusedCell(undefined);
	rerender(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	hook = globalThis.__testHookResult as UseFocusManagementResult;
	t.is(hook.focusedCell, undefined);
});

test('useFocusManagement: clearFocus clears the focused cell', t => {
	const {rerender} = render(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	let hook = globalThis.__testHookResult as UseFocusManagementResult;

	// Set a focus first
	hook.handleFocusChange('CLEAR-TEST', 1, true);
	rerender(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	hook = globalThis.__testHookResult as UseFocusManagementResult;
	t.truthy(hook.focusedCell);

	// Now clear it
	hook.clearFocus();
	rerender(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	hook = globalThis.__testHookResult as UseFocusManagementResult;
	t.is(hook.focusedCell, undefined);
});

test('useFocusManagement: isCellFocused returns true for focused cell', t => {
	const {rerender} = render(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	let hook = globalThis.__testHookResult as UseFocusManagementResult;

	// Set focus on specific cell
	hook.handleFocusChange('FOCUS-CHECK', 2, true);
	rerender(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	hook = globalThis.__testHookResult as UseFocusManagementResult;

	// Check if the focused cell is correctly identified
	t.true(hook.isCellFocused('FOCUS-CHECK', 2));

	// Other cells should not be focused
	t.false(hook.isCellFocused('FOCUS-CHECK', 0));
	t.false(hook.isCellFocused('FOCUS-CHECK', 1));
	t.false(hook.isCellFocused('OTHER-ISSUE', 2));
});

test('useFocusManagement: isCellFocused returns false when no cell is focused', t => {
	render(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	const hook = globalThis.__testHookResult as UseFocusManagementResult;

	// No cell is focused initially
	t.false(hook.isCellFocused('ANY-ISSUE', 0));
	t.false(hook.isCellFocused('ANY-ISSUE', 1));
});

test('useFocusManagement: focus changes update isCellFocused correctly', t => {
	const {rerender} = render(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	let hook = globalThis.__testHookResult as UseFocusManagementResult;

	// Focus first cell
	hook.handleFocusChange('SWITCH-A', 0, true);
	rerender(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	hook = globalThis.__testHookResult as UseFocusManagementResult;
	t.true(hook.isCellFocused('SWITCH-A', 0));
	t.false(hook.isCellFocused('SWITCH-B', 1));

	// Switch focus to different cell
	hook.handleFocusChange('SWITCH-B', 1, true);
	rerender(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	hook = globalThis.__testHookResult as UseFocusManagementResult;
	t.false(hook.isCellFocused('SWITCH-A', 0));
	t.true(hook.isCellFocused('SWITCH-B', 1));
});

test('useFocusManagement: handles attendance cell identification correctly', t => {
	const {rerender} = render(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	let hook = globalThis.__testHookResult as UseFocusManagementResult;

	// Test regular issue (should not be attendance)
	hook.handleFocusChange('REGULAR-123', 0, true);
	rerender(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	hook = globalThis.__testHookResult as UseFocusManagementResult;
	t.truthy(hook.focusedCell);
	t.false(hook.focusedCell?.isAttendance);

	// Test attendance issue (starts with 'attendance-')
	hook.handleFocusChange('attendance-something', 1, true);
	rerender(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	hook = globalThis.__testHookResult as UseFocusManagementResult;
	t.truthy(hook.focusedCell);
	t.true(hook.focusedCell?.isAttendance);

	// Test edge case: issue key exactly 'attendance' (no dash)
	hook.handleFocusChange('attendance', 2, true);
	rerender(React.createElement(TestFocusManagementComponent));

	// @ts-expect-error: Test-only global variable to access hook state
	hook = globalThis.__testHookResult as UseFocusManagementResult;
	t.truthy(hook.focusedCell);
	t.false(hook.focusedCell?.isAttendance); // Should be false, needs 'attendance-' prefix
});
