import process from 'node:process';
import type {
	JiraConfig,
	SlidingWindowConfig,
	ResolvedDefaults,
	Group,
} from '../types/jira-types.js';

// Utility function to normalize sliding window configuration
export function normalizeSlidingWindowConfig(
	config: JiraConfig,
): SlidingWindowConfig {
	const slidingWindow = config.slidingWindowDays;

	if (!slidingWindow) {
		return {past: 0, future: 0};
	}

	// Only object format supported
	return {
		past: slidingWindow.past,
		future: slidingWindow.future,
	};
}

export function loadConfigWithEnvVars(config: JiraConfig): JiraConfig {
	return {
		...config,
		jiraUrl: process.env['JIRACLE_JIRA_URL'] || config.jiraUrl,
		username: process.env['JIRACLE_USERNAME'] || config.username,
		apiToken: process.env['JIRACLE_API_TOKEN'] || config.apiToken,
	};
}

export function extractProjectKey(issueKey: string): string | undefined {
	// Extract project key from issue key (e.g., "DEF-2457" → "DEF")
	const match = /^([A-Z]+)-\d+$/.exec(issueKey);
	return match ? match[1] ?? undefined : undefined;
}

export function resolveDefaults(
	config: JiraConfig,
	issueKey: string,
): ResolvedDefaults {
	const favorites = config.favorites || [];
	const projects = config.projects || [];
	const groups = config.groups || [];

	// Extract project key from issue key
	const projectKey = extractProjectKey(issueKey);

	// Find issue-specific defaults
	const favorite = favorites.find(fav => fav.key === issueKey);

	// Find project for group lookup
	const projectDefaults = projectKey
		? projects.find(proj => proj.key === projectKey)
		: undefined;

	// Find group defaults (priority: issue group > project group)
	let group: Group | undefined;
	if (favorite?.groupId) {
		group = groups.find(g => g.id === favorite.groupId);
	} else if (projectDefaults?.groupId) {
		group = groups.find(g => g.id === projectDefaults.groupId);
	}

	// Resolve comment with priority: issue → group → global → fallback
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

	// Resolve time with priority: issue → group → global → fallback
	let time = '1h'; // Fallback
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
		time = '1h';
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
