import React from 'react';
import {useInput} from 'ink';
import {Alert} from '@inkjs/ui';
import type {Props} from './types/index.js';
import {useWorklogFlow} from './hooks/useWorklogFlow.js';
import LoadingScreen from './components/LoadingScreen.js';
import {WeeklyTimetableView} from './components/WeeklyTimetableView.js';

export default function App({config}: Props) {
	const {
		// State
		step,
		error,
		currentConfig,
		currentUser,

		// Handlers
		handleBackFromTimetable,
		startWorklogWithPrefilledData,
	} = useWorklogFlow(config);

	// ESC key handling for navigation
	useInput((_input, key) => {
		if (key.escape) {
			if (step === 'weekly-timetable') {
				handleBackFromTimetable();
			}
		}
	});

	// Handle cell worklog from timetable
	const handleCellWorklog = async (data: {issueKey: string; date: Date}) => {
		try {
			if (currentConfig) {
				// We need to import and create a JiraClient here
				const {JiraClient} = await import('./jira-client.js');
				const jiraClient = new JiraClient(currentConfig);

				// Fetch issue details
				const issue = await jiraClient.fetchIssue(data.issueKey);

				// Start worklog flow with prefilled data
				startWorklogWithPrefilledData(issue, data.date);
			}
		} catch (err) {
			console.error('Failed to fetch issue for cell worklog:', err);
			// Error handling - could potentially show an error message
			// For now, we'll just log the error since inline form is the only way
		}
	};

	if (step === 'loading') {
		return <LoadingScreen message="Loading configuration and issues..." />;
	}

	if (step === 'error') {
		return <Alert variant="error">Error: {error}</Alert>;
	}

	if (step === 'weekly-timetable' && currentConfig) {
		return (
			<WeeklyTimetableView
				onBack={handleBackFromTimetable}
				onLogWork={() => {
					// Log work is now handled inline only - this callback can be removed
					// or used for other purposes
				}}
				onCellWorklog={handleCellWorklog}
				config={currentConfig}
				userEmail={currentUser}
			/>
		);
	}

	return null;
}
