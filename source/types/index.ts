import type {JiraConfig} from '../jira-client.js';

export type Props = {
	config?: JiraConfig;
};

export type Step =
	| 'loading'
	| 'error'
	| 'weekly-timetable'
	| 'delete-confirmation'
	| 'deleting';
