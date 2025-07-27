import process from 'node:process';
import {Duration} from '../domain/Duration.js';
import {LocalDate} from '../domain/LocalDate.js';
import type {
	JiraConfig,
	FavoriteIssue,
	Group,
	ResolvedDefaults,
	SlidingWindowConfig,
	WorklogEntry,
} from './types.js';

// Default duration fallbacks
const DEFAULT_TIME_FALLBACK = new Duration('1h');

export function normalizeSlidingWindowConfig(
	config: JiraConfig,
): SlidingWindowConfig {
	const slidingWindow = config.slidingWindowDays;

	if (!slidingWindow) {
		return {past: 7, future: 0};
	}

	return {
		past: slidingWindow.past,
		future: slidingWindow.future,
	};
}

export function normalizeTimeFormat(timeString: string): string {
	try {
		const decimalHourMatch = /^(\d+(?:,\d+)?)h$/i.exec(timeString);
		if (decimalHourMatch) {
			return decimalHourMatch[1]!.replace(',', '.') + 'h';
		}

		const duration = new Duration(timeString);
		const minutes = duration.toMinutes();

		if (minutes <= 0) {
			return '';
		}

		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;

		if (hours > 0 && remainingMinutes > 0) {
			return `${hours}h ${remainingMinutes}m`;
		}

		if (hours > 0) {
			return `${hours}h`;
		}

		return `${remainingMinutes}m`;
	} catch {
		return '';
	}
}

export function getFavoriteKeys(favorites: FavoriteIssue[]): string[] {
	return favorites.map(fav => fav.key);
}

export function getFavoriteDefaultComment(
	favorites: FavoriteIssue[],
	issueKey: string,
): string | undefined {
	const favorite = favorites.find(fav => fav.key === issueKey);
	return favorite?.defaultComment;
}

export function getFavoriteDefaultTime(
	favorites: FavoriteIssue[],
	issueKey: string,
): string | undefined {
	const favorite = favorites.find(fav => fav.key === issueKey);
	return favorite?.defaultTime;
}

export function extractProjectKey(issueKey: string): string | undefined {
	const match = /^([A-Z]+)-\d+$/.exec(issueKey);
	return match ? match[1] : undefined;
}

export function loadConfigWithEnvVars(config: JiraConfig): JiraConfig {
	return {
		...config,
		jiraUrl: process.env['JIRACLE_JIRA_URL'] ?? config.jiraUrl,
		username: process.env['JIRACLE_USERNAME'] ?? config.username,
		apiToken: process.env['JIRACLE_API_TOKEN'] ?? config.apiToken,
	};
}

export function resolveDefaults(
	config: JiraConfig,
	issueKey: string,
): ResolvedDefaults {
	const favorites = config.favorites ?? [];
	const projects = config.projects ?? [];
	const groups = config.groups ?? [];

	const projectKey = extractProjectKey(issueKey);
	const favorite = favorites.find(fav => fav.key === issueKey);
	const projectDefaults = projectKey
		? projects.find(proj => proj.key === projectKey)
		: undefined;

	let group: Group | undefined;
	if (favorite?.groupId) {
		group = groups.find(g => g.id === favorite.groupId);
	} else if (projectDefaults?.groupId) {
		group = groups.find(g => g.id === projectDefaults.groupId);
	}

	let comment = '';
	let commentSource: 'issue' | 'group' | 'global' | 'fallback' = 'fallback';

	if (favorite?.defaultComment) {
		comment = favorite.defaultComment;
		commentSource = 'issue';
	} else if (group?.defaultComment) {
		comment = group.defaultComment;
		commentSource = 'group';
	} else if (config.defaultComment) {
		comment = config.defaultComment;
		commentSource = 'global';
	} else {
		comment = '';
		commentSource = 'fallback';
	}

	let time = DEFAULT_TIME_FALLBACK.toString();
	let timeSource: 'issue' | 'group' | 'global' | 'fallback' = 'fallback';

	if (favorite?.defaultTime) {
		time = favorite.defaultTime;
		timeSource = 'issue';
	} else if (group?.defaultTime) {
		time = group.defaultTime;
		timeSource = 'group';
	} else if (config.defaultTime) {
		time = config.defaultTime;
		timeSource = 'global';
	} else {
		time = DEFAULT_TIME_FALLBACK.toString();
		timeSource = 'fallback';
	}

	return {
		comment,
		time,
		group,
		source: {
			comment: commentSource,
			time: timeSource,
		},
	};
}

