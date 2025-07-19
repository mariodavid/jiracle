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

	// Generate week title (German week: Monday to Friday)
	const getWeekTitle = (week: Date) => {
		const startOfWeek = new Date(week);
		// German week starts on Monday: getDay() returns 0=Sunday, 1=Monday, ..., 6=Saturday
		// To get Monday as start: if Sunday (0), go back 6 days, otherwise go back (day-1) days
		const day = startOfWeek.getDay();
		const daysToSubtract = day === 0 ? 6 : day - 1;
		startOfWeek.setDate(week.getDate() - daysToSubtract);

		// End of German work week is Friday (4 days after Monday)
		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(startOfWeek.getDate() + 4);

		const formatWeekDate = (date: Date) => {
			const month = date.getMonth() + 1;
			const day = date.getDate();
			return `${day}.${month}`;
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
