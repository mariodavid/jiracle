import {createMockJiraClient} from '../../WeeklyWorklogSummaryUseCase.testutils.js';
import {WeeklyWorklogSummaryUseCase} from '../../../../use-cases/WeeklyWorklogSummaryUseCase.js';
import type {JiraClient} from '../../../../jira-client.js';
import type {JiraSearchResponse} from '../../../../jira/types.js';

export const setupBasicTest = () => {
	const client = createMockJiraClient();
	const useCase = new WeeklyWorklogSummaryUseCase(client);

	// Mock current user
	client.getCurrentUser = async () => ({emailAddress: 'user1@example.com'});

	return {client, useCase};
};

export const setupJqlQueryCapture = (client: JiraClient) => {
	const jqlQueries: string[] = [];

	const originalSearchIssuesWithWorklogs = client.searchIssuesWithWorklogs;
	client.searchIssuesWithWorklogs = async (
		jql: string,
	): Promise<JiraSearchResponse> => {
		jqlQueries.push(jql);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return originalSearchIssuesWithWorklogs(jql) as any;
	};

	return jqlQueries;
};

export const setupDateCapture = (client: JiraClient) => {
	let capturedWindowStartDate = '';
	const capturedWindowDates: string[] = [];

	const originalSearchIssuesWithWorklogs = client.searchIssuesWithWorklogs;
	client.searchIssuesWithWorklogs = async (
		jql: string,
	): Promise<JiraSearchResponse> => {
		// Capture single date for sliding window start
		const singleMatch = /worklogDate >= "([^"]+)"/.exec(jql);
		if (singleMatch) {
			capturedWindowStartDate = singleMatch[1]!;
		}

		// Capture date range for more complex queries
		const rangeMatch =
			/worklogDate >= "([^"]+)" AND worklogDate <= "([^"]+)"/.exec(jql);
		if (rangeMatch) {
			capturedWindowDates.splice(0, capturedWindowDates.length);
			capturedWindowDates.push(rangeMatch[1]!, rangeMatch[2]!);
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return originalSearchIssuesWithWorklogs(jql) as any;
	};

	return {
		capturedWindowStartDate: () => capturedWindowStartDate,
		capturedWindowDates,
	};
};
