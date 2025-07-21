import {useState, useEffect} from 'react';
import {type WeeklyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';
import {WeeklyWorklogSummaryUseCase} from '../use-cases/WeeklyWorklogSummaryUseCase.js';
import {JiraClient, normalizeSlidingWindowConfig} from '../jira-client.js';
import type {JiraConfig, FavoriteIssue} from '../jira-client.js';

// Simple cache to avoid duplicate API calls
const weekDataCache = new Map<string, WeeklyWorklogSummary>();
const loadingCache = new Set<string>();

export type UseWeeklyWorklogSummaryResult = {
	data: WeeklyWorklogSummary | null;
	isLoading: boolean;
	error: string | null;
	refresh: () => void;
};

export function useWeeklyWorklogSummary(
	weekStart: Date,
	weekEnd: Date,
	config: JiraConfig,
	skipAutoLoad = false,
	userEmail?: string,
	favoriteIssues?: FavoriteIssue[],
): UseWeeklyWorklogSummaryResult {
	const [data, setData] = useState<WeeklyWorklogSummary | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		// Create cache key based on week, user, favorite issues, and sliding window
		const favoriteKeys =
			favoriteIssues
				?.map(f => f.key)
				.sort()
				.join(',') || '';
		// Support both new slidingWindowDays and legacy recentWorkdaysLookback for backward compatibility
		const normalizedWindow = normalizeSlidingWindowConfig(config);
		const cacheKey = `${weekStart.toISOString().split('T')[0]}-${
			weekEnd.toISOString().split('T')[0]
		}-${String(userEmail || 'unknown')}-${favoriteKeys}-sliding:${
			normalizedWindow.past
		}:${normalizedWindow.future}`;

		// Check if data is already cached
		if (weekDataCache.has(cacheKey)) {
			setData(weekDataCache.get(cacheKey)!);
			return;
		}

		// Check if already loading this week
		if (loadingCache.has(cacheKey)) {
			return;
		}

		setIsLoading(true);
		setError(null);
		loadingCache.add(cacheKey);

		try {
			const jiraClient = new JiraClient(config);
			const useCase = new WeeklyWorklogSummaryUseCase(jiraClient);
			const summary = await useCase.execute(
				weekStart,
				weekEnd,
				userEmail,
				favoriteIssues,
				normalizedWindow, // Pass the full bidirectional config
			);

			// Cache the result
			weekDataCache.set(cacheKey, summary);
			setData(summary);
		} catch (error_: unknown) {
			setError(error_ instanceof Error ? error_.message : 'Unknown error');
		} finally {
			setIsLoading(false);
			loadingCache.delete(cacheKey);
		}
	};

	useEffect(() => {
		if (!skipAutoLoad) {
			fetchData();
		}
	}, [weekStart, weekEnd, config, skipAutoLoad, userEmail, favoriteIssues]);

	const refresh = () => {
		// Clear cache for current week and reload
		const favoriteKeys =
			favoriteIssues
				?.map(f => f.key)
				.sort()
				.join(',') || '';
		// Support both new slidingWindowDays and legacy recentWorkdaysLookback for backward compatibility
		const normalizedWindow = normalizeSlidingWindowConfig(config);
		const cacheKey = `${weekStart.toISOString().split('T')[0]}-${
			weekEnd.toISOString().split('T')[0]
		}-${String(userEmail || 'unknown')}-${favoriteKeys}-sliding:${
			normalizedWindow.past
		}:${normalizedWindow.future}`;
		weekDataCache.delete(cacheKey);
		fetchData();
	};

	return {data, isLoading, error, refresh};
}
