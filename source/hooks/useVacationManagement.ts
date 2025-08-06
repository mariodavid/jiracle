import {useCallback} from 'react';
import type {LocalDate} from '../domain/LocalDate.js';
import type {AttendanceManager} from '../attendance/AttendanceManager.js';
import type {Attendance} from '../attendance/types.js';

export type UseVacationManagementProps = {
	attendanceManager: AttendanceManager | undefined;
};

export type UseVacationManagementReturn = {
	addVacationDays: (startDate: LocalDate, endDate: LocalDate) => Promise<void>;
	removeVacationDays: (startDate: LocalDate) => Promise<void>;
	getVacationDays: () => Attendance[];
};

export function useVacationManagement({
	attendanceManager,
}: UseVacationManagementProps): UseVacationManagementReturn {
	const addVacationDays = useCallback(
		async (startDate: LocalDate, endDate: LocalDate): Promise<void> => {
			if (!attendanceManager) {
				throw new Error('Attendance manager not available');
			}

			// Validate date range
			if (startDate.toISOString() > endDate.toISOString()) {
				throw new Error('Start date must be before or equal to end date');
			}

			// Note: Overlap detection would require async data loading
			// For now, we'll just proceed with the vacation creation

			// Create vacation entries for each day
			const startDateString = startDate.toISOString();
			const endDateString = endDate.toISOString();
			const promises: Array<Promise<Attendance>> = [];

			// Simple date iteration using Date objects
			const startDateObject = new Date(startDateString);
			const endDateObject = new Date(endDateString);
			const currentDateObject = new Date(startDateObject);

			while (currentDateObject.getTime() <= endDateObject.getTime()) {
				const dateString = currentDateObject.toISOString().split('T')[0] ?? '';

				const vacationEntry: Attendance = {
					date: dateString,
					checkIn: 'VACATION',
					checkOut: 'VACATION',
					breakMinutes: 0,
					totalHours: 0,
					notes: 'Vacation day',
				};

				promises.push(attendanceManager.updateAttendance(vacationEntry));
				currentDateObject.setDate(currentDateObject.getDate() + 1);
			}

			await Promise.all(promises);
		},
		[attendanceManager],
	);

	const removeVacationDays = useCallback(
		async (targetDate: LocalDate): Promise<void> => {
			if (!attendanceManager) {
				throw new Error('Attendance manager not available');
			}

			await attendanceManager.deleteAttendance(targetDate);
		},
		[attendanceManager],
	);

	const getVacationDays = useCallback((): Attendance[] => {
		if (!attendanceManager) {
			return [];
		}

		// Note: This is synchronous based on current data,
		// in reality we might need to make this async
		// For now, return empty array and handle async data at component level
		return [];
	}, [attendanceManager]);

	return {
		addVacationDays,
		removeVacationDays,
		getVacationDays,
	};
}
