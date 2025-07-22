import {useMemo} from 'react';
import {
	IssueGroupManager,
	type IssueGroup,
} from '../services/issue-group-manager.js';
import type {JiraConfig} from '../jira-client.js';

export function useIssueGroups(
	issues: Array<[string, any]>,
	config: JiraConfig | undefined,
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
