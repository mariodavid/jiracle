import type {
	JiraIssue,
	JiraSearchResponse,
	WorklogEntry,
	WorklogResponse,
} from '../../../../jira/types.js';
import {IssueKey} from '../../../../domain/IssueKey.js';
import {LocalDate} from '../../../../domain/LocalDate.js';
import {WeekRange} from '../../../../domain/WeekRange.js';

export const createMockIssue = (overrides: {
	id?: string;
	key?: string;
	summary?: string;
	status?: string;
	statusCategory?: string;
	issuetype?: string;
	priority?: string;
	created?: string;
	updated?: string;
}): JiraIssue => ({
	id: overrides.id ?? '111111',
	key: IssueKey.fromString(overrides.key ?? 'TEST-123'),
	fields: {
		summary: overrides.summary ?? 'Test issue',
		status: {
			name: overrides.status ?? 'In Progress',
			statusCategory: {name: overrides.statusCategory ?? 'In Progress'},
		},
		issuetype: {name: overrides.issuetype ?? 'Task', iconUrl: ''},
		priority: {name: overrides.priority ?? 'Medium', iconUrl: ''},
		assignee: {
			displayName: 'Test User',
			emailAddress: 'user1@example.com',
		},
		created: overrides.created ?? '2024-10-01T10:00:00.000Z',
		updated: overrides.updated ?? '2024-10-10T15:30:00.000Z',
	},
});

export const createMockWorklog = (overrides: {
	id?: string;
	issueId?: string;
	comment?: string;
	started?: string;
	timeSpentSeconds?: number;
}): WorklogEntry => ({
	id: overrides.id ?? '111111',
	issueId: overrides.issueId ?? '111111',
	author: {
		displayName: 'Test User',
		emailAddress: 'user1@example.com',
	},
	comment: overrides.comment ?? '',
	started: overrides.started ?? '2024-10-15T08:00:00.000+0200',
	timeSpentSeconds: overrides.timeSpentSeconds ?? 3600,
});

export const createEmptySearchResponse = (): JiraSearchResponse => ({
	issues: [],
	startAt: 0,
	maxResults: 50,
	total: 0,
});

export const createSearchResponseWithIssues = (
	issues: JiraIssue[],
): JiraSearchResponse => ({
	issues,
	startAt: 0,
	maxResults: 50,
	total: issues.length,
});

export const createEmptyWorklogResponse = (): WorklogResponse => ({
	startAt: 0,
	maxResults: 20,
	total: 0,
	worklogs: [],
});

export const createWorklogResponseWithWorklogs = (
	worklogs: WorklogEntry[],
): WorklogResponse => ({
	startAt: 0,
	maxResults: 20,
	total: worklogs.length,
	worklogs,
});

export const getStandardTestDates = () => ({
	weekRange: WeekRange.fromDate(LocalDate.fromString('2024-10-14')), // Monday
});
