import {TimeParsingService} from '../services/TimeParsingService.js';

/**
 * Hook that provides time parsing functionality
 * Wraps TimeParsingService for use in React components
 */
export function useTimeParser() {
	const parseTimeToHours = (timeString: string): number => {
		return TimeParsingService.parseTimeToHours(timeString);
	};

	const normalizeTimeString = (inputValue: string): string => {
		return TimeParsingService.normalizeTimeString(inputValue);
	};

	const generateTimeMarks = (incrementMinutes: number): number[] => {
		return TimeParsingService.generateTimeMarks(incrementMinutes);
	};

	const adjustTime = (
		currentTimeString: string,
		direction: 'up' | 'down',
		incrementMinutes: number,
	): string => {
		return TimeParsingService.adjustTime(
			currentTimeString,
			direction,
			incrementMinutes,
		);
	};

	return {
		parseTimeToHours,
		normalizeTimeString,
		generateTimeMarks,
		adjustTime,
	};
}
