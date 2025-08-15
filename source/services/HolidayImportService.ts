import type {Attendance, AttendanceConfig} from '../attendance/types.js';
import type {LocalDate} from '../domain/LocalDate.js';
import {Holiday as HolidayClass} from '../domain/Holiday.js';
import {Year as YearClass} from '../domain/Year.js';

type HolidayApiResponse = Record<
	string,
	{
		datum: string;
		hinweis: string;
	}
>;

type AttendanceUpdater = {
	updateAttendance(attendance: Attendance): Promise<Attendance>;
	hasAttendanceForDate(date: LocalDate | string): Promise<boolean>;
};

export class HolidayImportService {
	constructor(
		private readonly attendanceManager: AttendanceUpdater,
		private readonly attendanceConfig: AttendanceConfig,
	) {}

	/**
	 * Import holidays for a specific year from feiertage-api.de
	 * @param year - Year to import holidays for (e.g., 2025)
	 * @returns Number of holidays imported
	 */
	async importHolidays(year: YearClass | number): Promise<number> {
		const yearObject = year instanceof YearClass ? year : new YearClass(year);
		if (!this.attendanceConfig.holidays?.land) {
			throw new Error(
				'Holiday land configuration is missing in attendance config',
			);
		}

		const {land} = this.attendanceConfig.holidays;
		const url = `https://feiertage-api.de/api/?jahr=${yearObject.getValue()}&nur_land=${land}`;

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(
					`Holiday API request failed: ${response.status} ${response.statusText}`,
				);
			}

			const holidaysData = (await response.json()) as HolidayApiResponse;
			const holidays = Object.entries(holidaysData).map(([name, data]) =>
				HolidayClass.fromApiData(name, data.datum, data.hinweis),
			);

			// Check for existing attendance entries
			const conflictingDates: LocalDate[] = [];
			const existenceChecks = await Promise.all(
				holidays.map(async holiday => ({
					holiday,
					hasExisting: await this.attendanceManager.hasAttendanceForDate(
						holiday.getDate(),
					),
				})),
			);

			for (const {holiday, hasExisting} of existenceChecks) {
				if (hasExisting) {
					conflictingDates.push(holiday.getDate());
				}
			}

			if (conflictingDates.length > 0) {
				throw new TypeError(
					`Cannot import holidays: The following dates already have attendance entries: ${conflictingDates
						.map(date => date.toISOString())
						.join(', ')}`,
				);
			}

			const holidayAttendances: Attendance[] = holidays.map(holiday =>
				holiday.toAttendance(),
			);

			// Import holidays serially to avoid race conditions in CSV storage
			await this.importHolidaysSequentially(holidayAttendances);

			return holidayAttendances.length;
		} catch (error: unknown) {
			if (error instanceof Error) {
				throw new TypeError(`Failed to import holidays: ${error.message}`);
			}

			throw new TypeError('Failed to import holidays: Unknown error');
		}
	}

	/**
	 * Check if holidays are configured for import
	 * @returns true if holiday configuration exists
	 */
	isConfigured(): boolean {
		return Boolean(this.attendanceConfig.holidays?.land);
	}

	/**
	 * Get the configured German state code
	 * @returns German state code or undefined if not configured
	 */
	getConfiguredLand(): string | undefined {
		return this.attendanceConfig.holidays?.land;
	}

	private async importHolidaysSequentially(
		holidayAttendances: Attendance[],
	): Promise<void> {
		// Import holidays one by one to avoid race conditions in CSV storage
		for (const attendance of holidayAttendances) {
			// eslint-disable-next-line no-await-in-loop
			await this.attendanceManager.updateAttendance(attendance);
		}
	}
}
