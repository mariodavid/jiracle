import {useMemo} from 'react';
import {
	IssueGroupManager,
	type IssueGroup,
} from '../services/IssueGroupManager.js';
import type {JiraConfig} from '../jira-client.js';

export function useIssueGroups(
	issues: Array<[string, any]>,
	config: JiraConfig | null,
): IssueGroup[] {
	const issueGroupManager = useMemo(
		() => new IssueGroupManager(config),
		[config],
	);

	return useMemo(
		() => issueGroupManager.groupIssuesByResolvedGroup(issues),
		[issueGroupManager, issues],
	);
}
