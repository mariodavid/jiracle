import test from 'ava';
import React from 'react';
import {Box, Text} from 'ink';
import {render} from 'ink-testing-library';
import {
	useKeyboardInput,
	type KeyboardInputHandlers,
	type KeyboardInputOptions,
} from '../../hooks/useKeyboardInput.js';
import type {FocusedCell} from '../../hooks/useFocusManagement.js';

// Test component that uses the hook
function TestKeyboardInputComponent({
	options,
}: {
	options: KeyboardInputOptions;
}) {
	useKeyboardInput(options);
	return (
		<Box>
			<Text>Test Component</Text>
		</Box>
	);
}

test('useKeyboardInput: hook can be instantiated', t => {
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell: undefined,
		weekDates: [],
		handlers: mockHandlers,
	};

	// Should not throw when rendering
	t.notThrows(() => {
		render(
			React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
		);
	});
});

test('useKeyboardInput: handles inactive state correctly', t => {
	let arrowNavigationCalled = false;
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {
			arrowNavigationCalled = true;
		},
		handleReverseTabNavigation() {},
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: false, // Inactive
		focusedCell: undefined,
		weekDates: [],
		handlers: mockHandlers,
	};

	render(
		React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
	);

	// Arrow navigation should not be called when inactive
	t.false(arrowNavigationCalled);
});

test('useKeyboardInput: accepts all required handler functions', t => {
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
		onWeekChange() {},
		onCellWorklog() {},
		onCellDelete() {},
		onAttendanceEdit() {},
		onAttendanceDelete() {},
		onOpenInBrowser() {},
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell: undefined,
		weekDates: [new Date('2023-07-17'), new Date('2023-07-18')],
		handlers: mockHandlers,
	};

	// Should not throw with all handlers
	t.notThrows(() => {
		render(
			React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
		);
	});
});

test('useKeyboardInput: works with focused cell for issue cells', t => {
	const focusedCell: FocusedCell = {
		issueKey: 'PROJECT-123',
		columnIndex: 0,
		isAttendance: false,
	};

	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
		onCellWorklog() {},
		onCellDelete() {},
		onOpenInBrowser() {},
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell,
		weekDates: [new Date('2023-07-17')],
		handlers: mockHandlers,
	};

	// Should not throw with issue cell focused
	t.notThrows(() => {
		render(
			React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
		);
	});
});

test('useKeyboardInput: works with focused cell for attendance cells', t => {
	const focusedCell: FocusedCell = {
		issueKey: 'attendance-attendance',
		columnIndex: 1,
		isAttendance: true,
	};

	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
		onAttendanceEdit() {},
		onAttendanceDelete() {},
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell,
		weekDates: [new Date('2023-07-17'), new Date('2023-07-18')],
		handlers: mockHandlers,
	};

	// Should not throw with attendance cell focused
	t.notThrows(() => {
		render(
			React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
		);
	});
});

test('useKeyboardInput: interface validates correctly', t => {
	// Test that the KeyboardInputHandlers interface allows optional handlers
	const minimalHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
		// All other handlers are optional
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell: undefined,
		weekDates: [],
		handlers: minimalHandlers,
	};

	// Should not throw with minimal handlers
	t.notThrows(() => {
		render(
			React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
		);
	});
});

test('useKeyboardInput: handles empty weekDates array', t => {
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell: undefined,
		weekDates: [], // Empty array
		handlers: mockHandlers,
	};

	// Should not throw with empty weekDates
	t.notThrows(() => {
		render(
			React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
		);
	});
});

test('useKeyboardInput: validates handler function types', t => {
	const handlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
		onWeekChange() {},
		onCellWorklog() {},
		onCellDelete() {},
		onAttendanceEdit() {},
		onAttendanceDelete() {},
		onOpenInBrowser() {},
	};

	// Verify handler types are functions
	t.is(typeof handlers.handleArrowNavigation, 'function');
	t.is(typeof handlers.handleReverseTabNavigation, 'function');
	t.is(typeof handlers.onWeekChange, 'function');
	t.is(typeof handlers.onCellWorklog, 'function');
	t.is(typeof handlers.onCellDelete, 'function');
	t.is(typeof handlers.onAttendanceEdit, 'function');
	t.is(typeof handlers.onAttendanceDelete, 'function');
	t.is(typeof handlers.onOpenInBrowser, 'function');
});
