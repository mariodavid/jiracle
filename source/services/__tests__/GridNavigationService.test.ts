import test from 'ava';
import {
	navigateInDirection,
	findInitialFocusItem,
	navigateToNextItem,
	type NavigationContext,
} from '../GridNavigationService.js';
import {IssueKey} from '../../domain/IssueKey.js';
import type {FocusableItem} from '../../utils/FocusableItemCalculator.js';

// Test Data: Define expected navigation scenarios for attendance and worklog integration
const mockFocusableItems: FocusableItem[] = [
	// Attendance items (must be first for proper up/down navigation)
	{
		focusId: 'attendance-attendance-0',
		issueKey: 'ATTENDANCE-ATTENDANCE',
		columnIndex: 0,
		isAttendance: true,
	},
	{
		focusId: 'attendance-attendance-1',
		issueKey: 'ATTENDANCE-ATTENDANCE',
		columnIndex: 1,
		isAttendance: true,
	},
	{
		focusId: 'attendance-attendance-2',
		issueKey: 'ATTENDANCE-ATTENDANCE',
		columnIndex: 2,
		isAttendance: true,
	},
	// Issue items (must come after attendance)
	{
		focusId: 'issue-PROJ-123-0',
		issueKey: 'PROJ-123',
		columnIndex: 0,
		isAttendance: false,
	},
	{
		focusId: 'issue-PROJ-123-1',
		issueKey: 'PROJ-123',
		columnIndex: 1,
		isAttendance: false,
	},
	{
		focusId: 'issue-PROJ-123-2',
		issueKey: 'PROJ-123',
		columnIndex: 2,
		isAttendance: false,
	},
	{
		focusId: 'issue-PROJ-456-0',
		issueKey: 'PROJ-456',
		columnIndex: 0,
		isAttendance: false,
	},
	{
		focusId: 'issue-PROJ-456-1',
		issueKey: 'PROJ-456',
		columnIndex: 1,
		isAttendance: false,
	},
	{
		focusId: 'issue-PROJ-456-2',
		issueKey: 'PROJ-456',
		columnIndex: 2,
		isAttendance: false,
	},
];

/**
 * CRITICAL: This test MUST exist to prevent attendance navigation failure
 *
 * WHY THIS TEST IS ESSENTIAL:
 * - This was the exact bug reported: navigation doesn't work FROM attendance rows
 * - GridNavigationService.findCurrentItemIndex must locate attendance cells correctly
 * - The service compares focusedCell.issueKey.toString() with focusableItems[].issueKey
 * - Case sensitivity mismatch causes findIndex to return -1, breaking all navigation
 *
 * FAILURE CONSEQUENCES:
 * - Arrow keys stop working when focused on attendance cells
 * - Users get trapped in attendance rows and cannot navigate to worklog entries
 * - Debug logs show "Could not find current item" errors
 * - Keyboard-only workflows become impossible
 */
test('navigateInDirection works FROM attendance cells to worklog cells (down arrow)', t => {
	// EXPLICIT TEST DATA
	const focusedOnAttendanceCell = {
		issueKey: IssueKey.fromString('ATTENDANCE-ATTENDANCE'), // This becomes uppercase via toString()
		columnIndex: 0,
		isAttendance: true,
	};
	const context: NavigationContext = {
		focusedCell: focusedOnAttendanceCell,
		focusableItems: mockFocusableItems,
		columnCount: 3,
	};
	const expectedTargetIssueKey = 'PROJ-123'; // First worklog issue in same column

	// OPERATIONS
	const result = navigateInDirection('down', context);

	// SPECIFIC VALUE COMPARISONS
	t.true(result.success, 'Navigation down from attendance cell must succeed');
	t.truthy(result.targetItem, 'Must find target worklog item');
	t.is(
		result.targetItem!.issueKey,
		expectedTargetIssueKey,
		'Must navigate to first worklog issue in same column',
	);
	t.is(
		result.targetItem!.columnIndex,
		0,
		'Must stay in same column when navigating down',
	);
	t.false(
		result.targetItem!.isAttendance,
		'Target must be worklog item, not attendance',
	);
});

/**
 * CRITICAL: This test MUST exist to prevent worklog-to-attendance navigation failure
 *
 * WHY THIS TEST IS ESSENTIAL:
 * - Users need to navigate UP from worklog entries to attendance rows
 * - GridNavigationService.navigateUp must find attendance items in the same column
 * - The navigation logic filters items by columnIndex then finds current position
 * - If attendance items have wrong case or order, up navigation fails
 *
 * FAILURE CONSEQUENCES:
 * - Up arrow from first worklog row doesn't reach attendance
 * - Users cannot access attendance editing from keyboard navigation
 * - Workflow becomes asymmetrical (can go down but not up)
 * - Navigation feels broken and inconsistent
 */
