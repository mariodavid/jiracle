import test from 'ava';
import {
	calculateFocusableItems,
	findFocusableItem,
	getFocusableItemsByIssue,
	type FocusableItemCalculatorOptions,
} from '../FocusableItemCalculator.js';
import {AttendanceManager} from '../../attendance/AttendanceManager.js';
import {IssueKey} from '../../domain/IssueKey.js';
import type {AttendanceConfig} from '../../attendance/types.js';
import type {IssueGroup} from '../../services/IssueGroupManager.js';

// Test Data: Define expected inputs and outputs for case sensitivity scenarios
const mockAttendanceConfig: AttendanceConfig = {
	enabled: true,
	workingHours: 8,
	breakMinutes: 30,
	defaultCheckIn: '08:00',
	defaultCheckOut: '17:00',
	defaultBreakMinutes: 30,
};

const mockIssueGroups: IssueGroup[] = [
	{
		group: undefined,
		issues: [
			['PROJ-123', {summary: 'Test Issue', dailyHours: {}, weekTotal: 0}],
			['PROJ-456', {summary: 'Another Issue', dailyHours: {}, weekTotal: 0}],
		],
		totalHours: 0,
	},
];

/**
 * CRITICAL: This test MUST exist to prevent navigation regression
 *
 * WHY THIS TEST IS ESSENTIAL:
 * - The GridNavigationService uses focusedCell.issueKey.toString() which returns uppercase "ATTENDANCE-ATTENDANCE"
 * - If FocusableItemCalculator creates lowercase "attendance-attendance", navigation breaks
 * - Without this exact case match, users cannot navigate away from attendance rows with arrow keys
 * - This was the root cause of the reported bug where navigation only worked from worklog rows
 *
 * FAILURE CONSEQUENCES:
 * - Arrow key navigation stops working from attendance cells
 * - Users get trapped in attendance rows and cannot move to worklog entries
 * - The timetable becomes unusable for keyboard-only workflows
 */
test('calculateFocusableItems creates attendance items with uppercase issueKey for navigation compatibility', t => {
	// EXPLICIT TEST DATA
	const attendanceManager = new AttendanceManager(mockAttendanceConfig);
	const options: FocusableItemCalculatorOptions = {
		attendanceManager,
		issueGroups: mockIssueGroups,
		columnCount: 5,
	};
	const expectedAttendanceIssueKey = 'ATTENDANCE-ATTENDANCE'; // Must be uppercase for IssueKey.toString() compatibility

	// OPERATIONS
	const focusableItems = calculateFocusableItems(options);

	// SPECIFIC VALUE COMPARISONS
	// Verify attendance items exist and have correct case
	const attendanceItems = focusableItems.filter(item => item.isAttendance);
	t.is(
		attendanceItems.length,
		5,
		'Should create 5 attendance items for weekdays',
	);

	// CRITICAL: Verify exact case match - this prevents navigation bugs
	for (const attendanceItem of attendanceItems) {
		t.is(
			attendanceItem.issueKey,
			expectedAttendanceIssueKey,
			'Attendance issueKey must be uppercase to match IssueKey.toString() format for navigation',
		);
		t.true(
			attendanceItem.isAttendance,
			'Attendance items must be marked as attendance',
		);
		t.true(
			attendanceItem.focusId.startsWith('attendance-attendance-'),
			'Focus ID should follow expected pattern',
		);
	}
});

/**
 * CRITICAL: This test MUST exist to prevent GridNavigationService lookup failures
 *
 * WHY THIS TEST IS ESSENTIAL:
 * - GridNavigationService.findCurrentItemIndex() uses getFocusableItemsByIssue internally
 * - The service converts focusedCell.issueKey.toString() to uppercase before searching
 * - If attendance items are stored with wrong case, the lookup returns empty array
 * - This causes navigation to fail silently without error messages
 *
 * FAILURE CONSEQUENCES:
 * - findCurrentItemIndex returns -1 for attendance cells
 * - Arrow key presses are ignored completely
 * - Users cannot navigate in any direction from attendance rows
 * - Debug logs show "Could not find current item" errors
 */
test('getFocusableItemsByIssue finds attendance items with case-sensitive matching', t => {
	// EXPLICIT TEST DATA
	const attendanceManager = new AttendanceManager(mockAttendanceConfig);
	const options: FocusableItemCalculatorOptions = {
		attendanceManager,
		issueGroups: mockIssueGroups,
		columnCount: 3,
	};
	const uppercaseAttendanceKey = 'ATTENDANCE-ATTENDANCE';
	const lowercaseAttendanceKey = 'attendance-attendance';

	// OPERATIONS
	const focusableItems = calculateFocusableItems(options);
	const uppercaseMatches = getFocusableItemsByIssue(
		focusableItems,
		uppercaseAttendanceKey,
	);
	const lowercaseMatches = getFocusableItemsByIssue(
		focusableItems,
		lowercaseAttendanceKey,
	);

	// SPECIFIC VALUE COMPARISONS
	// CRITICAL: Uppercase must match (this is what GridNavigationService expects)
	t.is(
		uppercaseMatches.length,
		3,
		'Must find attendance items with uppercase key',
	);
	t.is(
		lowercaseMatches.length,
		0,
		'Must NOT find attendance items with lowercase key',
	);

	// Verify all found items are attendance items
	for (const item of uppercaseMatches) {
		t.true(item.isAttendance, 'Found items must be attendance items');
		t.is(
			item.issueKey,
			uppercaseAttendanceKey,
			'Found items must have uppercase issueKey',
		);
	}
});

