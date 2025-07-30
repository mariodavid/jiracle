import {useState} from 'react';
import {WeekRange} from '../domain/WeekRange.js';

export type ActiveArea =
	| 'timetable'
	| 'worklog-form'
	| 'delete-confirmation'
	| 'delete-attendance-confirmation'
	| 'attendance-edit'
	| 'checkin-confirmation'
	| 'checkout-confirmation'
	| 'align-time-confirmation';

export type UseNavigationStateOptions = {
	initialWeek?: WeekRange;
	initialActiveArea?: ActiveArea;
};

export type UseNavigationStateReturn = {
	// State
	currentWeek: WeekRange;
	activeArea: ActiveArea;

	// Week navigation
	navigateToPreviousWeek: () => void;
	navigateToNextWeek: () => void;
	navigateToCurrentWeek: () => void;

	// Area navigation
	setActiveArea: (area: ActiveArea) => void;
	returnToTimetable: () => void;
};

/**
 * Custom hook for managing navigation state in WeeklyTimetableView
 * Handles week navigation and active area transitions
 */
export function useNavigationState(
	options: UseNavigationStateOptions = {},
): UseNavigationStateReturn {
	const {initialWeek = WeekRange.current(), initialActiveArea = 'timetable'} =
		options;

	const [currentWeek, setCurrentWeek] = useState(initialWeek);
	const [activeArea, setActiveArea] = useState<ActiveArea>(initialActiveArea);

	const navigateToPreviousWeek = () => {
		setCurrentWeek(currentWeek.previous());
		// Return focus to table after navigation
		setActiveArea('timetable');
	};

	const navigateToNextWeek = () => {
		setCurrentWeek(currentWeek.next());
		// Return focus to table after navigation
		setActiveArea('timetable');
	};

	const navigateToCurrentWeek = () => {
		setCurrentWeek(WeekRange.current());
		// Return focus to table after navigation
		setActiveArea('timetable');
	};

	const returnToTimetable = () => {
		setActiveArea('timetable');
	};

	return {
		// State
		currentWeek,
		activeArea,

		// Week navigation
		navigateToPreviousWeek,
		navigateToNextWeek,
		navigateToCurrentWeek,

		// Area navigation
		setActiveArea,
		returnToTimetable,
	};
}
