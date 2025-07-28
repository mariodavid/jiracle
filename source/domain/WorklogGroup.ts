import {Duration} from '../domain/Duration.js';
import type {FavoriteIssue, Group} from '../jira/types.js';
import type {IssueKey} from './IssueKey.js';

export type GroupId = string;

export type WorklogGroupResolvedDefaults = {
	comment: string;
	time: string;
	group?: WorklogGroup;
	source: {
		comment: 'issue' | 'group' | 'global' | 'fallback';
		time: 'issue' | 'group' | 'global' | 'fallback';
	};
};

export type CreateGroupParameters = {
	id: GroupId;
	name: string;
	defaultDuration?: Duration;
	defaultComment?: string;
	desiredAmount?: number;
	commentPrefillDays?: number;
	favoriteIssues?: readonly FavoriteIssue[];
};

export type GroupConfig = Group;

type GroupData = {
	id: GroupId;
	name: string;
	defaultDuration: Duration | undefined;
	defaultComment: string | undefined;
	desiredAmount: number | undefined;
	commentPrefillDays: number | undefined;
	favoriteIssues: readonly FavoriteIssue[];
};

export class WorklogGroup {
	static create(parameters: CreateGroupParameters): WorklogGroup {
		const groupData: GroupData = {
			id: parameters.id,
			name: parameters.name,
			defaultDuration: parameters.defaultDuration,
			defaultComment: parameters.defaultComment,
			desiredAmount: parameters.desiredAmount,
			commentPrefillDays: parameters.commentPrefillDays,
			favoriteIssues: parameters.favoriteIssues ?? [],
		};
		return new WorklogGroup(groupData);
	}

	static fromConfig(config: GroupConfig): WorklogGroup {
		const defaultDuration = config.defaultTime
			? Duration.tryParse(config.defaultTime)
			: undefined;

		const groupData: GroupData = {
			id: config.id,
			name: config.name,
			defaultDuration,
			defaultComment: config.defaultComment,
			desiredAmount: config.desiredAmount,
			commentPrefillDays: config.commentPrefillDays,
			favoriteIssues: [],
		};
		return new WorklogGroup(groupData);
	}

	private constructor(private readonly data: GroupData) {}

	resolveDefaultsFor(
		issueKey: IssueKey,
		globalDefaults?: {comment?: string; time?: string},
	): WorklogGroupResolvedDefaults {
		const favorite = this.data.favoriteIssues.find(fav =>
			fav.key.equals(issueKey),
		);

		let comment = '';
		let commentSource: 'issue' | 'group' | 'global' | 'fallback' = 'fallback';

		if (favorite?.defaultComment) {
			comment = favorite.defaultComment;
			commentSource = 'issue';
		} else if (this.data.defaultComment) {
			comment = this.data.defaultComment;
			commentSource = 'group';
		} else if (globalDefaults?.comment) {
			comment = globalDefaults.comment;
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
		} else if (this.data.defaultDuration) {
			time = this.data.defaultDuration.toString();
			timeSource = 'group';
		} else if (globalDefaults?.time) {
			time = globalDefaults.time;
			timeSource = 'global';
		} else {
			time = '1h';
			timeSource = 'fallback';
		}

		return {
			comment,
			time,
			group: this,
			source: {
				comment: commentSource,
				time: timeSource,
			},
		};
	}

	addFavoriteIssue(favorite: FavoriteIssue): WorklogGroup {
		const existingFavorites = this.data.favoriteIssues.filter(
			fav => !fav.key.equals(favorite.key),
		);
		const updatedFavoriteWithGroupId: FavoriteIssue = {
			...favorite,
			groupId: this.data.id,
		};

		const updatedGroupData: GroupData = {
			...this.data,
			favoriteIssues: [...existingFavorites, updatedFavoriteWithGroupId],
		};
		return new WorklogGroup(updatedGroupData);
	}

	removeFavoriteIssue(issueKey: IssueKey): WorklogGroup {
		const updatedFavorites = this.data.favoriteIssues.filter(
			fav => !fav.key.equals(issueKey),
		);

		const updatedGroupData: GroupData = {
			...this.data,
			favoriteIssues: updatedFavorites,
		};
		return new WorklogGroup(updatedGroupData);
	}

	meetsDesiredAmount(actualAmount: Duration): boolean {
		if (!this.data.desiredAmount) {
			return true;
		}

		const desiredDuration = Duration.fromHours(this.data.desiredAmount);
		return actualAmount.isGreaterThanOrEqual(desiredDuration);
	}

	shouldPrefillComment(daysAgo: number): boolean {
		const prefillDays = this.data.commentPrefillDays ?? 7;
		return daysAgo <= prefillDays;
	}

	getFavoriteIssues(): readonly FavoriteIssue[] {
		return this.data.favoriteIssues;
	}

	getCommentPrefillDays(): number {
		return this.data.commentPrefillDays ?? 7;
	}

	getDesiredAmount(): number | undefined {
		return this.data.desiredAmount;
	}

	getDefaultComment(): string | undefined {
		return this.data.defaultComment;
	}

	getDefaultTime(): string | undefined {
		return this.data.defaultDuration?.toString();
	}

	getId(): GroupId {
		return this.data.id;
	}

	getName(): string {
		return this.data.name;
	}

	containsIssue(issueKey: IssueKey): boolean {
		return this.data.favoriteIssues.some(fav => fav.key.equals(issueKey));
	}

	toConfig(): GroupConfig {
		return {
			id: this.data.id,
			name: this.data.name,
			defaultComment: this.data.defaultComment,
			defaultTime: this.data.defaultDuration?.toString(),
			desiredAmount: this.data.desiredAmount,
			commentPrefillDays: this.data.commentPrefillDays,
		};
	}
}
