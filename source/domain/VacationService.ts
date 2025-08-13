import type {Attendance} from '../attendance/types.js';
import {LocalDate} from './LocalDate.js';
import {VacationEntry} from './VacationEntry.js';

export const VacationService = {
	groupVacationDates(attendanceRecords: Attendance[]): VacationEntry[] {
		// Filter vacation entries and sort by date
		const vacationDates = attendanceRecords
			.filter(record => record.type === 'VACATION')
			.map(record => LocalDate.fromString(record.date))
			.sort((a, b) => a.toISOString().localeCompare(b.toISOString()));

		if (vacationDates.length === 0) {
			return [];
		}

		const groups: VacationEntry[] = [];
		let currentGroup: LocalDate[] = [vacationDates[0]!];

		for (let i = 1; i < vacationDates.length; i++) {
			const currentDate = vacationDates[i]!;
			const lastDate = currentGroup[currentGroup.length - 1]!;

			// Check if dates are close enough to be considered one vacation period
			// Allow gaps for weekends (max 3 days gap for Fri->Mon)
			const daysDifference = VacationService.calculateDaysDifference(
				lastDate,
				currentDate,
			);

			if (daysDifference <= 3) {
				currentGroup.push(currentDate);
			} else {
				// Start new group - use first and last actual vacation dates
				groups.push(
					VacationEntry.create(
						currentGroup[0]!,
						currentGroup[currentGroup.length - 1]!,
					),
				);
				currentGroup = [currentDate];
			}
		}

		// Add the last group
		groups.push(
			VacationEntry.create(
				currentGroup[0]!,
				currentGroup[currentGroup.length - 1]!,
			),
		);

		return groups;
	},

	// Helper method to calculate days difference
	calculateDaysDifference(date1: LocalDate, date2: LocalDate): number {
		const d1 = date1.toDate().getTime();
		const d2 = date2.toDate().getTime();
		return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
	},

	calculateTotalDays(vacationEntries: VacationEntry[]): number {
		return vacationEntries.reduce(
			(sum, entry) => sum + entry.getWeekdayCount(),
			0,
		);
	},
};
