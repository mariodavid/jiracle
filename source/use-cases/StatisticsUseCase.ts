import {LocalDate} from '../domain/LocalDate.js';
import {Duration} from '../domain/Duration.js';
import {type JiraClient} from '../jira-client.js';
import {type AttendanceManager} from '../attendance/AttendanceManager.js';
import {type BonusConfig} from '../jira/types.js';
import {uiLogger} from '../utils/logger.js';
import {
	BillableHoursCalculator,
	type WorklogWithIssue,
} from '../utils/BillableHoursCalculator.js';

export type MonthlyStatistics = {
	month: string;
	worklogDays: number;
	attendanceDays: number;
	totalHours?: number;
	billableHours?: number;
	nonBillableHours?: number;
	businessDays?: number;
	potentialHours?: number;
	bonusDays?: number;
	efficiency?: number;
	vacationDays?: number;
};

export class YearlyStatistics {
	static create(data: {
		year: number;
		monthlyStats: MonthlyStatistics[];
		totalWorklogDays: number;
		totalAttendanceDays: number;
		totalHours?: number;
		totalBillableHours?: number;
		totalNonBillableHours?: number;
		totalBonusDays?: number;
		yearToDateEfficiency?: number;
		totalVacationDays?: number;
	}): YearlyStatistics {
		return new YearlyStatistics(data);
	}

	private constructor(
		private readonly data: {
			year: number;
			monthlyStats: MonthlyStatistics[];
			totalWorklogDays: number;
			totalAttendanceDays: number;
			totalHours?: number;
			totalBillableHours?: number;
			totalNonBillableHours?: number;
			totalBonusDays?: number;
			yearToDateEfficiency?: number;
			totalVacationDays?: number;
		},
	) {}

	get year(): number {
		return this.data.year;
	}

	get monthlyStats(): MonthlyStatistics[] {
		return this.data.monthlyStats;
	}

	get totalWorklogDays(): number {
		return this.data.totalWorklogDays;
	}

	get totalAttendanceDays(): number {
		return this.data.totalAttendanceDays;
	}

	get totalHours(): number | undefined {
		return this.data.totalHours;
	}

	get totalBillableHours(): number | undefined {
		return this.data.totalBillableHours;
	}

	get totalNonBillableHours(): number | undefined {
		return this.data.totalNonBillableHours;
	}

	get totalBonusDays(): number | undefined {
		return this.data.totalBonusDays;
	}

	get yearToDateEfficiency(): number | undefined {
		return this.data.yearToDateEfficiency;
	}

	get totalVacationDays(): number | undefined {
		return this.data.totalVacationDays;
	}

	getBillableHoursDuration(): Duration | undefined {
		return this.data.totalBillableHours
			? Duration.fromHours(this.data.totalBillableHours)
			: undefined;
	}

	getTotalHoursDuration(): Duration | undefined {
		return this.data.totalHours
			? Duration.fromHours(this.data.totalHours)
			: undefined;
	}
}

export class StatisticsUseCase {
	constructor(
		private readonly jiraClient: JiraClient,
		private readonly attendanceManager: AttendanceManager,
		private readonly bonusConfig?: BonusConfig,
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
		const totalVacationDays = monthlyStats.reduce(
			(sum, month) => sum + (month.vacationDays ?? 0),
			0,
		);

		const resultData = {
			year: targetYear,
			monthlyStats,
			totalWorklogDays,
			totalAttendanceDays,
			totalVacationDays,
		};

		if (this.bonusConfig?.enabled) {
			const totalHours = monthlyStats.reduce(
				(sum, month) => sum + (month.totalHours ?? 0),
				0,
			);
			const totalBillableHours = monthlyStats.reduce(
				(sum, month) => sum + (month.billableHours ?? 0),
				0,
			);
			const totalNonBillableHours = monthlyStats.reduce(
				(sum, month) => sum + (month.nonBillableHours ?? 0),
				0,
			);
			const totalBonusDays = monthlyStats.reduce(
				(sum, month) => sum + (month.bonusDays ?? 0),
				0,
			);
			const totalBusinessDays = monthlyStats.reduce(
				(sum, month) => sum + (month.businessDays ?? 0),
				0,
			);

			return YearlyStatistics.create({
				...resultData,
				totalHours,
				totalBillableHours,
				totalNonBillableHours,
				totalBonusDays,
				yearToDateEfficiency:
					totalBusinessDays > 0
						? (totalBonusDays / totalBusinessDays) * 100
						: 0,
			});
		}

		return YearlyStatistics.create(resultData);
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
		const [worklogDaysResult, attendanceDays, vacationDays] = await Promise.all(
			[
				this.calculateWorklogDaysAndHoursForMonth(year, month),
				this.calculateAttendanceDaysForMonth(year, month),
				this.calculateVacationDaysForMonth(year, month),
			],
		);

		const result: MonthlyStatistics = {
			month: monthName,
			worklogDays: worklogDaysResult.days,
			attendanceDays,
			billableHours: worklogDaysResult.billableHours,
			nonBillableHours: worklogDaysResult.nonBillableHours,
			vacationDays,
		};

		if (this.bonusConfig?.enabled) {
			const businessDays = this.calculateBusinessDaysInMonth(year, month);
			const potentialHours = businessDays * this.bonusConfig.hoursPerBonusDay;
			const bonusDays =
				worklogDaysResult.billableHours / this.bonusConfig.hoursPerBonusDay;
			const efficiency =
				businessDays > 0 ? (bonusDays / businessDays) * 100 : 0;

			result.totalHours = worklogDaysResult.hours;
			result.businessDays = businessDays;
			result.potentialHours = potentialHours;
			result.bonusDays = Math.round(bonusDays * 100) / 100;
			result.efficiency = Math.round(efficiency * 100) / 100;
		}

		uiLogger.debug('StatisticsUseCase: Month calculated', {
			monthName,
			worklogDays: result.worklogDays,
			attendanceDays: result.attendanceDays,
			totalHours: result.totalHours,
			bonusDays: result.bonusDays,
			efficiency: result.efficiency,
		});

		return result;
	}

