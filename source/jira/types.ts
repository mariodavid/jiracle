import type {AttendanceConfig} from '../attendance/types.js';
import type {IssueKey} from '../domain/IssueKey.js';

export type Group = {
	id: string;
	name: string;
	defaultComment?: string;
	defaultTime?: string;
	desiredAmount?: number;
	commentPrefillDays?: number;
};

export type FavoriteIssue = {
	key: IssueKey;
	alias?: string;
	defaultComment?: string;
	defaultTime?: string;
	groupId?: string;
	commentPrefillDays?: number;
};

export type ProjectDefaults = {
	key: string;
	groupId?: string;
};

export type ReminderConfig = {
	enabled: boolean;
	times: string[];
	weekdaysOnly: boolean;
};

export type SlidingWindowConfig = {
	past: number;
	future: number;
};

export type BonusTier = {
	name: string;
	startDay: number;
	endDay: number | undefined;
	rate: number;
};

export type BonusConfig = {
	enabled: boolean;
	hoursPerBonusDay: number;
	targetDays: number;
	targets: {
		minimum: number;
		standard: number;
		stretch: number;
	};
	tiers?: BonusTier[];
	billableCustomField?: string;
	billableValues?: string[];
};

export type JiraConfig = {
	jiraUrl: string;
	username: string;
	apiToken: string;
	favorites?: FavoriteIssue[];
	projects?: ProjectDefaults[];
	groups?: Group[];
	defaultComment?: string;
	defaultTime?: string;
	workingHoursPerWeek?: number;
	reminders?: ReminderConfig;
	attendance?: AttendanceConfig;
	slidingWindowDays?: SlidingWindowConfig;
	commentPrefillDays?: number;
	bonus?: BonusConfig;
};

export type JiraIssueField = {
	[customFieldKey: `customfield_${string}`]: any;
	summary: string;
	status: {
		name: string;
		statusCategory: {
			name: string;
		};
	};
	issuetype: {
		name: string;
		iconUrl: string;
	};
	priority: {
		name: string;
		iconUrl: string;
	};
	assignee: {
		displayName: string;
		emailAddress: string;
	};
	created: string;
	updated: string;
};

export type JiraIssue = {
	id: string;
	key: IssueKey;
	fields: JiraIssueField;
};

export type JiraSearchResponse = {
	issues: JiraIssue[];
	startAt: number;
	maxResults: number;
	total: number;
};

export type WorklogRequest = {
	timeSpent: string;
	comment: string;
	started: string;
};

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
	started: string;
	timeSpentSeconds: number;
};

export type ResolvedDefaults = {
	comment: string;
	time: string;
	group?: Group;
	source: {
		comment: 'issue' | 'group' | 'global' | 'fallback';
		time: 'issue' | 'group' | 'global' | 'fallback';
	};
};

// Request types for better type safety
export type JiraSearchRequest = {
	jql: string;
	maxResults: number;
	fields: string[];
};

export type JiraSearchRawResponse = {
	issues: Array<{
		key: string;
		id: string;
		fields: JiraIssueField;
	}>;
	startAt: number;
	maxResults: number;
	total: number;
};

export type JiraIssueRawResponse = {
	key: string;
	id: string;
	fields: JiraIssueField;
};
