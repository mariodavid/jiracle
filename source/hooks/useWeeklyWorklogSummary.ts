import {useState, useEffect} from 'react';
import {WeeklyWorklogSummary} from '../domain/WeeklyWorklogSummary.js';
import {WeeklyWorklogSummaryUseCase} from '../use-cases/WeeklyWorklogSummaryUseCase.js';
import {JiraClient} from '../jira-client.js';
import type {JiraConfig} from '../jira-client.js';

// Simple cache to avoid duplicate API calls
const weekDataCache = new Map<string, WeeklyWorklogSummary>();
const loadingCache = new Set<string>();

export interface UseWeeklyWorklogSummaryResult {
	data: WeeklyWorklogSummary | null;
	isLoading: boolean;
	error: string | null;
	refresh: () => void;
}

export function useWeeklyWorklogSummary(
	weekStart: Date,
	weekEnd: Date,
	config: JiraConfig,
	skipAutoLoad: boolean = false,
	userEmail?: string,
): UseWeeklyWorklogSummaryResult {
	const [data, setData] = useState<WeeklyWorklogSummary | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		// Create cache key based on week and user
		const cacheKey = `${weekStart.toISOString().split('T')[0]}-${
			weekEnd.toISOString().split('T')[0]
		}-${userEmail || 'unknown'}`;

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
			const summary = await useCase.execute(weekStart, weekEnd, userEmail);

			// Cache the result
			weekDataCache.set(cacheKey, summary);
			setData(summary);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error');
		} finally {
			setIsLoading(false);
			loadingCache.delete(cacheKey);
		}
	};

	useEffect(() => {
		if (!skipAutoLoad) {
			fetchData();
		}
	}, [weekStart, weekEnd, config, skipAutoLoad, userEmail]);

	const refresh = () => {
		// Clear cache for current week and reload
		const cacheKey = `${weekStart.toISOString().split('T')[0]}-${
			weekEnd.toISOString().split('T')[0]
		}-${userEmail || 'unknown'}`;
		weekDataCache.delete(cacheKey);
		fetchData();
	};

	return {data, isLoading, error, refresh};
}
