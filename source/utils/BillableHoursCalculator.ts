import type {JiraIssue, BonusConfig, WorklogEntry} from '../jira/types.js';
import {BillabilityRule} from '../domain/BillabilityRule.js';
import {BillableWorklogEntry} from '../domain/BillableWorklogEntry.js';
import {uiLogger} from './logger.js';

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
			const totalHours = this.calculateTotalHours(worklogsWithIssues);
			uiLogger.debug(
				'BillableHoursCalculator: No billable config, all hours billable',
				{
					totalHours,
					worklogsCount: worklogsWithIssues.length,
				},
			);
			return totalHours;
		}

		const rule = this.createBillabilityRule(bonusConfig);
		const entries = this.createBillableEntries(worklogsWithIssues, rule);

		const billableEntries = entries.filter(entry => entry.isBillable());
		const billableHours = billableEntries.reduce(
			(total, entry) => total + entry.getHours(),
			0,
		);

		uiLogger.debug('BillableHoursCalculator: Billable hours calculation', {
			totalEntries: entries.length,
			billableEntries: billableEntries.length,
			billableHours,
			billableCustomField: bonusConfig.billableCustomField,
			billableValues: bonusConfig.billableValues,
		});

		return billableHours;
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

		const nonBillableEntries = entries.filter(entry => entry.isNonBillable());
		const nonBillableHours = nonBillableEntries.reduce(
			(total, entry) => total + entry.getHours(),
			0,
		);

		uiLogger.debug('BillableHoursCalculator: Non-billable hours calculation', {
			totalEntries: entries.length,
			nonBillableEntries: nonBillableEntries.length,
			nonBillableHours,
		});

		return nonBillableHours;
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