test('navigateInDirection works FROM worklog cells to attendance cells (up arrow)', t => {
	// EXPLICIT TEST DATA
	const focusedOnWorklogCell = {
		issueKey: IssueKey.fromString('PROJ-123'), // First worklog issue
		columnIndex: 1,
		isAttendance: false,
	};
	const context: NavigationContext = {
		focusedCell: focusedOnWorklogCell,
		focusableItems: mockFocusableItems,
		columnCount: 3,
	};
	const expectedTargetIssueKey = 'ATTENDANCE-ATTENDANCE';

	// OPERATIONS
	const result = navigateInDirection('up', context);

	// SPECIFIC VALUE COMPARISONS
	t.true(result.success, 'Navigation up from worklog cell must succeed');
	t.truthy(result.targetItem, 'Must find target attendance item');
	t.is(
		result.targetItem!.issueKey,
		expectedTargetIssueKey,
		'Must navigate to attendance row in same column',
	);
	t.is(
		result.targetItem!.columnIndex,
		1,
		'Must stay in same column when navigating up',
	);
	t.true(
		result.targetItem!.isAttendance,
		'Target must be attendance item, not worklog',
	);
});

/**
 * CRITICAL: This test MUST exist to prevent left/right navigation within attendance
 *
 * WHY THIS TEST IS ESSENTIAL:
 * - Users need to navigate horizontally within attendance rows (Monday to Friday)
 * - GridNavigationService.navigateLeft/Right must find attendance items in adjacent columns
 * - Attendance spans all weekdays so horizontal navigation must work consistently
 * - Case sensitivity affects both the current item lookup AND target item search
 *
 * FAILURE CONSEQUENCES:
 * - Left/right arrows don't work within attendance rows
 * - Users cannot efficiently edit attendance for different days
 * - Navigation becomes inconsistent between attendance and worklog sections
 * - Daily attendance editing workflow breaks
 */
test('navigateInDirection works within attendance cells (left/right arrows)', t => {
	// EXPLICIT TEST DATA
	const focusedOnAttendanceColumn1 = {
		issueKey: IssueKey.fromString('ATTENDANCE-ATTENDANCE'),
		columnIndex: 1, // Tuesday
		isAttendance: true,
	};
	const context: NavigationContext = {
		focusedCell: focusedOnAttendanceColumn1,
		focusableItems: mockFocusableItems,
		columnCount: 3,
	};

	// OPERATIONS
	const leftResult = navigateInDirection('left', context);
	const rightResult = navigateInDirection('right', context);

	// SPECIFIC VALUE COMPARISONS
	// Test left navigation (Tuesday -> Monday)
	t.true(leftResult.success, 'Left navigation within attendance must succeed');
	t.truthy(leftResult.targetItem, 'Must find left attendance target');
	t.is(
		leftResult.targetItem!.columnIndex,
		0,
		'Left arrow must move to previous column',
	);
	t.true(
		leftResult.targetItem!.isAttendance,
		'Left target must remain attendance',
	);

	// Test right navigation (Tuesday -> Wednesday)
	t.true(
		rightResult.success,
		'Right navigation within attendance must succeed',
	);
	t.truthy(rightResult.targetItem, 'Must find right attendance target');
	t.is(
		rightResult.targetItem!.columnIndex,
		2,
		'Right arrow must move to next column',
	);
	t.true(
		rightResult.targetItem!.isAttendance,
		'Right target must remain attendance',
	);
});

/**
 * CRITICAL: This test MUST exist to prevent case sensitivity lookup failures
 *
 * WHY THIS TEST IS ESSENTIAL:
 * - This test directly replicates the bug scenario that was reported
 * - When focusedCell has IssueKey.fromString() and toString() is called, it returns uppercase
 * - GridNavigationService.findCurrentItemIndex compares this with focusableItems[].issueKey
 * - If focusableItems contain lowercase, findIndex returns -1 and navigation fails
 *
 * FAILURE CONSEQUENCES:
 * - All navigation fails from attendance cells (the exact reported bug)
 * - Error message "Could not find current item" appears in logs
 * - Arrow key presses are completely ignored
 * - Users cannot navigate away from attendance rows at all
 */
