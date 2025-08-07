// Domain models for the weekly worklog timetable feature
// Translated from Java records in the timesheets reference implementation

import type {IssueKey} from './IssueKey.js';
import type {LocalDate} from './LocalDate.js';
import type {Duration} from './Duration.js';

export type WeeklyWorklogSummary = {
	weekStart: LocalDate;
	weekEnd: LocalDate;
	dailySummaries: DailyWorklogSummary[];
	weekTotal: number;
};

export type DailyWorklogSummary = {
	date: LocalDate;
	totalHours: number;
	issues: IssueWorklogEntry[];
};

type WorklogSummaryData = {
	issueKey: IssueKey;
	issueSummary: string;
	duration: Duration;
	worklogId?: string;
	comment?: string;
};

type CreateWorklogSummaryOptions = {
	issueKey: IssueKey;
	issueSummary: string;
	duration: Duration;
	worklogId?: string;
	comment?: string;
};

export class WorklogSummary {
	static create(options: CreateWorklogSummaryOptions): WorklogSummary {
		return new WorklogSummary({
			issueKey: options.issueKey,
			issueSummary: options.issueSummary,
			duration: options.duration,
			worklogId: options.worklogId,
			comment: options.comment,
		});
	}

	constructor(private readonly data: WorklogSummaryData) {}

	get issueKey(): IssueKey {
		return this.data.issueKey;
	}

	get issueSummary(): string {
		return this.data.issueSummary;
	}

	get duration(): Duration {
		return this.data.duration;
	}

	get worklogId(): string | undefined {
		return this.data.worklogId;
	}

	get comment(): string | undefined {
		return this.data.comment;
	}

	get hours(): number {
		return this.data.duration.toHours();
	}

	get formattedDuration(): string {
		return this.data.duration.toString();
	}
}

export type IssueWorklogEntry = WorklogSummary;

// Additional interfaces for worklog API responses
export type WorklogResponse = {
	startAt: number;
	maxResults: number;
	total: number;
	worklogs: WorklogEntry[];
};

export type WorklogEntry = {
	id: string;
	issueId: string;
	author: {
		displayName: string;
		emailAddress: string;
	};
	comment: string | undefined;
	started: string; // ISO date string
	timeSpentSeconds: number;
};

// Interface for issues with worklogs (used in aggregation)
export type IssueWithWorklogs = {
	issue: {
		id: string;
		key: IssueKey;
		fields: {
			summary: string;
		};
	};
	worklogs: WorklogEntry[];
};
