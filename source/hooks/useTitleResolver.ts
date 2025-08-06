import type {LocalDate} from '../domain/LocalDate.js';
import type {WeekRange} from '../domain/WeekRange.js';
import type {
	DeleteCandidate,
	DeleteAttendanceCandidate,
} from './useDeleteOperations.js';
import type {AttendanceEditState} from './useAttendanceManagement.js';
import type {WorklogFormData} from './useWorklogForm.js';

export type UseTitleResolverOptions = {
	currentWeek: WeekRange;
	worklogForm: WorklogFormData;
	deleteCandidate: DeleteCandidate | undefined;
	deleteAttendanceCandidate: DeleteAttendanceCandidate | undefined;
	attendanceEdit: AttendanceEditState | undefined;
	activeArea: string;
};

export type UseTitleResolverReturn = {
	title: string;
	titleColor?: 'red' | 'cyan';
};

export function useTitleResolver({
	currentWeek,
	worklogForm,
	deleteCandidate,
	deleteAttendanceCandidate,
	attendanceEdit,
	activeArea,
}: UseTitleResolverOptions): UseTitleResolverReturn {
	// Format date for display
	const formatDate = (date: LocalDate) => {
		const jsDate = date.toDate();
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
		return `${days[jsDate.getDay()] ?? 'Unknown'}, ${
			months[jsDate.getMonth()] ?? 'Unknown'
		} ${jsDate.getDate()}`;
	};

	// Calculate German calendar week (ISO 8601) using LocalDate/WeekRange
	const getGermanWeekNumber = (weekRange: WeekRange) => {
		// Use the Wednesday of the week to determine the year (ISO 8601 standard)
		const wednesday = weekRange.getStart().addDays(2);
		const year = wednesday.toDate().getFullYear();

		// Find first Thursday of the year
		const firstThursday = new Date(year, 0, 4);
		const firstThursdayDayOfWeek = firstThursday.getDay();

		// Find the Monday of the week containing the first Thursday
		const firstMondayOfYear = new Date(firstThursday);
		firstMondayOfYear.setDate(
			firstThursday.getDate() -
				(firstThursdayDayOfWeek === 0 ? 6 : firstThursdayDayOfWeek - 1),
		);

		// Calculate weeks between first Monday and current week start
		const weekStart = weekRange.getStart().toDate();
		const diffInMs = weekStart.getTime() - firstMondayOfYear.getTime();
		const diffInWeeks = Math.floor(diffInMs / (7 * 24 * 60 * 60 * 1000));
		return diffInWeeks + 1;
	};

	// Format date for week display (dd.mm format)
	const formatWeekDate = (date: LocalDate) => {
		const jsDate = date.toDate();
		const month = jsDate.getMonth() + 1;
		const day = jsDate.getDate();
		return `${day}.${month}`;
	};

	// Generate week title (German week: Monday to Friday with calendar week)
	const getWeekTitle = (weekRange: WeekRange) => {
		const startOfWeek = weekRange.getStart();
		// End of German work week is Friday (4 days after Monday)
		const endOfWeek = startOfWeek.addDays(4);

		const weekNumber = getGermanWeekNumber(weekRange);
		return `KW${weekNumber} (${formatWeekDate(startOfWeek)} - ${formatWeekDate(
			endOfWeek,
		)})`;
	};

	// Resolve title based on current state
	if (worklogForm.isVisible) {
		return {
			title: `${
				worklogForm.issueKey?.toString() ?? 'New Issue'
			} on ${formatDate(worklogForm.date)}`,
		};
	}

	if (activeArea === 'delete-confirmation' && deleteCandidate) {
		return {
			title: `Delete worklogs for ${deleteCandidate.issueKey.toString()}`,
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

	if (activeArea === 'align-time-confirmation') {
		return {
			title: 'Time Alignment Confirmation',
			titleColor: 'cyan',
		};
	}

	if (activeArea === 'attendance-edit' && attendanceEdit) {
		return {
			title: `Anwesenheit - ${formatDate(attendanceEdit.date)}`,
		};
	}

	if (activeArea === 'statistics') {
		return {
			title: 'Statistics 2025',
		};
	}

	// Default: week title
	return {
		title: getWeekTitle(currentWeek),
	};
}
