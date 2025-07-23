import {useMemo} from 'react';
import {IssueGroupManager} from '../services/IssueGroupManager.js';
import type {JiraConfig} from '../jira-client.js';

// Re-export the type for components to use
export type {IssueGroup} from '../services/IssueGroupManager.js';

/**
 * Hook that provides issue grouping functionality
 * Wraps IssueGroupManager for use in React components
 */
export function useIssueGroupManager(config: JiraConfig | undefined) {
	const manager = useMemo(() => new IssueGroupManager(config), [config]);

	const groupIssuesByResolvedGroup = (issues: Array<[string, any]>) => {
		return manager.groupIssuesByResolvedGroup(issues);
	};

	return {
		groupIssuesByResolvedGroup,
	};
}
