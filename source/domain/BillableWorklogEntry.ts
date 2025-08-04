import type {JiraIssue, WorklogEntry} from '../jira/types.js';
import {Duration} from './Duration.js';
import {BillabilityStatus, type BillabilityRule} from './BillabilityRule.js';

export class BillableWorklogEntry {
	static create(
		worklog: WorklogEntry,
		issue: JiraIssue,
		rule: BillabilityRule,
	): BillableWorklogEntry {
		return new BillableWorklogEntry(worklog, issue, rule);
	}

	private readonly billabilityStatus: BillabilityStatus;
	private readonly duration: Duration;

	constructor(
		private readonly worklog: WorklogEntry,
		private readonly issue: JiraIssue,
		rule: BillabilityRule,
	) {
		this.billabilityStatus = rule.evaluate(issue);
		this.duration = Duration.fromSeconds(worklog.timeSpentSeconds);
	}

	isBillable(): boolean {
		return this.billabilityStatus === BillabilityStatus.Billable;
	}

	isNonBillable(): boolean {
		return this.billabilityStatus === BillabilityStatus.NonBillable;
	}

	getDuration(): Duration {
		return this.duration;
	}

	getHours(): number {
		return this.duration.toHours();
	}

	getWorklog(): WorklogEntry {
		return this.worklog;
	}

	getIssue(): JiraIssue {
		return this.issue;
	}

	getIssueKey(): string {
		return this.issue.key.toString();
	}

	equals(other: BillableWorklogEntry): boolean {
		return (
			this.worklog.id === other.worklog.id &&
			this.issue.id === other.issue.id &&
			this.billabilityStatus === other.billabilityStatus
		);
	}
}
