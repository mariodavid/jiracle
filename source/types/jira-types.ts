import type {AttendanceConfig} from '../attendance/types.js';

export type Group = {
	id: string;
	name: string;
	defaultComment?: string;
	defaultTime?: string;
	desiredAmount?: number;
};

export type FavoriteIssue = {
	key: string;
	alias?: string;
	defaultComment?: string;
	defaultTime?: string;
	groupId?: string;
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

// Bidirectional sliding window configuration
export type SlidingWindowConfig = {
	past: number;
	future: number;
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
	// Sliding window configuration - only bidirectional object format
	slidingWindowDays?: SlidingWindowConfig;
};

export type JiraIssueField = {
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
	key: string;
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
	comment: string;
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
