import {
	WorklogGroup,
	type WorklogGroupResolvedDefaults,
} from '../domain/WorklogGroup.js';
import type {IssueKey} from '../domain/IssueKey.js';
import {extractProjectKey} from '../jira/utils.js';
import type {JiraConfig, FavoriteIssue} from '../jira/types.js';

export class WorklogGroupService {
	private readonly groups = new Map<string, WorklogGroup>();

	constructor(private readonly config: JiraConfig) {
		this.initializeGroups();
	}

	resolveDefaultsFor(issueKey: IssueKey): WorklogGroupResolvedDefaults {
		const favorites = this.config.favorites ?? [];
		const projects = this.config.projects ?? [];

		const projectKey = extractProjectKey(issueKey);
		const favorite = favorites.find(fav => fav.key.equals(issueKey));
		const projectDefaults = projectKey
			? projects.find(proj => proj.key === projectKey)
			: undefined;

		// Determine which group to use (issue-level group takes priority over project-level)
		let group: WorklogGroup | undefined;
		if (favorite?.groupId) {
			group = this.groups.get(favorite.groupId);
		} else if (projectDefaults?.groupId) {
			group = this.groups.get(projectDefaults.groupId);
		}

		if (group) {
			const globalDefaults = {
				comment: this.config.defaultComment,
				time: this.config.defaultTime,
			};
			return group.resolveDefaultsFor(issueKey, globalDefaults);
		}

		// Fall back to non-group resolution
		return this.resolveDefaultsWithoutGroup(issueKey, favorite);
	}

	getGroupForIssue(issueKey: IssueKey): WorklogGroup | undefined {
		const favorites = this.config.favorites ?? [];
		const projects = this.config.projects ?? [];

		const projectKey = extractProjectKey(issueKey);
		const favorite = favorites.find(fav => fav.key.equals(issueKey));
		const projectDefaults = projectKey
			? projects.find(proj => proj.key === projectKey)
			: undefined;

		// Issue-level group takes priority over project-level
		if (favorite?.groupId) {
			return this.groups.get(favorite.groupId);
		}

		if (projectDefaults?.groupId) {
			return this.groups.get(projectDefaults.groupId);
		}

		return undefined;
	}

	getAllGroups(): readonly WorklogGroup[] {
		return [...this.groups.values()];
	}

	getGroupById(groupId: string): WorklogGroup | undefined {
		return this.groups.get(groupId);
	}

	updateGroup(group: WorklogGroup): void {
		this.groups.set(group.getId(), group);
	}

	addFavoriteToGroup(groupId: string, favorite: FavoriteIssue): boolean {
		const group = this.groups.get(groupId);
		if (!group) {
			return false;
		}

		const updatedGroup = group.addFavoriteIssue(favorite);
		this.groups.set(groupId, updatedGroup);
		return true;
	}

	removeFavoriteFromGroup(groupId: string, issueKey: IssueKey): boolean {
		const group = this.groups.get(groupId);
		if (!group) {
			return false;
		}

		const updatedGroup = group.removeFavoriteIssue(issueKey);
		this.groups.set(groupId, updatedGroup);
		return true;
	}

	resolveCommentPrefillDaysFor(issueKey: IssueKey): number {
		const group = this.getGroupForIssue(issueKey);
		if (group) {
			return group.getCommentPrefillDays();
		}

		const favorites = this.config.favorites ?? [];
		const favorite = favorites.find(fav => fav.key.equals(issueKey));

		if (favorite?.commentPrefillDays !== undefined) {
			return favorite.commentPrefillDays;
		}

		if (this.config.commentPrefillDays !== undefined) {
			return this.config.commentPrefillDays;
		}

		return 7; // Default fallback
	}

	private initializeGroups(): void {
		const configGroups = this.config.groups ?? [];
		const favorites = this.config.favorites ?? [];
		const projects = this.config.projects ?? [];

		// Create WorklogGroup entities from configuration
		for (const groupConfig of configGroups) {
			// Find favorites directly assigned to this group
			const directGroupFavorites = favorites.filter(
				favorite => favorite.groupId === groupConfig.id,
			);

			// Find favorites assigned to this group via project mapping
			const projectGroupFavorites = favorites.filter(favorite => {
				if (favorite.groupId) return false; // Skip if already directly assigned
				const projectKey = extractProjectKey(favorite.key);
				if (!projectKey) return false;
				const project = projects.find(p => p.key === projectKey);
				return project?.groupId === groupConfig.id;
			});

			const allGroupFavorites = [
				...directGroupFavorites,
				...projectGroupFavorites,
			];
			const group = WorklogGroup.fromConfig(groupConfig);

			// Add favorites to the group
			let updatedGroup = group;
			for (const favorite of allGroupFavorites) {
				updatedGroup = updatedGroup.addFavoriteIssue(favorite);
			}

			this.groups.set(groupConfig.id, updatedGroup);
		}
	}

	private resolveDefaultsWithoutGroup(
		_issueKey: IssueKey,
		favorite?: FavoriteIssue,
	): WorklogGroupResolvedDefaults {
		let comment = '';
		let commentSource: 'issue' | 'group' | 'global' | 'fallback' = 'fallback';

		if (favorite?.defaultComment) {
			comment = favorite.defaultComment;
			commentSource = 'issue';
		} else if (this.config.defaultComment) {
			comment = this.config.defaultComment;
			commentSource = 'global';
		} else {
			comment = '';
			commentSource = 'fallback';
		}

		let time = '1h';
		let timeSource: 'issue' | 'group' | 'global' | 'fallback' = 'fallback';

		if (favorite?.defaultTime) {
			time = favorite.defaultTime;
			timeSource = 'issue';
		} else if (this.config.defaultTime) {
			time = this.config.defaultTime;
			timeSource = 'global';
		} else {
			time = '1h';
			timeSource = 'fallback';
		}

		return {
			comment,
			time,
			group: undefined,
			source: {
				comment: commentSource,
				time: timeSource,
			},
		};
	}
}