test('navigateInDirection handles case sensitivity correctly for attendance lookup', t => {
	// EXPLICIT TEST DATA - Simulating the exact bug scenario
	const focusableItemsWithCorrectCase: FocusableItem[] = [
		{
			focusId: 'attendance-attendance-0',
			issueKey: 'ATTENDANCE-ATTENDANCE', // Correct uppercase
			columnIndex: 0,
			isAttendance: true,
		},
		{
			focusId: 'issue-PROJ-123-0',
			issueKey: 'PROJ-123',
			columnIndex: 0,
			isAttendance: false,
		},
	];

	const focusableItemsWithWrongCase: FocusableItem[] = [
		{
			focusId: 'attendance-attendance-0',
			issueKey: 'attendance-attendance', // Wrong lowercase - causes bug
			columnIndex: 0,
			isAttendance: true,
		},
		{
			focusId: 'issue-PROJ-123-0',
			issueKey: 'PROJ-123',
			columnIndex: 0,
			isAttendance: false,
		},
	];

	const focusedCell = {
		issueKey: IssueKey.fromString('ATTENDANCE-ATTENDANCE'),
		columnIndex: 0,
		isAttendance: true,
	};

	const correctCaseContext: NavigationContext = {
		focusedCell,
		focusableItems: focusableItemsWithCorrectCase,
		columnCount: 3,
	};

	const wrongCaseContext: NavigationContext = {
		focusedCell,
		focusableItems: focusableItemsWithWrongCase,
		columnCount: 3,
	};

	// OPERATIONS
	const correctCaseResult = navigateInDirection('down', correctCaseContext);
	const wrongCaseResult = navigateInDirection('down', wrongCaseContext);

	// SPECIFIC VALUE COMPARISONS
	// Correct case must work
	t.true(
		correctCaseResult.success,
		'Navigation must succeed with correct uppercase case',
	);
	t.truthy(
		correctCaseResult.targetItem,
		'Must find target with correct case matching',
	);

	// Wrong case must fail (demonstrating the bug)
	t.false(
		wrongCaseResult.success,
		'Navigation must fail with wrong lowercase case (this is the bug)',
	);
	t.falsy(
		wrongCaseResult.targetItem,
		'Must not find target with case mismatch',
	);
});

/**
 * CRITICAL: This test MUST exist to ensure proper initial focus behavior
 *
 * WHY THIS TEST IS ESSENTIAL:
 * - findInitialFocusItem is called when the timetable first loads
 * - It must correctly identify attendance items as valid focus targets
 * - The initial focus affects all subsequent navigation operations
 * - Users expect to start navigation from a predictable position
 *
 * FAILURE CONSEQUENCES:
 * - Initial focus may land on wrong item type
 * - First navigation attempt may fail unexpectedly
 * - User experience becomes inconsistent on app startup
 * - Keyboard accessibility is degraded from the beginning
 */
test('findInitialFocusItem correctly handles attendance items', t => {
	// EXPLICIT TEST DATA
	const itemsStartingWithAttendance = mockFocusableItems; // Attendance items first
	const preferredColumn = 1; // Tuesday

	// OPERATIONS
	const initialItem = findInitialFocusItem(
		itemsStartingWithAttendance,
		preferredColumn,
	);

	// SPECIFIC VALUE COMPARISONS
	t.truthy(initialItem, 'Must find initial focus item');
	t.is(
		initialItem!.columnIndex,
		preferredColumn,
		'Must prefer specified column for initial focus',
	);
	t.true(
		initialItem!.isAttendance,
		'Should focus on attendance item first (they appear at top)',
	);
	t.is(
		initialItem!.issueKey,
		'ATTENDANCE-ATTENDANCE',
		'Initial focus must have correct case for subsequent navigation',
	);
});

/**
 * CRITICAL: This test MUST exist to prevent tab navigation regression
 *
 * WHY THIS TEST IS ESSENTIAL:
 * - navigateToNextItem is used for Tab/Shift+Tab navigation
 * - Users expect to cycle through all focusable items in logical order
 * - The function must handle transitions between attendance and worklog items
 * - Tab navigation is essential for accessibility compliance
 *
 * FAILURE CONSEQUENCES:
 * - Tab key skips over attendance or worklog items
 * - Navigation order becomes confusing and unpredictable
 * - Screen reader users cannot access all functionality
 * - Keyboard-only workflows become inefficient
 */
test('navigateToNextItem cycles correctly between attendance and worklog items', t => {
	// EXPLICIT TEST DATA
	const focusedOnLastAttendanceItem = {
		issueKey: IssueKey.fromString('ATTENDANCE-ATTENDANCE'),
		columnIndex: 2, // Last attendance column
		isAttendance: true,
	};
	const context: NavigationContext = {
		focusedCell: focusedOnLastAttendanceItem,
		focusableItems: mockFocusableItems,
		columnCount: 3,
	};

	// OPERATIONS
	const nextResult = navigateToNextItem(context, 'next');

	// SPECIFIC VALUE COMPARISONS
	t.true(nextResult.success, 'Tab navigation from attendance must succeed');
	t.truthy(nextResult.targetItem, 'Must find next item after attendance');
	t.is(
		nextResult.targetItem!.issueKey,
		'PROJ-123',
		'Must transition from attendance to first worklog item',
	);
	t.is(
		nextResult.targetItem!.columnIndex,
		0,
		'Must move to first column of worklog section',
	);
	t.false(
		nextResult.targetItem!.isAttendance,
		'Next item after attendance must be worklog',
	);
});
