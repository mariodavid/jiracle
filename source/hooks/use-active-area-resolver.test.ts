import test from 'ava';
import {
	useActiveAreaResolver,
	type ResolvedActiveArea,
} from './use-active-area-resolver.js';
import type {ActiveArea} from './use-navigation-state.js';
import type {WorklogFormData} from './use-worklog-form.js';
import type {
	DeleteCandidate,
	DeleteAttendanceCandidate,
} from './use-delete-operations.js';
import type {AttendanceEditState} from './use-attendance-management.js';

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

test('useActiveAreaResolver returns worklog-form when worklog form is visible', t => {
	const result = useActiveAreaResolver({
		activeArea: 'timetable',
		worklogForm: createWorklogForm({isVisible: true}),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
	});

	t.is(result, 'worklog-form');
});

test('useActiveAreaResolver returns delete-confirmation when area is delete-confirmation and candidate exists', t => {
	const result = useActiveAreaResolver({
		activeArea: 'delete-confirmation',
		worklogForm: createWorklogForm(),
		deleteCandidate: createDeleteCandidate(),
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
	});

	t.is(result, 'delete-confirmation');
});

test('useActiveAreaResolver returns timetable when delete-confirmation active but no candidate', t => {
	const result = useActiveAreaResolver({
		activeArea: 'delete-confirmation',
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
	});

	t.is(result, 'timetable');
});

test('useActiveAreaResolver returns delete-attendance-confirmation when area and candidate exist', t => {
	const result = useActiveAreaResolver({
		activeArea: 'delete-attendance-confirmation',
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: createDeleteAttendanceCandidate(),
		attendanceEdit: undefined,
	});

	t.is(result, 'delete-attendance-confirmation');
});

test('useActiveAreaResolver returns timetable when delete-attendance-confirmation active but no candidate', t => {
	const result = useActiveAreaResolver({
		activeArea: 'delete-attendance-confirmation',
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
	});

	t.is(result, 'timetable');
});

test('useActiveAreaResolver returns checkin-confirmation when area is checkin-confirmation', t => {
	const result = useActiveAreaResolver({
		activeArea: 'checkin-confirmation',
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
	});

	t.is(result, 'checkin-confirmation');
});

test('useActiveAreaResolver returns checkout-confirmation when area is checkout-confirmation', t => {
	const result = useActiveAreaResolver({
		activeArea: 'checkout-confirmation',
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
	});

	t.is(result, 'checkout-confirmation');
});

test('useActiveAreaResolver returns attendance-edit when area is attendance-edit and data exists', t => {
	const result = useActiveAreaResolver({
		activeArea: 'attendance-edit',
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: createAttendanceEdit(),
	});

	t.is(result, 'attendance-edit');
});

test('useActiveAreaResolver returns timetable when attendance-edit active but no data', t => {
	const result = useActiveAreaResolver({
		activeArea: 'attendance-edit',
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
	});

	t.is(result, 'timetable');
});

test('useActiveAreaResolver returns timetable as default', t => {
	const result = useActiveAreaResolver({
		activeArea: 'timetable',
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
	});

	t.is(result, 'timetable');
});

test('useActiveAreaResolver prioritizes worklog form over other states', t => {
	const result = useActiveAreaResolver({
		activeArea: 'delete-confirmation',
		worklogForm: createWorklogForm({isVisible: true}),
		deleteCandidate: createDeleteCandidate(),
		deleteAttendanceCandidate: createDeleteAttendanceCandidate(),
		attendanceEdit: createAttendanceEdit(),
	});

	t.is(result, 'worklog-form');
});

test('useActiveAreaResolver prioritizes delete confirmations over attendance operations', t => {
	const result = useActiveAreaResolver({
		activeArea: 'delete-confirmation',
		worklogForm: createWorklogForm(),
		deleteCandidate: createDeleteCandidate(),
		deleteAttendanceCandidate: undefined,
		attendanceEdit: createAttendanceEdit(),
	});

	t.is(result, 'delete-confirmation');
});

test('useActiveAreaResolver handles multiple attendance operations correctly', t => {
	// When multiple attendance operations are possible, active area determines which one
	const checkinResult = useActiveAreaResolver({
		activeArea: 'checkin-confirmation',
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: createAttendanceEdit(),
	});

	const editResult = useActiveAreaResolver({
		activeArea: 'attendance-edit',
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: createAttendanceEdit(),
	});

	t.is(checkinResult, 'checkin-confirmation');
	t.is(editResult, 'attendance-edit');
});

test('useActiveAreaResolver handles unknown active area', t => {
	const result = useActiveAreaResolver({
		activeArea: 'unknown' as ActiveArea,
		worklogForm: createWorklogForm(),
		deleteCandidate: undefined,
		deleteAttendanceCandidate: undefined,
		attendanceEdit: undefined,
	});

	t.is(result, 'timetable');
});

test('useActiveAreaResolver handles all combinations correctly', t => {
	// Test matrix of different combinations to ensure consistency
	const testCases: Array<{
		name: string;
		activeArea: ActiveArea;
		worklogVisible: boolean;
		hasDeleteCandidate: boolean;
		hasAttendanceCandidate: boolean;
		hasAttendanceEdit: boolean;
		expected: ResolvedActiveArea;
	}> = [
		{
			name: 'all false',
			activeArea: 'timetable',
			worklogVisible: false,
			hasDeleteCandidate: false,
			hasAttendanceCandidate: false,
			hasAttendanceEdit: false,
			expected: 'timetable',
		},
		{
			name: 'worklog visible overrides all',
			activeArea: 'delete-confirmation',
			worklogVisible: true,
			hasDeleteCandidate: true,
			hasAttendanceCandidate: true,
			hasAttendanceEdit: true,
			expected: 'worklog-form',
		},
		{
			name: 'delete confirmation without worklog',
			activeArea: 'delete-confirmation',
			worklogVisible: false,
			hasDeleteCandidate: true,
			hasAttendanceCandidate: false,
			hasAttendanceEdit: false,
			expected: 'delete-confirmation',
		},
	];

	for (const testCase of testCases) {
		const result = useActiveAreaResolver({
			activeArea: testCase.activeArea,
			worklogForm: createWorklogForm({isVisible: testCase.worklogVisible}),
			deleteCandidate: testCase.hasDeleteCandidate
				? createDeleteCandidate()
				: undefined,
			deleteAttendanceCandidate: testCase.hasAttendanceCandidate
				? createDeleteAttendanceCandidate()
				: undefined,
			attendanceEdit: testCase.hasAttendanceEdit
				? createAttendanceEdit()
				: undefined,
		});

		t.is(result, testCase.expected, `Test case: ${testCase.name}`);
	}
});