/**
 * CRITICAL: This test MUST exist to ensure IssueKey domain object compatibility
 *
 * WHY THIS TEST IS ESSENTIAL:
 * - AttendanceRows.tsx creates focusedCell with IssueKey.fromString('attendance-attendance')
 * - But IssueKey.toString() internally converts to uppercase format
 * - GridNavigationService expects string matching between focusedCell.issueKey.toString() and focusableItems[].issueKey
 * - This test validates the contract between domain object and navigation system
 *
 * FAILURE CONSEQUENCES:
 * - Type system allows wrong string format to be stored
 * - Navigation appears to work in TypeScript but fails at runtime
 * - Subtle bugs that only appear during actual user interaction
 * - No compile-time detection of the mismatch
 */
test('attendance issueKey format matches IssueKey.toString() output for navigation compatibility', t => {
	// EXPLICIT TEST DATA
	const attendanceManager = new AttendanceManager(mockAttendanceConfig);
	const options: FocusableItemCalculatorOptions = {
		attendanceManager,
		issueGroups: [],
		columnCount: 1,
	};
	const attendanceIssueKey = IssueKey.fromString('ATTENDANCE-ATTENDANCE');
	const expectedStringRepresentation = attendanceIssueKey.toString();

	// OPERATIONS
	const focusableItems = calculateFocusableItems(options);
	const attendanceItem = focusableItems.find(item => item.isAttendance);

	// SPECIFIC VALUE COMPARISONS
	t.truthy(attendanceItem, 'Should find attendance item');
	t.is(
		attendanceItem!.issueKey,
		expectedStringRepresentation,
		'Attendance item issueKey must match IssueKey.toString() for navigation compatibility',
	);
	t.is(
		expectedStringRepresentation,
		'ATTENDANCE-ATTENDANCE',
		'IssueKey.toString() returns uppercase format',
	);
});

/**
 * CRITICAL: This test MUST exist to prevent navigation order regression
 *
 * WHY THIS TEST IS ESSENTIAL:
 * - Up/down navigation depends on the exact order of items in focusableItems array
 * - GridNavigationService.navigateUp/Down filters by column then finds array index
 * - If attendance items are placed after issue items, up/down navigation breaks
 * - The visual order (attendance rows above worklog rows) must match array order
 *
 * FAILURE CONSEQUENCES:
 * - Up arrow from first worklog row doesn't reach attendance row
 * - Down arrow from attendance row skips to wrong worklog issue
 * - Navigation order becomes unpredictable and confusing
 * - Users cannot efficiently move between attendance and worklog sections
 */
test('calculateFocusableItems creates correct order: attendance first, then issues', t => {
	// EXPLICIT TEST DATA
	const attendanceManager = new AttendanceManager(mockAttendanceConfig);
	const options: FocusableItemCalculatorOptions = {
		attendanceManager,
		issueGroups: mockIssueGroups,
		columnCount: 2,
	};
	const expectedTotalItems = 2 + 2 * 2; // 2 attendance + (2 issues * 2 columns)

	// OPERATIONS
	const focusableItems = calculateFocusableItems(options);

	// SPECIFIC VALUE COMPARISONS
	t.is(
		focusableItems.length,
		expectedTotalItems,
		'Should create correct total number of items',
	);

	// Verify attendance items come first (critical for up/down navigation)
	const firstTwoItems = focusableItems.slice(0, 2);
	for (const item of firstTwoItems) {
		t.true(item.isAttendance, 'First items must be attendance items');
		t.is(
			item.issueKey,
			'ATTENDANCE-ATTENDANCE',
			'Attendance items must have correct case',
		);
	}

	// Verify issue items come after attendance
	const issueItems = focusableItems.slice(2);
	for (const item of issueItems) {
		t.false(item.isAttendance, 'Later items must be issue items');
		t.false(
			item.issueKey.includes('ATTENDANCE'),
			'Issue items must not be attendance',
		);
	}
});

/**
 * CRITICAL: This test MUST exist to prevent search utility regression
 *
 * WHY THIS TEST IS ESSENTIAL:
 * - findFocusableItem is used by GridNavigationService for complex navigation scenarios
 * - Components need to locate specific items for focus management and keyboard shortcuts
 * - Different item types (attendance vs worklog) have different properties and behaviors
 * - This validates that search predicates work correctly for both types
 *
 * FAILURE CONSEQUENCES:
 * - Focus management breaks when switching between attendance and worklog editing
 * - Keyboard shortcuts fail to find target cells
 * - Components cannot restore focus after form submissions
 * - Navigation becomes inconsistent between different parts of the timetable
 */
test('findFocusableItem can locate attendance and issue items correctly', t => {
	// EXPLICIT TEST DATA
	const attendanceManager = new AttendanceManager(mockAttendanceConfig);
	const options: FocusableItemCalculatorOptions = {
		attendanceManager,
		issueGroups: mockIssueGroups,
		columnCount: 2,
	};

	// OPERATIONS
	const focusableItems = calculateFocusableItems(options);
	const attendanceItem = findFocusableItem(
		focusableItems,
		item => item.isAttendance && item.columnIndex === 0,
	);
	const issueItem = findFocusableItem(
		focusableItems,
		item => !item.isAttendance && item.issueKey === 'PROJ-123',
	);

	// SPECIFIC VALUE COMPARISONS
	t.truthy(attendanceItem, 'Should find attendance item');
	t.is(
		attendanceItem!.issueKey,
		'ATTENDANCE-ATTENDANCE',
		'Found attendance item has correct case',
	);
	t.is(
		attendanceItem!.columnIndex,
		0,
		'Found attendance item has correct column',
	);
	t.true(attendanceItem!.isAttendance, 'Found item is marked as attendance');

	t.truthy(issueItem, 'Should find issue item');
	t.is(issueItem!.issueKey, 'PROJ-123', 'Found issue item has correct key');
	t.false(issueItem!.isAttendance, 'Found item is not marked as attendance');
});
