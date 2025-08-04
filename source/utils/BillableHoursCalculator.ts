import type {JiraIssue, BonusConfig, WorklogEntry} from '../jira/types.js';
import {BillabilityRule} from '../domain/BillabilityRule.js';
import {BillableWorklogEntry} from '../domain/BillableWorklogEntry.js';

export type WorklogWithIssue = {
	worklog: WorklogEntry;
	issue: JiraIssue;
};

export const BillableHoursCalculator = {
	isBillableWorklog(issue: JiraIssue, bonusConfig: BonusConfig): boolean {
		const rule = this.createBillabilityRule(bonusConfig);
		const mockWorklog: WorklogEntry = {
			id: 'temp',
			issueId: issue.id,
			author: {displayName: '', emailAddress: ''},
			comment: undefined,
			started: '',
			timeSpentSeconds: 0,
		};
		const entry = BillableWorklogEntry.create(mockWorklog, issue, rule);
		return entry.isBillable();
	},

	calculateBillableHours(
		worklogsWithIssues: WorklogWithIssue[],
		bonusConfig: BonusConfig,
	): number {
		if (!bonusConfig.enabled || !bonusConfig.billableCustomField) {
			return this.calculateTotalHours(worklogsWithIssues);
		}

		const rule = this.createBillabilityRule(bonusConfig);
		const entries = this.createBillableEntries(worklogsWithIssues, rule);

		return entries
			.filter(entry => entry.isBillable())
			.reduce((total, entry) => total + entry.getHours(), 0);
	},

	calculateNonBillableHours(
		worklogsWithIssues: WorklogWithIssue[],
		bonusConfig: BonusConfig,
	): number {
		if (!bonusConfig.enabled || !bonusConfig.billableCustomField) {
			return 0;
		}

		const rule = this.createBillabilityRule(bonusConfig);
		const entries = this.createBillableEntries(worklogsWithIssues, rule);

		return entries
			.filter(entry => entry.isNonBillable())
			.reduce((total, entry) => total + entry.getHours(), 0);
	},

	calculateTotalHours(worklogsWithIssues: WorklogWithIssue[]): number {
		const rule = BillabilityRule.alwaysBillable();
		const entries = this.createBillableEntries(worklogsWithIssues, rule);

		return entries.reduce((total, entry) => total + entry.getHours(), 0);
	},

	createBillabilityRule(bonusConfig: BonusConfig): BillabilityRule {
		if (!bonusConfig.billableCustomField) {
			return BillabilityRule.alwaysBillable();
		}

		return BillabilityRule.create(
			bonusConfig.billableCustomField,
			bonusConfig.billableValues,
		);
	},

	createBillableEntries(
		worklogsWithIssues: WorklogWithIssue[],
		rule: BillabilityRule,
	): BillableWorklogEntry[] {
		return worklogsWithIssues.map(({worklog, issue}) =>
			BillableWorklogEntry.create(worklog, issue, rule),
		);
	},
};
