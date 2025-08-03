import type {YearlyStatistics} from '../use-cases/StatisticsUseCase.js';

export function formatStatisticsTable(stats: YearlyStatistics): string {
	const header = 'Month        | Worklog Days | Attendance Days';
	const separator = '-------------|--------------|----------------';
	const totalSeparator = '-------------|--------------|----------------';

	const monthRows = stats.monthlyStats.map(monthStat => {
		const month = monthStat.month.padEnd(12);
		const worklogDays = monthStat.worklogDays.toString().padStart(12);
		const attendanceDays = monthStat.attendanceDays.toString().padStart(15);
		return `${month} |${worklogDays} |${attendanceDays}`;
	});

	const totalRow = (() => {
		const month = 'Total'.padEnd(12);
		const worklogDays = stats.totalWorklogDays.toString().padStart(12);
		const attendanceDays = stats.totalAttendanceDays.toString().padStart(15);
		return `${month} |${worklogDays} |${attendanceDays}`;
	})();

	const lines = [header, separator, ...monthRows, totalSeparator, totalRow];

	return lines.join('\n');
}
