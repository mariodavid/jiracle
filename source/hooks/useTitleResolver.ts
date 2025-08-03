import {LocalDate} from '../domain/LocalDate.js';
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
	const formatDate = (date: Date | LocalDate) => {
		// Convert LocalDate to Date if needed
		const jsDate =
			date instanceof LocalDate ? new Date(date.toISOString()) : date;
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

	// Calculate German calendar week (ISO 8601)
	const getGermanWeekNumber = (date: Date) => {
		const target = new Date(date);
		// ISO week starts on Monday
		const dayOfWeek = (target.getDay() + 6) % 7; // Monday = 0, Sunday = 6
		target.setDate(target.getDate() - dayOfWeek + 3); // Move to Wednesday of that week

		// Get first Thursday of year (week 1 is the week containing the first Thursday)
		const firstThursday = new Date(target.getFullYear(), 0, 4);
		const firstThursdayDay = (firstThursday.getDay() + 6) % 7; // Monday = 0
		firstThursday.setDate(firstThursday.getDate() - firstThursdayDay + 3); // Move to Wednesday of week 1

		// Calculate week number
		const weekNumber = Math.floor(
			(target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000) +
				1,
		);
		return weekNumber;
	};

	// Generate week title (German week: Monday to Friday with calendar week)
	const getWeekTitle = (weekRange: WeekRange) => {
		const startOfWeek = weekRange.getStart().toDate();
		// End of German work week is Friday (4 days after Monday)
		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(startOfWeek.getDate() + 4);

		const formatWeekDate = (date: Date) => {
			const month = date.getMonth() + 1;
			const day = date.getDate();
			return `${day}.${month}`;
		};

		const weekNumber = getGermanWeekNumber(startOfWeek);
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
