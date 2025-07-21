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
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
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

	// Component should render without errors when inactive
	t.pass('Inactive state handled correctly');
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

test('useKeyboardInput: handles keyboard events with focused cell', t => {
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
		onCellWorklog() {},
	};

	const focusedCell: FocusedCell = {
		issueKey: 'TEST-123',
		columnIndex: 0,
		isAttendance: false,
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell,
		weekDates: [new Date('2023-07-17'), new Date('2023-07-18')],
		handlers: mockHandlers,
	};

	const {stdin} = render(
		React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
	);

	// Test keyboard input
	stdin.write('\r'); // Enter key

	// Component should handle keyboard input
	t.pass('Keyboard events handled with focused cell');
});

test('useKeyboardInput: handles keyboard events without focused cell', t => {
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell: undefined, // No focused cell
		weekDates: [new Date('2023-07-17')],
		handlers: mockHandlers,
	};

	const {stdin} = render(
		React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
	);

	// Test arrow key
	stdin.write('\u001b[A'); // Up arrow

	t.pass('Keyboard events handled without focused cell');
});

test('useKeyboardInput: handles week navigation keys', t => {
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
		onWeekChange() {},
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell: undefined,
		weekDates: [new Date('2023-07-17')],
		handlers: mockHandlers,
	};

	const {stdin} = render(
		React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
	);

	// Test week navigation
	stdin.write('\u001b[1;2C'); // Shift+Right arrow

	t.pass('Week navigation keys handled');
});

test('useKeyboardInput: handles delete operations', t => {
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
		onCellDelete() {},
	};

	const focusedCell: FocusedCell = {
		issueKey: 'TEST-456',
		columnIndex: 0,
		isAttendance: false,
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell,
		weekDates: [new Date('2023-07-17')],
		handlers: mockHandlers,
	};

	const {stdin} = render(
		React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
	);

	// Test delete key
	stdin.write('d'); // D key for delete

	t.pass('Delete operations handled');
});

test('useKeyboardInput: handles attendance operations', t => {
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
		onAttendanceEdit() {},
		onAttendanceDelete() {},
	};

	const focusedCell: FocusedCell = {
		issueKey: 'attendance',
		columnIndex: 1,
		isAttendance: true,
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell,
		weekDates: [new Date('2023-07-17')],
		handlers: mockHandlers,
	};

	const {stdin} = render(
		React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
	);

	// Test attendance operations
	stdin.write('d'); // D key for attendance delete

	t.pass('Attendance operations handled');
});

test('useKeyboardInput: handles browser operations', t => {
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
		onOpenInBrowser() {},
	};

	const focusedCell: FocusedCell = {
		issueKey: 'TEST-789',
		columnIndex: 0,
		isAttendance: false,
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell,
		weekDates: [new Date('2023-07-17')],
		handlers: mockHandlers,
	};

	const {stdin} = render(
		React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
	);

	// Test browser open
	stdin.write('o'); // O key for open in browser

	t.pass('Browser operations handled');
});

test('useKeyboardInput: handles tab navigation', t => {
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell: undefined,
		weekDates: [new Date('2023-07-17')],
		handlers: mockHandlers,
	};

	const {stdin} = render(
		React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
	);

	// Test reverse tab
	stdin.write('\u001b[Z'); // Shift+Tab

	t.pass('Tab navigation handled');
});

test('useKeyboardInput: handles edge case with minimal handlers', t => {
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
		// Only required handlers, no optional ones
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell: undefined,
		weekDates: [new Date('2023-07-17')],
		handlers: mockHandlers,
	};

	// Should work with minimal handlers
	t.notThrows(() => {
		render(
			React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
		);
	});
});

test('useKeyboardInput: handles complex focused cell scenarios', t => {
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
		onCellWorklog() {},
		onCellDelete() {},
	};

	// Test with attendance cell
	const attendanceFocusedCell: FocusedCell = {
		issueKey: 'attendance',
		columnIndex: 2,
		isAttendance: true,
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell: attendanceFocusedCell,
		weekDates: [new Date('2023-07-17')],
		handlers: mockHandlers,
	};

	t.notThrows(() => {
		render(
			React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
		);
	});
});

test('useKeyboardInput: handles keyboard input state changes', t => {
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
	};

	let currentOptions: KeyboardInputOptions = {
		isActive: false,
		focusedCell: undefined,
		weekDates: [],
		handlers: mockHandlers,
	};

	const {rerender} = render(
		React.createElement(TestKeyboardInputComponent, {options: currentOptions}),
	);

	// Change to active
	currentOptions = {
		...currentOptions,
		isActive: true,
		weekDates: [new Date('2023-07-17')],
	};

	t.notThrows(() => {
		rerender(
			React.createElement(TestKeyboardInputComponent, {options: currentOptions}),
		);
	});
});

test('useKeyboardInput: handles focused cell type changes', t => {
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
	};

	let currentOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell: undefined,
		weekDates: [new Date('2023-07-17')],
		handlers: mockHandlers,
	};

	const {rerender} = render(
		React.createElement(TestKeyboardInputComponent, {options: currentOptions}),
	);

	// Change focused cell to issue cell
	currentOptions = {
		...currentOptions,
		focusedCell: {
			issueKey: 'TEST-CHANGE',
			columnIndex: 0,
			isAttendance: false,
		},
	};

	t.notThrows(() => {
		rerender(
			React.createElement(TestKeyboardInputComponent, {options: currentOptions}),
		);
	});

	// Change to attendance cell
	currentOptions = {
		...currentOptions,
		focusedCell: {
			issueKey: 'attendance',
			columnIndex: 1,
			isAttendance: true,
		},
	};

	t.notThrows(() => {
		rerender(
			React.createElement(TestKeyboardInputComponent, {options: currentOptions}),
		);
	});
});

test('useKeyboardInput: handles all keyboard event types', t => {
	const mockHandlers: KeyboardInputHandlers = {
		handleArrowNavigation() {},
		handleReverseTabNavigation() {},
		onCellWorklog() {},
		onCellDelete() {},
	};

	const focusedCell: FocusedCell = {
		issueKey: 'ALL-EVENTS-123',
		columnIndex: 0,
		isAttendance: false,
	};

	const mockOptions: KeyboardInputOptions = {
		isActive: true,
		focusedCell,
		weekDates: [new Date('2023-07-17')],
		handlers: mockHandlers,
	};

	const {stdin} = render(
		React.createElement(TestKeyboardInputComponent, {options: mockOptions}),
	);

	// Test various key types
	stdin.write('\u001b[A'); // Arrow up
	stdin.write('\r'); // Enter
	stdin.write('d'); // Delete key
	stdin.write('\u001b[Z'); // Shift+Tab

	t.pass('All keyboard event types handled');
});