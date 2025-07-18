import type {
	DeleteCandidate,
	DeleteAttendanceCandidate,
} from './useDeleteOperations.js';
import type {AttendanceEditState} from './useAttendanceManagement.js';
import type {WorklogFormData} from './useWorklogForm.js';

export interface UseTitleResolverOptions {
	currentWeek: Date;
	worklogForm: WorklogFormData;
	deleteCandidate: DeleteCandidate | null;
	deleteAttendanceCandidate: DeleteAttendanceCandidate | null;
	attendanceEdit: AttendanceEditState | null;
	activeArea: string;
}

export interface UseTitleResolverReturn {
	title: string;
	titleColor?: 'red' | 'cyan';
}

export function useTitleResolver({
	currentWeek,
	worklogForm,
	deleteCandidate,
	deleteAttendanceCandidate,
	attendanceEdit,
	activeArea,
}: UseTitleResolverOptions): UseTitleResolverReturn {
	// Format date for display
	const formatDate = (date: Date) => {
		const days = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
		];
		const months = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
		];
		return `${days[date.getDay()]}, ${
			months[date.getMonth()]
		} ${date.getDate()}`;
	};

	// Generate week title
	const getWeekTitle = (week: Date) => {
		const startOfWeek = new Date(week);
		startOfWeek.setDate(week.getDate() - week.getDay());

		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(startOfWeek.getDate() + 6);

		const formatWeekDate = (date: Date) => {
			const month = date.getMonth() + 1;
			const day = date.getDate();
			return `${month}/${day}`;
		};

		return `Week ${formatWeekDate(startOfWeek)} - ${formatWeekDate(endOfWeek)}`;
	};

	// Resolve title based on current state
	if (worklogForm.isVisible) {
		return {
			title: `${worklogForm.issueKey} on ${formatDate(worklogForm.date)}`,
		};
	}

	if (activeArea === 'delete-confirmation' && deleteCandidate) {
		return {
			title: `Delete worklogs for ${deleteCandidate.issueKey}`,
			titleColor: 'red',
		};
	}

	if (
		activeArea === 'delete-attendance-confirmation' &&
		deleteAttendanceCandidate
	) {
		return {
			title: `Delete attendance for ${formatDate(
				deleteAttendanceCandidate.date,
			)}`,
			titleColor: 'red',
		};
	}

	if (activeArea === 'attendance-edit' && attendanceEdit) {
		return {
			title: `Anwesenheit - ${formatDate(attendanceEdit.date)}`,
		};
	}

	// Default: week title
	return {
		title: getWeekTitle(currentWeek),
	};
}
