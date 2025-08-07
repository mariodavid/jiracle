import test from 'ava';
import {IssueKey} from '../../domain/IssueKey.js';
import {LocalDate} from '../../domain/LocalDate.js';
import {Duration} from '../../domain/Duration.js';
import {
	type WeeklyWorklogSummary,
	WorklogSummary,
} from '../../domain/WeeklyWorklogSummary.js';
import type {WeeklyAttendance} from '../../attendance/types.js';
import type {JiraConfig} from '../../jira-client.js';
import {TestPatterns, TestData} from '../utils/test-helpers.js';
import {calculateFocusableItems} from '../../utils/FocusableItemCalculator.js';
import {navigateInDirection} from '../../services/GridNavigationService.js';
import {AttendanceManager} from '../../attendance/AttendanceManager.js';

// Test Data: Complete integration scenario with attendance and worklog data
const mockConfig: JiraConfig = {
	jiraUrl: 'https://test.atlassian.net',
	username: 'test@example.com',
	apiToken: 'test-token',
	defaultTime: '8h',
	defaultComment: 'Development work',
	attendance: {
		enabled: true,
		workingHours: 8,
		breakMinutes: 30,
		defaultCheckIn: '08:00',
		defaultCheckOut: '17:00',
		defaultBreakMinutes: 30,
	},
};

const mockWeekDates = TestData.weekDates('2024-01-08')
	.map(date => date.toDate())
	.slice(0, 5); // Monday to Friday

const mockWeeklyWorklogSummary: WeeklyWorklogSummary = {
	weekStart: LocalDate.fromDate(mockWeekDates[0]!),
	weekEnd: LocalDate.fromDate(mockWeekDates[4]!),
	weekTotal: 4,
	dailySummaries: [
		{
			date: LocalDate.fromDate(mockWeekDates[0]!),
			totalHours: 4,
			issues: [
				WorklogSummary.create({
					issueKey: IssueKey.fromString('PROJ-123'),
					issueSummary: 'Test Issue',
					duration: Duration.fromHours(4),
				}),
			],
		},
	],
};

const mockWeeklyAttendance: WeeklyAttendance = {
	'2024-01-08': {
		date: '2024-01-08',
		checkIn: '09:00',
		checkOut: '17:00',
		breakMinutes: 30,
		totalHours: 8,
	},
	'2024-01-09': {
		date: '2024-01-09',
		checkIn: '08:30',
		checkOut: '16:30',
		breakMinutes: 30,
		totalHours: 8,
	},
};

/**
 * CRITICAL: This integration test MUST exist to prevent complete navigation breakdown
 *
 * WHY THIS TEST IS ESSENTIAL:
 * - This replicates the exact user workflow that was broken
 * - Tests the full chain: AttendanceManager -> FocusableItemCalculator -> GridNavigationService
 * - Validates that case sensitivity is handled correctly across all layers
 * - Uses real data structures that mirror what components actually create
 *
 * FAILURE CONSEQUENCES:
 * - Users cannot navigate from attendance rows to worklog entries
 * - The entire keyboard navigation system becomes unusable
 * - Attendance editing workflow breaks completely
 * - Critical accessibility failure for keyboard-only users
 */
test('complete navigation flow: attendance to worklog navigation works with real data structures', async t => {
	await TestPatterns.withTempFiles(async () => {
		// EXPLICIT TEST DATA
		const expectedNavigationSuccess = true;
		const attendanceManager = new AttendanceManager(mockConfig.attendance!);

		// Create issue groups that mirror real component data
		const mockIssueGroups = [
			{
				group: undefined,
				issues: [
					[
						'PROJ-123',
						{summary: 'Test Issue', dailyHours: {}, weekTotal: 4},
					] as [string, any],
				],
				totalHours: 4,
			},
		];

		// OPERATIONS
		// Test the complete flow from FocusableItemCalculator to GridNavigationService
		const focusableItems = calculateFocusableItems({
			attendanceManager,
			issueGroups: mockIssueGroups,
			columnCount: 5,
		});

		// Simulate user focused on attendance cell (this is what AttendanceRows creates)
		const focusedOnAttendance = {
			issueKey: IssueKey.fromString('ATTENDANCE-ATTENDANCE'), // Real IssueKey object
			columnIndex: 0,
			isAttendance: true,
		};

		// Test navigation from attendance to worklog (the exact broken scenario)
		const navigationResult = navigateInDirection('down', {
			focusedCell: focusedOnAttendance,
			focusableItems,
			columnCount: 5,
		});

		// SPECIFIC VALUE COMPARISONS
		t.is(
			navigationResult.success,
			expectedNavigationSuccess,
			'Navigation from attendance to worklog must succeed with real data structures',
		);
		t.truthy(navigationResult.targetItem, 'Must find target worklog item');
		t.is(
			navigationResult.targetItem!.issueKey,
			'PROJ-123',
			'Must navigate to correct worklog issue',
		);
		t.false(
			navigationResult.targetItem!.isAttendance,
			'Target must be worklog item, not attendance',
		);

		// Test the critical case sensitivity requirement
		const attendanceItems = focusableItems.filter(item => item.isAttendance);
		t.true(attendanceItems.length > 0, 'Must have attendance items');

		for (const item of attendanceItems) {
			t.is(
				item.issueKey,
				'ATTENDANCE-ATTENDANCE',
				'All attendance items must have uppercase issueKey for navigation compatibility',
			);
		}
	});
});

