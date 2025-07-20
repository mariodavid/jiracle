import {useState} from 'react';

export type ActiveArea =
	| 'timetable'
	| 'worklog-form'
	| 'delete-confirmation'
	| 'delete-attendance-confirmation'
	| 'attendance-edit'
	| 'checkin-confirmation'
	| 'checkout-confirmation'
	| 'align-time-confirmation';

export interface UseNavigationStateOptions {
	initialWeek?: Date;
	initialActiveArea?: ActiveArea;
}

export interface UseNavigationStateReturn {
	// State
	currentWeek: Date;
	activeArea: ActiveArea;

	// Week navigation
	navigateToPreviousWeek: () => void;
	navigateToNextWeek: () => void;
	navigateToCurrentWeek: () => void;

	// Area navigation
	setActiveArea: (area: ActiveArea) => void;
	returnToTimetable: () => void;
}

/**
 * Custom hook for managing navigation state in WeeklyTimetableView
 * Handles week navigation and active area transitions
 */
export function useNavigationState(
	options: UseNavigationStateOptions = {},
): UseNavigationStateReturn {
	const {initialWeek = new Date(), initialActiveArea = 'timetable'} = options;

	const [currentWeek, setCurrentWeek] = useState(initialWeek);
	const [activeArea, setActiveArea] = useState<ActiveArea>(initialActiveArea);

	const navigateToPreviousWeek = () => {
		const newWeek = new Date(currentWeek);
		newWeek.setDate(currentWeek.getDate() - 7);
		setCurrentWeek(newWeek);
		// Return focus to table after navigation
		setActiveArea('timetable');
	};

	const navigateToNextWeek = () => {
		const newWeek = new Date(currentWeek);
		newWeek.setDate(currentWeek.getDate() + 7);
		setCurrentWeek(newWeek);
		// Return focus to table after navigation
		setActiveArea('timetable');
	};

	const navigateToCurrentWeek = () => {
		setCurrentWeek(new Date());
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
