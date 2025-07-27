import type {JiraConfig, Group} from '../jira-client.js';
import {resolveDefaults} from '../jira-client.js';
import {IssueKey} from '../domain/IssueKey.js';
import type {IssueData} from '../utils/TimetableDataUtils.js';

export type IssueGroup = {
	group: Group | undefined;
	issues: Array<[string, IssueData]>;
	totalHours: number;
};

export class IssueGroupManager {
	constructor(private readonly config: JiraConfig | undefined) {}

	groupIssuesByResolvedGroup(issues: Array<[string, IssueData]>): IssueGroup[] {
		if (!this.config) {
			return [
				{
					group: undefined,
					issues: this.sortIssuesByKey(issues),
					totalHours: issues.reduce(
						(sum: number, [, issueData]: [string, IssueData]): number =>
							sum + issueData.weekTotal,
						0,
					),
				},
			];
		}

		const groupMap = new Map<string, IssueGroup>();
		const ungroupedIssues: Array<[string, IssueData]> = [];

		for (const [issueKey, issueData] of issues) {
			const issueKeyObject = IssueKey.fromString(issueKey);
			const resolved = resolveDefaults(this.config, issueKeyObject);
			const {group} = resolved;

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
				group: undefined,
				issues: this.sortIssuesByKey(ungroupedIssues),
				totalHours: ungroupedIssues.reduce(
					(sum: number, [, issueData]: [string, IssueData]): number =>
						sum + issueData.weekTotal,
					0,
				),
			});
		}

		return groups;
	}

	private sortIssuesByKey(
		issues: Array<[string, IssueData]>,
	): Array<[string, IssueData]> {
		return issues.sort(([aKey], [bKey]) => {
			const aParts = aKey.split('-');
			const bParts = bKey.split('-');

			const aProject = aParts[0] ?? '';
			const bProject = bParts[0] ?? '';
			const aNumber = aParts[1] ?? '0';
			const bNumber = bParts[1] ?? '0';

			if (aProject !== bProject) {
				return aProject.localeCompare(bProject);
			}

			return Number.parseInt(aNumber, 10) - Number.parseInt(bNumber, 10);
		});
	}
}