export function extractIssueKeyFromInput(input: string): string | undefined {
	const trimmed = input.trim();

	if (!trimmed) {
		return undefined;
	}

	if (trimmed.includes('/browse/')) {
		const match = /\/browse\/([A-Z]+-\d+)/.exec(trimmed);
		if (match?.[1]) {
			return match[1];
		}

		return undefined;
	}

	const issueKeyMatch = /^([A-Z]+-\d+)$/.exec(trimmed);
	if (issueKeyMatch?.[1]) {
		return issueKeyMatch[1];
	}

	return undefined;
}

export function getMostRecentCommentForIssue(
	worklogs: WorklogEntry[],
	daysBack = 7,
	referenceDate: LocalDate = LocalDate.today(),
): string | undefined {
	// Create cutoff date by subtracting days from reference date
	const referenceDateAsDate = new Date(
		referenceDate.toISOString() + 'T00:00:00.000Z',
	);
	referenceDateAsDate.setDate(referenceDateAsDate.getDate() - daysBack);
	const cutoffDate = referenceDateAsDate;

	const relevantWorklogs = worklogs
		.filter(worklog => {
			const worklogDate = new Date(worklog.started);
			return worklogDate >= cutoffDate && Boolean(worklog.comment?.trim());
		})
		.sort(
			(a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
		);

	const mostRecent = relevantWorklogs[0];
	return mostRecent?.comment?.trim();
}

export function resolveCommentPrefillDays(
	config: JiraConfig,
	issueKey: string,
): number {
	const favorites = config.favorites ?? [];
	const projects = config.projects ?? [];
	const groups = config.groups ?? [];

	const projectKey = extractProjectKey(issueKey);
	const favorite = favorites.find(fav => fav.key === issueKey);
	const projectDefaults = projectKey
		? projects.find(proj => proj.key === projectKey)
		: undefined;

	let group: Group | undefined;
	if (favorite?.groupId) {
		group = groups.find(g => g.id === favorite.groupId);
	} else if (projectDefaults?.groupId) {
		group = groups.find(g => g.id === projectDefaults.groupId);
	}

	// Priority: Issue > Group > Global > Default (7 days)
	if (favorite?.commentPrefillDays !== undefined) {
		return favorite.commentPrefillDays;
	}

	if (group?.commentPrefillDays !== undefined) {
		return group.commentPrefillDays;
	}

	if (config.commentPrefillDays !== undefined) {
		return config.commentPrefillDays;
	}

	return 7; // Default fallback
}

export function getCommentWithPrefill(
	config: JiraConfig,
	issueKey: string,
	recentWorklogs: WorklogEntry[],
	options: {
		isEditMode: boolean;
		explicitDefault?: string;
		referenceDate: LocalDate;
	},
): string {
	// If explicit default comment is provided AND we're in edit mode, use it
	if (options.explicitDefault && options.isEditMode) {
		return options.explicitDefault;
	}

	// Try to find most recent comment for this issue using configured lookback days
	const lookbackDays = resolveCommentPrefillDays(config, issueKey);
	const cutoffDate = new Date(
		options.referenceDate.toISOString() + 'T00:00:00.000Z',
	);
	cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

	const recentComment = getMostRecentCommentForIssue(
		recentWorklogs,
		lookbackDays,
		options.referenceDate,
	);

	if (recentComment) {
		return recentComment;
	}

	// Fall back to config-based defaults
	const defaults = resolveDefaults(config, issueKey);
	return defaults.comment;
}
