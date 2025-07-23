import {useMemo} from 'react';
import {
	IssueGroupManager,
	type IssueGroup,
} from '../services/IssueGroupManager.js';
import type {JiraConfig} from '../jira-client.js';
import type {IssueData} from '../utils/TimetableDataUtils.js';

// Re-export the type for components
export type {IssueGroup} from '../services/IssueGroupManager.js';

export function useIssueGroups(
	issues: Array<[string, IssueData]>,
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
