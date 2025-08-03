import {LocalDate} from '../domain/LocalDate.js';
import {type JiraClient} from '../jira-client.js';
import {type AttendanceManager} from '../attendance/AttendanceManager.js';
import {uiLogger} from '../utils/logger.js';

export type MonthlyStatistics = {
	month: string;
	worklogDays: number;
	attendanceDays: number;
};

export type YearlyStatistics = {
	year: number;
	monthlyStats: MonthlyStatistics[];
	totalWorklogDays: number;
	totalAttendanceDays: number;
};

export class StatisticsUseCase {
	constructor(
		private readonly jiraClient: JiraClient,
		private readonly attendanceManager: AttendanceManager,
	) {}

	async execute(year?: number): Promise<YearlyStatistics> {
		const targetYear = year ?? new Date().getFullYear();

		uiLogger.debug('StatisticsUseCase: Starting execution', {targetYear});

		const monthlyStats = await this.calculateMonthlyStatistics(targetYear);

		const totalWorklogDays = monthlyStats.reduce(
			(sum, month) => sum + month.worklogDays,
			0,
		);
		const totalAttendanceDays = monthlyStats.reduce(
			(sum, month) => sum + month.attendanceDays,
			0,
		);

		return {
			year: targetYear,
			monthlyStats,
			totalWorklogDays,
			totalAttendanceDays,
		};
	}

	private async calculateMonthlyStatistics(
		year: number,
	): Promise<MonthlyStatistics[]> {
		const monthNames = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December',
		];

		const monthlyPromises = monthNames.map(async (monthName, index) => {
			const monthNumber = index + 1;
			return this.calculateMonthStatistics(year, monthNumber, monthName);
		});

		return Promise.all(monthlyPromises);
	}

	private async calculateMonthStatistics(
		year: number,
		month: number,
		monthName: string,
	): Promise<MonthlyStatistics> {
		const [worklogDays, attendanceDays] = await Promise.all([
			this.calculateWorklogDaysForMonth(year, month),
			this.calculateAttendanceDaysForMonth(year, month),
		]);

		uiLogger.debug('StatisticsUseCase: Month calculated', {
			monthName,
			worklogDays,
			attendanceDays,
		});

		return {
			month: monthName,
			worklogDays,
			attendanceDays,
		};
	}

	private async calculateWorklogDaysForMonth(
		year: number,
		month: number,
	): Promise<number> {
		const startDate = this.getMonthStart(year, month);
		const endDate = this.getMonthEnd(year, month);

		const jql = this.buildJqlQuery(startDate, endDate);

		try {
			const searchResult = await this.jiraClient.searchIssuesWithWorklogs(jql);
			const currentUser = await this.jiraClient.getCurrentUser();
			const currentUserEmail = currentUser.emailAddress;

			const worklogDates = new Set<string>();

			const worklogPromises = searchResult.issues.map(async issue => {
				const worklogResponse = await this.jiraClient.getIssueWorklogs(
					issue.key.toString(),
				);

				const userWorklogs = worklogResponse.worklogs.filter(
					worklog => worklog.author.emailAddress === currentUserEmail,
				);

				return userWorklogs
					.map(worklog => {
						const worklogDate = new Date(worklog.started);
						const worklogLocalDate = LocalDate.fromDate(worklogDate);
						return this.isDateInMonth(worklogLocalDate, year, month)
							? worklogLocalDate.toISOString()
							: null;
					})
					.filter((date): date is string => date !== null);
			});

			const allWorklogDates = await Promise.all(worklogPromises);

			for (const dates of allWorklogDates) {
				for (const date of dates) {
					worklogDates.add(date);
				}
			}

			return worklogDates.size;
		} catch (error: unknown) {
			uiLogger.error('Error calculating worklog days', {
				year,
				month,
				error: error instanceof Error ? error.message : String(error),
			});
			return 0;
		}
	}

	private async calculateAttendanceDaysForMonth(
		year: number,
		month: number,
	): Promise<number> {
		const startDate = this.getMonthStart(year, month);
		const endDate = this.getMonthEnd(year, month);

		try {
			const attendanceRecords = await this.attendanceManager.getAttendanceRange(
				startDate,
				endDate,
			);

			const attendanceDates = attendanceRecords.filter(
				record => record.checkIn ?? record.checkOut,
			);

			return attendanceDates.length;
		} catch (error: unknown) {
			uiLogger.error('Error calculating attendance days', {
				year,
				month,
				error: error instanceof Error ? error.message : String(error),
			});
			return 0;
		}
	}

	private getMonthStart(year: number, month: number): LocalDate {
		return LocalDate.fromString(
			`${year}-${month.toString().padStart(2, '0')}-01`,
		);
	}

	private getMonthEnd(year: number, month: number): LocalDate {
		const lastDay = new Date(year, month, 0).getDate();
		return LocalDate.fromString(
			`${year}-${month.toString().padStart(2, '0')}-${lastDay
				.toString()
				.padStart(2, '0')}`,
		);
	}

	private isDateInMonth(date: LocalDate, year: number, month: number): boolean {
		const dateString = date.toISOString();
		const targetYearMonth = `${year}-${month.toString().padStart(2, '0')}`;
		return dateString.startsWith(targetYearMonth);
	}

	private buildJqlQuery(startDate: LocalDate, endDate: LocalDate): string {
		const startDateString = this.formatDateForJql(startDate);
		const endDateString = this.formatDateForJql(endDate);

		return `worklogAuthor = currentUser() AND worklogDate >= "${startDateString}" AND worklogDate <= "${endDateString}"`;
	}

	private formatDateForJql(date: LocalDate): string {
		return date.toISOString();
	}
}
