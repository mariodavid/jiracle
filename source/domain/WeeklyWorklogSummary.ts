// Domain models for the weekly worklog timetable feature
// Translated from Java records in the timesheets reference implementation

import type {IssueKey} from './IssueKey.js';
import type {LocalDate} from './LocalDate.js';

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

export type IssueWorklogEntry = {
	issueKey: IssueKey;
	issueSummary: string;
	hours: number;
	// Optional worklog ID - only set when there's exactly one worklog for this issue/date
	worklogId?: string;
	// Optional comment - only set when there's exactly one worklog for this issue/date
	comment?: string;
};

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
