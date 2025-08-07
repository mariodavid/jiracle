import type {Attendance} from '../attendance/types.js';
import {LocalDate} from './LocalDate.js';
import {VacationEntry} from './VacationEntry.js';

export const VacationService = {
	groupVacationDates(attendanceRecords: Attendance[]): VacationEntry[] {
		// Filter vacation entries and sort by date
		const vacationDates = attendanceRecords
			.filter(
				record =>
					record.checkIn === 'VACATION' && record.checkOut === 'VACATION',
			)
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

			// Check if current date is consecutive to the last date
			if (currentDate.equals(lastDate.addDays(1))) {
				currentGroup.push(currentDate);
			} else {
				// Start new group
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

	calculateTotalDays(vacationEntries: VacationEntry[]): number {
		return vacationEntries.reduce(
			(sum, entry) => sum + entry.getDurationDays(),
			0,
		);
	},
};
