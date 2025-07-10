import type {JiraConfig} from '../jira-client.js';

export type Props = {
	config?: JiraConfig;
};

export type Step =
	| 'loading'
	| 'main-menu'
	| 'issue-selection-mode'
	| 'issue-selection'
	| 'manual-issue-input'
	| 'time-selection'
	| 'custom-time-input'
	| 'comment-input'
	| 'date-selection'
	| 'submitting'
	| 'success'
	| 'error'
	| 'weekly-timetable';

export type IssueSelectionMode = 'favorites' | 'assigned' | 'other' | null;

export type SelectOption = {
	label: string;
	value: string;
};
