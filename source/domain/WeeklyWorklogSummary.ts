// Domain models for the weekly worklog timetable feature
// Translated from Java records in the timesheets reference implementation

export interface WeeklyWorklogSummary {
	weekStart: Date;
	weekEnd: Date;
	dailySummaries: DailyWorklogSummary[];
	weekTotal: number;
}

export interface DailyWorklogSummary {
	date: Date;
	totalHours: number;
	issues: IssueWorklogEntry[];
}

export interface IssueWorklogEntry {
	issueKey: string;
	issueSummary: string;
	hours: number;
}

// Additional interfaces for worklog API responses
export interface WorklogResponse {
	startAt: number;
	maxResults: number;
	total: number;
	worklogs: WorklogEntry[];
}

export interface WorklogEntry {
	id: string;
	issueId: string;
	author: {
		displayName: string;
		emailAddress: string;
	};
	comment: string;
	started: string; // ISO date string
	timeSpentSeconds: number;
}

// Interface for issues with worklogs (used in aggregation)
export interface IssueWithWorklogs {
	issue: {
		id: string;
		key: string;
		fields: {
			summary: string;
		};
	};
	worklogs: WorklogEntry[];
}
