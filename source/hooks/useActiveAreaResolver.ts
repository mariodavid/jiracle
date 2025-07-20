import type {ActiveArea} from './useNavigationState.js';
import type {WorklogFormData} from './useWorklogForm.js';
import type {
	DeleteCandidate,
	DeleteAttendanceCandidate,
} from './useDeleteOperations.js';
import type {AttendanceEditState} from './useAttendanceManagement.js';

export type UseActiveAreaResolverOptions = {
	activeArea: ActiveArea;
	worklogForm: WorklogFormData;
	deleteCandidate: DeleteCandidate | null;
	deleteAttendanceCandidate: DeleteAttendanceCandidate | null;
	attendanceEdit: AttendanceEditState | null;
};

export type ResolvedActiveArea =
	| 'worklog-form'
	| 'delete-confirmation'
	| 'delete-attendance-confirmation'
	| 'checkin-confirmation'
	| 'checkout-confirmation'
	| 'align-time-confirmation'
	| 'attendance-edit'
	| 'timetable';

export function useActiveAreaResolver({
	activeArea,
	worklogForm,
	deleteCandidate,
	deleteAttendanceCandidate,
	attendanceEdit,
}: UseActiveAreaResolverOptions): ResolvedActiveArea {
	// Priority hierarchy for resolving the active area

	// Highest priority: Worklog form
	if (worklogForm.isVisible) {
		return 'worklog-form';
	}

	// Second priority: Delete confirmations (only if candidate exists)
	if (activeArea === 'delete-confirmation' && deleteCandidate) {
		return 'delete-confirmation';
	}

	if (
		activeArea === 'delete-attendance-confirmation' &&
		deleteAttendanceCandidate
	) {
		return 'delete-attendance-confirmation';
	}

	// Third priority: Attendance operations
	if (activeArea === 'checkin-confirmation') {
		return 'checkin-confirmation';
	}

	if (activeArea === 'checkout-confirmation') {
		return 'checkout-confirmation';
	}

	if (activeArea === 'align-time-confirmation') {
		return 'align-time-confirmation';
	}

	if (activeArea === 'attendance-edit' && attendanceEdit) {
		return 'attendance-edit';
	}

	// Default: Timetable
	return 'timetable';
}
