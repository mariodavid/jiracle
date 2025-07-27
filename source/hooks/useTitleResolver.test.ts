import test from 'ava';
import {IssueKey} from '../domain/IssueKey.js';
import {Duration} from '../domain/Duration.js';
import {LocalDate} from '../domain/LocalDate.js';
import {useTitleResolver} from './useTitleResolver.js';
import type {
	DeleteCandidate,
	DeleteAttendanceCandidate,
} from './useDeleteOperations.js';
import type {AttendanceEditState} from './useAttendanceManagement.js';
import type {WorklogFormData} from './useWorklogForm.js';

// Test data factories
const createWorklogForm = (
	overrides: Partial<WorklogFormData> = {},
): WorklogFormData => ({
	isVisible: false,
	issueKey: undefined,
	date: LocalDate.today(),
	timeSpent: new Duration('0h'),
	comment: '',
	isIssueKeyEditable: false,
	isEditMode: false,
	worklogId: undefined,
	...overrides,
});

const createDeleteCandidate = (
	overrides: Partial<DeleteCandidate> = {},
): DeleteCandidate => ({
	issueKey: IssueKey.fromString('TEST-123'),
	date: LocalDate.fromString('2024-01-15'),
	...overrides,
});

const createDeleteAttendanceCandidate = (
	overrides: Partial<DeleteAttendanceCandidate> = {},
): DeleteAttendanceCandidate => ({
	date: LocalDate.fromString('2024-01-15'),
	...overrides,
});

const createAttendanceEdit = (
	overrides: Partial<AttendanceEditState> = {},
): AttendanceEditState => ({
	date: LocalDate.fromString('2024-01-15'),
	data: {
		date: '2024-01-15',
		checkIn: '09:00',
		checkOut: '17:00',
		breakMinutes: 30,
	},
	...overrides,
});

test('useTitleResolver returns worklog form title when form is visible', t => {
	const worklogForm = createWorklogForm({
		isVisible: true,
		issueKey: IssueKey.fromString('PROJECT-456'),
		date: LocalDate.fromString('2024-01-15'),
	});

	const result = useTitleResolver({
		currentWeek: new Date('2024-01-15'),
		worklogForm,
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
		activeArea: 'timetable',
	});

	t.is(result.title, 'PROJECT-456 on Monday, Jan 15');
	t.is(result.titleColor, undefined);
});

test('useTitleResolver returns delete confirmation title with red color', t => {
	const deleteCandidate = createDeleteCandidate({
		issueKey: IssueKey.fromString('PROJECT-789'),
	});

	const result = useTitleResolver({
		currentWeek: new Date('2024-01-15'),
		worklogForm: createWorklogForm(),
		deleteCandidate,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
		activeArea: 'delete-confirmation',
	});

	t.is(result.title, 'Delete worklogs for PROJECT-789');
	t.is(result.titleColor, 'red');
});

test('useTitleResolver returns delete attendance confirmation title with red color', t => {
	const deleteAttendanceCandidate = createDeleteAttendanceCandidate({
		date: LocalDate.fromString('2024-01-15'),
	});

	const result = useTitleResolver({
		currentWeek: new Date('2024-01-15'),
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate,
		attendanceEdit: undefined,
		activeArea: 'delete-attendance-confirmation',
	});

	t.is(result.title, 'Delete attendance for Monday, Jan 15');
	t.is(result.titleColor, 'red');
});

test('useTitleResolver returns attendance edit title', t => {
	const attendanceEdit = createAttendanceEdit({
		date: LocalDate.fromString('2024-01-15'),
	});

	const result = useTitleResolver({
		currentWeek: new Date('2024-01-15'),
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit,
		activeArea: 'attendance-edit',
	});

	t.is(result.title, 'Anwesenheit - Monday, Jan 15');
	t.is(result.titleColor, undefined);
});

test('useTitleResolver returns week title as default', t => {
	const result = useTitleResolver({
		currentWeek: new Date('2024-01-15'), // Monday
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
		activeArea: 'timetable',
	});

	t.is(result.title, 'KW3 (15.1 - 19.1)'); // Calendar week 3, Monday 15.1 to Friday 19.1
	t.is(result.titleColor, undefined);
});

