import {useCallback} from 'react';
import type {LocalDate} from '../domain/LocalDate.js';
import {VacationPeriod} from '../domain/VacationPeriod.js';
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
			if (startDate.isAfter(endDate)) {
				throw new Error('Start date must be before or equal to end date');
			}

			// Note: Overlap detection would require async data loading
			// For now, we'll just proceed with the vacation creation

			// Create vacation entries using VacationPeriod domain methods
			const vacationPeriod = VacationPeriod.create(startDate, endDate);
			const allDates = vacationPeriod.getAllDates();

			// Save entries sequentially to avoid race conditions in CSV storage
			// Only save weekdays (Mo-Fr), skip weekends
			for (const date of allDates) {
				// Skip weekends
				if (!date.isWeekday()) {
					continue;
				}

				// NOTE: Converting LocalDate to string here because Attendance.date is string
				// This maintains compatibility with existing CSV storage and attendance system
				const vacationEntry: Attendance = {
					date: date.toISOString(),
					type: 'VACATION',
					breakMinutes: 0,
					totalHours: 0,
					notes: 'Vacation day',
				};

				// eslint-disable-next-line no-await-in-loop
				await attendanceManager.updateAttendance(vacationEntry);
			}
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
