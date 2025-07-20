import type {JiraConfig, Group} from '../jira-client.js';
import {resolveDefaults} from '../jira-client.js';

export interface IssueGroup {
	group: Group | null;
	issues: Array<[string, any]>;
	totalHours: number;
}

export class IssueGroupManager {
	constructor(private config: JiraConfig | null) {}

	groupIssuesByResolvedGroup(issues: Array<[string, any]>): IssueGroup[] {
		if (!this.config) {
			return [
				{
					group: null,
					issues: this.sortIssuesByKey(issues) as Array<[string, any]>,
					totalHours: issues.reduce(
						(sum: number, [, issueData]: [string, any]): number =>
							sum + (issueData.weekTotal as number),
						0,
					),
				},
			];
		}

		const groupMap = new Map<string, IssueGroup>();
		const ungroupedIssues: Array<[string, any]> = [];

		for (const [issueKey, issueData] of issues) {
			const resolved = resolveDefaults(this.config, issueKey);
			const group = resolved.group;

			if (group) {
				const groupId = group.id;
				if (!groupMap.has(groupId)) {
					groupMap.set(groupId, {
						group,
						issues: [],
						totalHours: 0,
					});
				}
				groupMap.get(groupId)!.issues.push([issueKey, issueData]);
				groupMap.get(groupId)!.totalHours += issueData.weekTotal;
			} else {
				ungroupedIssues.push([issueKey, issueData]);
			}
		}

		const groups = [...groupMap.values()];

		for (const group of groups) {
			group.issues = this.sortIssuesByKey(group.issues);
		}

		groups.sort((a, b) => {
			if (!a.group || !b.group) return 0;
			return a.group.name.localeCompare(b.group.name);
		});

		if (ungroupedIssues.length > 0) {
			groups.push({
				group: null,
				issues: this.sortIssuesByKey(ungroupedIssues) as Array<[string, any]>,
				totalHours: ungroupedIssues.reduce(
					(sum: number, [, issueData]: [string, any]): number =>
						sum + (issueData.weekTotal as number),
					0,
				),
			});
		}

		return groups;
	}

	private sortIssuesByKey(issues: Array<[string, any]>): Array<[string, any]> {
		return issues.sort(([aKey], [bKey]) => {
			const aParts = aKey.split('-');
			const bParts = bKey.split('-');

			const aProject = aParts[0] || '';
			const bProject = bParts[0] || '';
			const aNumber = aParts[1] || '0';
			const bNumber = bParts[1] || '0';

			if (aProject !== bProject) {
				return aProject.localeCompare(bProject);
			}

			return Number.parseInt(aNumber, 10) - Number.parseInt(bNumber, 10);
		});
	}
}
