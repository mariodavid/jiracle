import test from 'ava';
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
	issueKey: '',
	date: new Date(),
	timeSpent: '',
	comment: '',
	isIssueKeyEditable: false,
	isEditMode: false,
	worklogId: undefined,
	...overrides,
});

const createDeleteCandidate = (
	overrides: Partial<DeleteCandidate> = {},
): DeleteCandidate => ({
	issueKey: 'TEST-123',
	date: new Date('2024-01-15'),
	...overrides,
});

const createDeleteAttendanceCandidate = (
	overrides: Partial<DeleteAttendanceCandidate> = {},
): DeleteAttendanceCandidate => ({
	date: new Date('2024-01-15'),
	...overrides,
});

const createAttendanceEdit = (
	overrides: Partial<AttendanceEditState> = {},
): AttendanceEditState => ({
	date: new Date('2024-01-15'),
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
		issueKey: 'PROJECT-456',
		date: new Date('2024-01-15'),
	});

	const result = useTitleResolver({
		currentWeek: new Date('2024-01-15'),
		worklogForm,
		deleteCandidate: null,
		deleteAttendanceCandidate: null,
		attendanceEdit: null,
		activeArea: 'timetable',
	});

	t.is(result.title, 'PROJECT-456 on Monday, Jan 15');
	t.is(result.titleColor, undefined);
});

test('useTitleResolver returns delete confirmation title with red color', t => {
	const deleteCandidate = createDeleteCandidate({
		issueKey: 'PROJECT-789',
	});

	const result = useTitleResolver({
		currentWeek: new Date('2024-01-15'),
		worklogForm: createWorklogForm(),
		deleteCandidate,
		deleteAttendanceCandidate: null,
		attendanceEdit: null,
		activeArea: 'delete-confirmation',
	});

	t.is(result.title, 'Delete worklogs for PROJECT-789');
	t.is(result.titleColor, 'red');
});

test('useTitleResolver returns delete attendance confirmation title with red color', t => {
	const deleteAttendanceCandidate = createDeleteAttendanceCandidate({
		date: new Date('2024-01-15'),
	});

	const result = useTitleResolver({
		currentWeek: new Date('2024-01-15'),
		worklogForm: createWorklogForm(),
		deleteCandidate: null,
		deleteAttendanceCandidate,
		attendanceEdit: null,
		activeArea: 'delete-attendance-confirmation',
	});

	t.is(result.title, 'Delete attendance for Monday, Jan 15');
	t.is(result.titleColor, 'red');
});

test('useTitleResolver returns attendance edit title', t => {
	const attendanceEdit = createAttendanceEdit({
		date: new Date('2024-01-15'),
	});

	const result = useTitleResolver({
		currentWeek: new Date('2024-01-15'),
		worklogForm: createWorklogForm(),
		deleteCandidate: null,
		deleteAttendanceCandidate: null,
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
		deleteCandidate: null,
		deleteAttendanceCandidate: null,
		attendanceEdit: null,
		activeArea: 'timetable',
	});

	t.is(result.title, 'Week 15.1 - 19.1'); // Monday 15.1 to Friday 19.1
	t.is(result.titleColor, undefined);
});

test('useTitleResolver prioritizes worklog form over other states', t => {
	const worklogForm = createWorklogForm({
		isVisible: true,
		issueKey: 'PRIORITY-TEST',
		date: new Date('2024-01-15'),
	});

	const deleteCandidate = createDeleteCandidate();
	const attendanceEdit = createAttendanceEdit();

	const result = useTitleResolver({
		currentWeek: new Date('2024-01-15'),
		worklogForm,
		deleteCandidate,
		deleteAttendanceCandidate: null,
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
		deleteCandidate: null,
		deleteAttendanceCandidate: null,
		attendanceEdit: null,
		activeArea: 'delete-confirmation',
	});

	// Should fall back to week title
	t.is(result.title, 'Week 15.1 - 19.1');
	t.is(result.titleColor, undefined);
});

test('useTitleResolver handles attendance edit without data', t => {
	const result = useTitleResolver({
		currentWeek: new Date('2024-01-15'),
		worklogForm: createWorklogForm(),
		deleteCandidate: null,
		deleteAttendanceCandidate: null,
		attendanceEdit: null,
		activeArea: 'attendance-edit',
	});

	// Should fall back to week title
	t.is(result.title, 'Week 15.1 - 19.1');
	t.is(result.titleColor, undefined);
});

test('useTitleResolver formats different weekdays correctly', t => {
	// Test Tuesday
	const tuesdayResult = useTitleResolver({
		currentWeek: new Date('2024-01-16'), // Tuesday
		worklogForm: createWorklogForm({
			isVisible: true,
			issueKey: 'TEST-DAY',
			date: new Date('2024-01-16'),
		}),
		deleteCandidate: null,
		deleteAttendanceCandidate: null,
		attendanceEdit: null,
		activeArea: 'timetable',
	});

	t.is(tuesdayResult.title, 'TEST-DAY on Tuesday, Jan 16');

	// Test Sunday (week start)
	const sundayResult = useTitleResolver({
		currentWeek: new Date('2024-01-14'), // Sunday
		worklogForm: createWorklogForm({
			isVisible: true,
			issueKey: 'TEST-SUNDAY',
			date: new Date('2024-01-14'),
		}),
		deleteCandidate: null,
		deleteAttendanceCandidate: null,
		attendanceEdit: null,
		activeArea: 'timetable',
	});

	t.is(sundayResult.title, 'TEST-SUNDAY on Sunday, Jan 14');
});

test('useTitleResolver handles different months in week title', t => {
	// Week in January 2024 (German week: Monday to Friday)
	const result = useTitleResolver({
		currentWeek: new Date('2024-01-01'), // Monday Jan 1st
		worklogForm: createWorklogForm(),
		deleteCandidate: null,
		deleteAttendanceCandidate: null,
		attendanceEdit: null,
		activeArea: 'timetable',
	});

	t.is(result.title, 'Week 1.1 - 5.1'); // Monday 1.1 to Friday 5.1
	t.is(result.titleColor, undefined);
});

test('useTitleResolver handles year boundary correctly', t => {
	// Test year boundary: week spanning December 2024 to January 2025
	const result = useTitleResolver({
		currentWeek: new Date('2024-12-30'), // Monday
		worklogForm: createWorklogForm(),
		deleteCandidate: null,
		deleteAttendanceCandidate: null,
		attendanceEdit: null,
		activeArea: 'timetable',
	});

	t.is(result.title, 'Week 30.12 - 3.1'); // Monday 30.12 to Friday 3.1 (next year)
	t.is(result.titleColor, undefined);
});