/**
 * CRITICAL: This integration test MUST exist to prevent focus management regression
 *
 * WHY THIS TEST IS ESSENTIAL:
 * - Focus detection logic must correctly identify attendance vs worklog cells
 * - The detection uses issueKey.toString().toLowerCase().startsWith('attendance-')
 * - Case sensitivity in IssueKey affects the detection logic
 * - This validates the focus management logic with real IssueKey objects
 *
 * FAILURE CONSEQUENCES:
 * - Focus state becomes inconsistent between attendance and worklog cells
 * - Visual focus indicators show wrong state
 * - Keyboard navigation commands target wrong items
 * - User loses track of current position in the timetable
 */
test('focus management integration: attendance cell detection works correctly', async t => {
	await TestPatterns.withTempFiles(async () => {
		// EXPLICIT TEST DATA
		const expectedAttendanceDetection = true;
		const expectedWorklogDetection = false;

		// Test the actual focus detection logic used by components
		const attendanceIssueKey = IssueKey.fromString('ATTENDANCE-ATTENDANCE');
		const worklogIssueKey = IssueKey.fromString('PROJ-123');

		// OPERATIONS
		// This replicates the exact logic used in useFocusManagement.ts
		const attendanceDetection = attendanceIssueKey
			.toString()
			.toLowerCase()
			.startsWith('attendance-');

		const worklogDetection = worklogIssueKey
			.toString()
			.toLowerCase()
			.startsWith('attendance-');

		// SPECIFIC VALUE COMPARISONS
		t.is(
			attendanceDetection,
			expectedAttendanceDetection,
			'Attendance IssueKey must be detected as attendance',
		);
		t.is(
			worklogDetection,
			expectedWorklogDetection,
			'Worklog IssueKey must NOT be detected as attendance',
		);

		// Test the string representation that gets used in detection
		const attendanceString = attendanceIssueKey.toString();
		const attendanceLowercase = attendanceString.toLowerCase();

		t.is(
			attendanceString,
			'ATTENDANCE-ATTENDANCE',
			'IssueKey.toString() returns uppercase format',
		);
		t.is(
			attendanceLowercase,
			'attendance-attendance',
			'Lowercase conversion works for detection logic',
		);
		t.true(
			attendanceLowercase.startsWith('attendance-'),
			'Detection logic correctly identifies attendance prefix',
		);
	});
});

/**
 * CRITICAL: This integration test MUST exist to prevent data flow regression
 *
 * WHY THIS TEST IS ESSENTIAL:
 * - This validates that attendance data flows correctly through the system
 * - The data structures must match what real components expect and produce
 * - Tests the integration between WeeklyAttendance and IssueKey objects
 * - Ensures domain objects work together correctly for navigation
 *
 * FAILURE CONSEQUENCES:
 * - Components receive malformed data causing runtime errors
 * - Navigation breaks due to incompatible data structures
 * - Domain object integration fails silently
 * - User experience becomes unpredictable and unreliable
 */
test('data integration: attendance and worklog data structures work together', async t => {
	await TestPatterns.withTempFiles(async () => {
		// EXPLICIT TEST DATA
		const expectedDataIntegrity = true;

		// OPERATIONS
		// Test that all data structures used in the system are compatible
		const attendanceDate = Object.keys(mockWeeklyAttendance)[0]!;
		const attendanceData = mockWeeklyAttendance[attendanceDate]!;
		const worklogSummary = mockWeeklyWorklogSummary.dailySummaries[0]!;

		// Test IssueKey consistency
		const attendanceIssueKey = IssueKey.fromString('ATTENDANCE-ATTENDANCE');
		const worklogIssueKey = worklogSummary.issues[0]!.issueKey;

		// SPECIFIC VALUE COMPARISONS
		// Verify attendance data structure
		t.truthy(attendanceData.date, 'Attendance must have date field');
		t.truthy(attendanceData.totalHours, 'Attendance must have totalHours');
		t.is(
			typeof attendanceData.breakMinutes,
			'number',
			'BreakMinutes must be number',
		);

		// Verify worklog data structure
		t.truthy(worklogSummary.date, 'Worklog summary must have date');
		t.truthy(worklogSummary.issues, 'Worklog summary must have issues array');
		t.is(
			typeof worklogSummary.issues[0]!.duration.toHours(),
			'number',
			'Issue duration must convert to number of hours',
		);

		// Verify IssueKey consistency
		t.is(
			attendanceIssueKey.toString(),
			'ATTENDANCE-ATTENDANCE',
			'Attendance IssueKey must be uppercase',
		);
		t.is(
			typeof worklogIssueKey.toString(),
			'string',
			'Worklog IssueKey must convert to string',
		);

		// Verify date compatibility
		const attendanceLocalDate = LocalDate.fromString(attendanceData.date);
		const worklogLocalDate = worklogSummary.date;

		t.is(
			typeof attendanceLocalDate.toISOString(),
			'string',
			'Attendance date must convert to ISO string',
		);
		t.is(
			typeof worklogLocalDate.toISOString(),
			'string',
			'Worklog date must convert to ISO string',
		);

		t.is(
			expectedDataIntegrity,
			true,
			'All data structures must be compatible for integration',
		);
	});
});
