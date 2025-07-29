import type {ExecutionContext} from 'ava';
import type {WeeklyWorklogSummary} from '../../../../domain/WeeklyWorklogSummary.js';

export const assertSingleDayResult = (
	t: ExecutionContext,
	result: WeeklyWorklogSummary,
	expectedTotalHours: number,
	expectedIssueCount: number,
) => {
	t.is(result.dailySummaries.length, 1);
	t.is(result.dailySummaries[0]!.totalHours, expectedTotalHours);
	t.is(result.dailySummaries[0]!.issues.length, expectedIssueCount);
};

export const assertIssueInResult = (
	t: ExecutionContext,
	result: WeeklyWorklogSummary,
	issueKey: string,
	expectedHours: number,
) => {
	const issue = result.dailySummaries[0]!.issues.find(
		issue => issue.issueKey.toString() === issueKey,
	);
	t.truthy(issue, `${issueKey} should be present`);
	t.is(
		issue!.hours,
		expectedHours,
		`${issueKey} should have ${expectedHours} hours`,
	);
};

export const assertJqlQueriesCount = (
	t: ExecutionContext,
	jqlQueries: string[],
	expectedCount: number,
	description: string,
) => {
	t.is(jqlQueries.length, expectedCount, description);
};

export const assertDateInJqlQuery = (
	t: ExecutionContext,
	jqlQuery: string,
	expectedDate: string,
	description: string,
) => {
	t.true(jqlQuery.includes(expectedDate), description);
};

export const assertLookbackDateCaptured = (
	t: ExecutionContext,
	capturedDate: string,
	weekStart: Date,
	description: string,
) => {
	t.truthy(capturedDate, description);
	const lookbackStart = new Date(capturedDate);
	t.true(
		lookbackStart < weekStart,
		'Lookback start should be before the current week start',
	);
};