	private async calculateWorklogDaysAndHoursForMonth(
		year: number,
		month: number,
	): Promise<{
		days: number;
		hours: number;
		billableHours: number;
		nonBillableHours: number;
	}> {
		const startDate = this.getMonthStart(year, month);
		const endDate = this.getMonthEnd(year, month);

		const jql = this.buildJqlQuery(startDate, endDate);

		try {
			const additionalFields = this.bonusConfig?.billableCustomField
				? [this.bonusConfig.billableCustomField]
				: [];
			const searchResult = await this.jiraClient.searchIssuesWithWorklogs(
				jql,
				additionalFields,
			);
			const currentUser = await this.jiraClient.getCurrentUser();
			const currentUserEmail = currentUser.emailAddress;

			const worklogDates = new Set<string>();
			let totalHours = 0;
			const worklogsWithIssues: WorklogWithIssue[] = [];

			const worklogPromises = searchResult.issues.map(async issue => {
				const worklogResponse = await this.jiraClient.getIssueWorklogs(
					issue.key.toString(),
				);

				const userWorklogs = worklogResponse.worklogs.filter(
					worklog => worklog.author.emailAddress === currentUserEmail,
				);

				const validDates: string[] = [];
				for (const worklog of userWorklogs) {
					const worklogDate = new Date(worklog.started);
					const worklogLocalDate = LocalDate.fromDate(worklogDate);
					if (this.isDateInMonth(worklogLocalDate, year, month)) {
						validDates.push(worklogLocalDate.toISOString());
						totalHours += Duration.fromSeconds(
							worklog.timeSpentSeconds,
						).toHours();
						worklogsWithIssues.push({worklog, issue});
					}
				}

				return validDates;
			});

			const allWorklogDates = await Promise.all(worklogPromises);

			for (const dates of allWorklogDates) {
				for (const date of dates) {
					worklogDates.add(date);
				}
			}

			const billableHours = this.bonusConfig
				? BillableHoursCalculator.calculateBillableHours(
						worklogsWithIssues,
						this.bonusConfig,
				  )
				: totalHours;

			const nonBillableHours = this.bonusConfig
				? BillableHoursCalculator.calculateNonBillableHours(
						worklogsWithIssues,
						this.bonusConfig,
				  )
				: 0;

			uiLogger.debug('StatisticsUseCase: Billable hours calculation', {
				year,
				month,
				totalHours,
				billableHours,
				nonBillableHours,
				worklogsCount: worklogsWithIssues.length,
				bonusConfigEnabled: this.bonusConfig?.enabled,
				billableCustomField: this.bonusConfig?.billableCustomField,
				billableValues: this.bonusConfig?.billableValues,
			});

			return {
				days: worklogDates.size,
				hours: totalHours,
				billableHours,
				nonBillableHours,
			};
		} catch (error: unknown) {
			uiLogger.error('Error calculating worklog days and hours', {
				year,
				month,
				error: error instanceof Error ? error.message : String(error),
			});
			return {days: 0, hours: 0, billableHours: 0, nonBillableHours: 0};
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

	private async calculateVacationDaysForMonth(
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

			const vacationDates = attendanceRecords.filter(
				record => record.type === 'VACATION',
			);

			return vacationDates.length;
		} catch (error: unknown) {
			uiLogger.error('Error calculating vacation days', {
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

	private calculateBusinessDaysInMonth(year: number, month: number): number {
		const lastDayOfMonth = new Date(year, month, 0).getDate();
		let businessDays = 0;

		for (let day = 1; day <= lastDayOfMonth; day++) {
			const date = new Date(year, month - 1, day);
			const dayOfWeek = date.getDay();
			if (dayOfWeek !== 0 && dayOfWeek !== 6) {
				businessDays++;
			}
		}

		return businessDays;
	}
}
