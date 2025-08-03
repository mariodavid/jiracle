import type {JiraIssue, BonusConfig, WorklogEntry} from '../jira/types.js';

export type WorklogWithIssue = {
	worklog: WorklogEntry;
	issue: JiraIssue;
};

export const BillableHoursCalculator = {
	isBillableWorklog(issue: JiraIssue, bonusConfig: BonusConfig): boolean {
		if (!bonusConfig.billableCustomField) {
			return true;
		}

		const customFieldValue: unknown = (issue.fields as any)[
			bonusConfig.billableCustomField
		];

		if (bonusConfig.billableValues && bonusConfig.billableValues.length > 0) {
			return bonusConfig.billableValues.includes(String(customFieldValue));
		}

		return (
			customFieldValue !== null &&
			customFieldValue !== undefined &&
			customFieldValue !== ''
		);
	},

	calculateBillableHours(
		worklogsWithIssues: WorklogWithIssue[],
		bonusConfig: BonusConfig,
	): number {
		if (!bonusConfig.enabled || !bonusConfig.billableCustomField) {
			return this.calculateTotalHours(worklogsWithIssues);
		}

		return (
			worklogsWithIssues
				.filter(({issue}) => this.isBillableWorklog(issue, bonusConfig))
				.reduce((total, {worklog}) => total + worklog.timeSpentSeconds, 0) /
			3600
		);
	},

	calculateNonBillableHours(
		worklogsWithIssues: WorklogWithIssue[],
		bonusConfig: BonusConfig,
	): number {
		if (!bonusConfig.enabled || !bonusConfig.billableCustomField) {
			return 0;
		}

		return (
			worklogsWithIssues
				.filter(({issue}) => !this.isBillableWorklog(issue, bonusConfig))
				.reduce((total, {worklog}) => total + worklog.timeSpentSeconds, 0) /
			3600
		);
	},

	calculateTotalHours(worklogsWithIssues: WorklogWithIssue[]): number {
		return (
			worklogsWithIssues.reduce(
				(total, {worklog}) => total + worklog.timeSpentSeconds,
				0,
			) / 3600
		);
	},
};
