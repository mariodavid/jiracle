import test from 'ava';
import React, {act} from 'react';
import {Box, Text} from 'ink';
import {render} from 'ink-testing-library';
import {
	useFocusManagement,
	type UseFocusManagementResult,
} from '../../hooks/useFocusManagement.js';

// Test component that uses the focus management hook and reports state changes
function TestFocusManagementComponent({
	onStateChange,
}: {
	onStateChange?: (state: UseFocusManagementResult) => void;
}) {
	const focusManagement = useFocusManagement();

	// Report state changes to test
	React.useEffect(() => {
		if (onStateChange) {
			onStateChange(focusManagement);
		}
	}); // No dependencies - runs on every render

	return (
		<Box>
			<Text>Test Component</Text>
		</Box>
	);
}

test('useFocusManagement: returns initial state with undefined focused cell', t => {
	// Explicit test data
	const expectedInitialCell = undefined;

	// Operations
	let capturedState: UseFocusManagementResult;
	render(
		React.createElement(TestFocusManagementComponent, {
			onStateChange(state: UseFocusManagementResult) {
				capturedState = state;
			},
		}),
	);

	// Specific value comparisons
	t.is(capturedState!.focusedCell, expectedInitialCell);
});

test('useFocusManagement: handles focus change to regular issue', t => {
	// Explicit test data
	const testIssueKey = 'PROJ-123';
	const testColumnIndex = 2;
	const isFocused = true;
	const expectedFocusedCell = {
		issueKey: IssueKey.fromString('PROJ-123'),
		columnIndex: 2,
		isAttendance: false,
	};

	// Operations
	let capturedState: UseFocusManagementResult;
	const {rerender} = render(
		React.createElement(TestFocusManagementComponent, {
			onStateChange(state: UseFocusManagementResult) {
				capturedState = state;
			},
		}),
	);

	act(() => {
		capturedState!.handleFocusChange(testIssueKey, testColumnIndex, isFocused);
	});

	rerender(
		React.createElement(TestFocusManagementComponent, {
			onStateChange(state: UseFocusManagementResult) {
				capturedState = state;
			},
		}),
	);

	// Specific value comparisons
	t.deepEqual(capturedState!.focusedCell, expectedFocusedCell);
});

test('useFocusManagement: handles focus change to attendance issue', t => {
	// Explicit test data
	const testIssueKey = 'attendance-sick';
	const testColumnIndex = 1;
	const isFocused = true;
	const expectedFocusedCell = {
		issueKey: 'attendance-sick',
		columnIndex: 1,
		isAttendance: true,
	};

	// Operations
	let capturedState: UseFocusManagementResult;
	const {rerender} = render(
		React.createElement(TestFocusManagementComponent, {
			onStateChange(state: UseFocusManagementResult) {
				capturedState = state;
			},
		}),
	);

	act(() => {
		capturedState!.handleFocusChange(testIssueKey, testColumnIndex, isFocused);
	});

	rerender(
		React.createElement(TestFocusManagementComponent, {
			onStateChange(state: UseFocusManagementResult) {
				capturedState = state;
			},
		}),
	);

	// Specific value comparisons
	t.deepEqual(capturedState!.focusedCell, expectedFocusedCell);
});

test('useFocusManagement: ignores blur events', t => {
	// Explicit test data
	const testIssueKey = 'PROJ-456';
	const testColumnIndex = 0;
	const initialFocusedCell = {
		issueKey: IssueKey.fromString('PROJ-456'),
		columnIndex: 0,
		isAttendance: false,
	};

	// Operations
	let capturedState: UseFocusManagementResult;
	const {rerender} = render(
		React.createElement(TestFocusManagementComponent, {
			onStateChange(state: UseFocusManagementResult) {
				capturedState = state;
			},
		}),
	);

	act(() => {
		capturedState!.handleFocusChange(testIssueKey, testColumnIndex, true);
	});

	rerender(
		React.createElement(TestFocusManagementComponent, {
			onStateChange(state: UseFocusManagementResult) {
				capturedState = state;
			},
		}),
	);

	act(() => {
		capturedState!.handleFocusChange(testIssueKey, testColumnIndex, false);
	});

	rerender(
		React.createElement(TestFocusManagementComponent, {
			onStateChange(state: UseFocusManagementResult) {
				capturedState = state;
			},
		}),
	);

	// Specific value comparisons
	t.deepEqual(capturedState!.focusedCell, initialFocusedCell);
});

test('useFocusManagement: clears focus correctly', t => {
	// Explicit test data
	const testIssueKey = 'PROJ-789';
	const testColumnIndex = 3;
	const expectedClearedCell = undefined;

	// Operations
	let capturedState: UseFocusManagementResult;
	const {rerender} = render(
		React.createElement(TestFocusManagementComponent, {
			onStateChange(state: UseFocusManagementResult) {
				capturedState = state;
			},
		}),
	);

	act(() => {
		capturedState!.handleFocusChange(testIssueKey, testColumnIndex, true);
	});

	rerender(
		React.createElement(TestFocusManagementComponent, {
			onStateChange(state: UseFocusManagementResult) {
				capturedState = state;
			},
		}),
	);

	act(() => {
		capturedState!.clearFocus();
	});

	rerender(
		React.createElement(TestFocusManagementComponent, {
			onStateChange(state: UseFocusManagementResult) {
				capturedState = state;
			},
		}),
	);

	// Specific value comparisons
	t.is(capturedState!.focusedCell, expectedClearedCell);
});

test('useFocusManagement: checks if cell is focused correctly', t => {
	// Explicit test data
	const focusedIssueKey = 'PROJ-111';
	const focusedColumnIndex = 1;
	const differentIssueKey = 'PROJ-222';
	const differentColumnIndex = 2;
	const expectedFocusedResult = true;
	const expectedNotFocusedResult = false;

	// Operations
	let capturedState: UseFocusManagementResult;
	const {rerender} = render(
		React.createElement(TestFocusManagementComponent, {
			onStateChange(state: UseFocusManagementResult) {
				capturedState = state;
			},
		}),
	);

	act(() => {
		capturedState!.handleFocusChange(focusedIssueKey, focusedColumnIndex, true);
	});

	rerender(
		React.createElement(TestFocusManagementComponent, {
			onStateChange(state: UseFocusManagementResult) {
				capturedState = state;
			},
		}),
	);

	// Specific value comparisons
	t.is(
		capturedState!.isCellFocused(focusedIssueKey, focusedColumnIndex),
		expectedFocusedResult,
	);
	t.is(
		capturedState!.isCellFocused(differentIssueKey, differentColumnIndex),
		expectedNotFocusedResult,
	);
});

test('useFocusManagement: setFocusedCell updates state directly', t => {
	// Explicit test data
	const testCell = {
		issueKey: 'DIRECT-SET',
		columnIndex: 4,
		isAttendance: true,
	};

	// Operations
	let capturedState: UseFocusManagementResult;
	const {rerender} = render(
		React.createElement(TestFocusManagementComponent, {
			onStateChange(state: UseFocusManagementResult) {
				capturedState = state;
			},
		}),
	);

	act(() => {
		capturedState!.setFocusedCell(testCell);
	});

	rerender(
		React.createElement(TestFocusManagementComponent, {
			onStateChange(state: UseFocusManagementResult) {
				capturedState = state;
			},
		}),
	);

	// Specific value comparisons
	t.deepEqual(capturedState!.focusedCell, testCell);
});