test('useTitleResolver prioritizes worklog form over other states', t => {
	const worklogForm = createWorklogForm({
		isVisible: true,
		issueKey: IssueKey.fromString('PRIORITY-TEST'),
		date: LocalDate.fromString('2024-01-15'),
	});

	const deleteCandidate = createDeleteCandidate();
	const attendanceEdit = createAttendanceEdit();

	const result = useTitleResolver({
		currentWeek: new Date('2024-01-15'),
		worklogForm,
		deleteCandidate,
		deleteAttendanceCandidate: undefined,
		attendanceEdit,
		activeArea: 'delete-confirmation',
	});

	t.is(result.title, 'PRIORITY-TEST on Monday, Jan 15');
	t.is(result.titleColor, undefined);
});

test('useTitleResolver handles delete confirmation without candidate', t => {
	const result = useTitleResolver({
		currentWeek: new Date('2024-01-15'),
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
		activeArea: 'delete-confirmation',
	});

	// Should fall back to week title
	t.is(result.title, 'KW3 (15.1 - 19.1)');
	t.is(result.titleColor, undefined);
});

test('useTitleResolver handles attendance edit without data', t => {
	const result = useTitleResolver({
		currentWeek: new Date('2024-01-15'),
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
		activeArea: 'attendance-edit',
	});

	// Should fall back to week title
	t.is(result.title, 'KW3 (15.1 - 19.1)');
	t.is(result.titleColor, undefined);
});

test('useTitleResolver formats different weekdays correctly', t => {
	// Test Tuesday
	const tuesdayResult = useTitleResolver({
		currentWeek: new Date('2024-01-16'), // Tuesday
		worklogForm: createWorklogForm({
			isVisible: true,
			issueKey: IssueKey.fromString('TEST-DAY'),
			date: LocalDate.fromString('2024-01-16'),
		}),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
		activeArea: 'timetable',
	});

	t.is(tuesdayResult.title, 'TEST-DAY on Tuesday, Jan 16');

	// Test Sunday (week start)
	const sundayResult = useTitleResolver({
		currentWeek: new Date('2024-01-14'), // Sunday
		worklogForm: createWorklogForm({
			isVisible: true,
			issueKey: IssueKey.fromString('TEST-SUNDAY'),
			date: LocalDate.fromString('2024-01-14'),
		}),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
		activeArea: 'timetable',
	});

	t.is(sundayResult.title, 'TEST-SUNDAY on Sunday, Jan 14');
});

test('useTitleResolver handles different months in week title', t => {
	// Week in January 2024 (German week: Monday to Friday)
	const result = useTitleResolver({
		currentWeek: new Date('2024-01-01'), // Monday Jan 1st
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
		activeArea: 'timetable',
	});

	t.is(result.title, 'KW1 (1.1 - 5.1)'); // Calendar week 1, Monday 1.1 to Friday 5.1
	t.is(result.titleColor, undefined);
});

test('useTitleResolver handles year boundary correctly', t => {
	// Test year boundary: week spanning December 2024 to January 2025
	const result = useTitleResolver({
		currentWeek: new Date('2024-12-30'), // Monday
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
		activeArea: 'timetable',
	});

	t.is(result.title, 'KW1 (30.12 - 3.1)'); // Calendar week 1 of 2025, Monday 30.12 to Friday 3.1
	t.is(result.titleColor, undefined);
});

test('useTitleResolver calculates German calendar weeks correctly', t => {
	// Test various dates to ensure correct ISO 8601 week calculation
	const testCases = [
		{
			date: new Date('2024-01-01'),
			expectedWeek: 'KW1',
			description: 'New Year 2024',
		},
		{
			date: LocalDate.fromString('2024-01-15'),
			expectedWeek: 'KW3',
			description: 'Mid January 2024',
		},
		{
			date: new Date('2024-07-15'),
			expectedWeek: 'KW29',
			description: 'Mid July 2024',
		},
		{
			date: new Date('2024-12-30'),
			expectedWeek: 'KW1',
			description: 'End of 2024 (KW1 of 2025)',
		},
	];

	for (const testCase of testCases) {
		const result = useTitleResolver({
			currentWeek: testCase.date,
			worklogForm: createWorklogForm(),
			deleteCandidate: undefined,
			deleteAttendanceCandidate: undefined,
			attendanceEdit: undefined,
			activeArea: 'timetable',
		});

		t.true(
			result.title.startsWith(testCase.expectedWeek),
			`${testCase.description}: Expected "${testCase.expectedWeek}" but got "${result.title}"`,
		);
	}
});
