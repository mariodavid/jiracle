import type {Attendance, AttendanceConfig} from '../attendance/types.js';

type HolidayApiResponse = Record<
	string,
	{
		datum: string;
		hinweis: string;
	}
>;

type AttendanceUpdater = {
	updateAttendance(attendance: Attendance): Promise<Attendance>;
	hasAttendanceForDate(date: string): Promise<boolean>;
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
	async importHolidays(year: number): Promise<number> {
		if (!this.attendanceConfig.holidays?.land) {
			throw new Error(
				'Holiday land configuration is missing in attendance config',
			);
		}

		const {land} = this.attendanceConfig.holidays;
		const url = `https://feiertage-api.de/api/?jahr=${year}&nur_land=${land}`;

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(
					`Holiday API request failed: ${response.status} ${response.statusText}`,
				);
			}

			const holidaysData = (await response.json()) as HolidayApiResponse;
			const holidayDates = Object.values(holidaysData).map(
				holiday => holiday.datum,
			);

			// Check for existing attendance entries
			const conflictingDates: string[] = [];
			const existenceChecks = await Promise.all(
				holidayDates.map(async date => ({
					date,
					hasExisting: await this.attendanceManager.hasAttendanceForDate(date),
				})),
			);

			for (const {date, hasExisting} of existenceChecks) {
				if (hasExisting) {
					conflictingDates.push(date);
				}
			}

			if (conflictingDates.length > 0) {
				throw new TypeError(
					`Cannot import holidays: The following dates already have attendance entries: ${conflictingDates.join(
						', ',
					)}`,
				);
			}

			const holidayAttendances: Attendance[] = holidayDates.map(date => ({
				date,
				type: 'HOLIDAY',
				breakMinutes: 0,
				notes: 'Public Holiday',
			}));

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
