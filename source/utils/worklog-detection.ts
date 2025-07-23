import type {IssueWorklogEntry} from '../domain/WeeklyWorklogSummary.js';

/**
 * Utility functions for detecting editable worklogs
 */

export type WorklogDetectionResult = {
	hasWorklog: boolean;
	isEditable: boolean;
	worklogId?: string;
	comment?: string;
	timeSpent?: string;
};

/**
 * Detects if a worklog exists for the given issue and determines if it's editable
 * @param issueWorklogEntry The issue worklog entry from the weekly summary
 * @returns Detection result with edit information
 */
export function detectWorklogForEdit(
	issueWorklogEntry?: IssueWorklogEntry,
): WorklogDetectionResult {
	if (!issueWorklogEntry || issueWorklogEntry.hours === 0) {
		return {
			hasWorklog: false,
			isEditable: false,
		};
	}

	// If we have a worklog ID, it means there's exactly one worklog for this issue/date
	// and it can be edited
	if (issueWorklogEntry.worklogId) {
		return {
			hasWorklog: true,
			isEditable: true,
			worklogId: issueWorklogEntry.worklogId,
			comment: issueWorklogEntry.comment ?? '',
			timeSpent: formatHoursAsTimeSpent(issueWorklogEntry.hours),
		};
	}

	// If there's time logged but no worklog ID, it means there are multiple worklogs
	// aggregated together, so it's not directly editable
	return {
		hasWorklog: true,
		isEditable: false,
	};
}

/**
 * Converts hours (decimal) to Jira time spent format
 * @param hours Decimal hours (e.g., 2.5)
 * @returns Time spent string (e.g., "2h 30m")
 */
function formatHoursAsTimeSpent(hours: number): string {
	if (hours <= 0) {
		return '0m';
	}

	const wholeHours = Math.floor(hours);
	const minutes = Math.round((hours - wholeHours) * 60);

	if (wholeHours > 0 && minutes > 0) {
		return `${wholeHours}h ${minutes}m`;
	}

	if (wholeHours > 0) {
		return `${wholeHours}h`;
	}

	return `${minutes}m`;
}

/**
 * Finds the worklog entry for a specific issue key in the daily summary
 * @param issueKey The issue key to search for
 * @param dailyIssues Array of issue worklog entries for a specific day
 * @returns The matching issue worklog entry or undefined
 */
export function findWorklogEntryForIssue(
	issueKey: string,
	dailyIssues: IssueWorklogEntry[],
): IssueWorklogEntry | undefined {
	return dailyIssues.find(entry => entry.issueKey === issueKey);
}
