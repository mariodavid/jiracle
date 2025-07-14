import React from 'react';
import {Alert} from '@inkjs/ui';
import {useApp} from 'ink';
import type {Props} from './types/index.js';
import {useConfig} from './hooks/useConfig.js';
import LoadingScreen from './components/LoadingScreen.js';
import {WeeklyTimetableView} from './components/WeeklyTimetableView.js';

export default function App({config}: Props) {
	const {exit} = useApp();
	const {step, error, config: currentConfig, userEmail} = useConfig(config);

	if (step === 'loading') {
		return <LoadingScreen message="Loading configuration and issues..." />;
	}

	if (step === 'error') {
		return <Alert variant="error">Error: {error}</Alert>;
	}

	if (step === 'weekly-timetable' && currentConfig) {
		return (
			<WeeklyTimetableView
				onBack={exit}
				onLogWork={() => {
					// Log work is now handled inline only
				}}
				onCellWorklog={async (data: {issueKey: string; date: Date}) => {
					// This function is called but the actual worklog is handled
					// by the inline form in the timetable cells
					console.log('Cell worklog requested for:', data.issueKey, data.date);
				}}
				config={currentConfig}
				userEmail={userEmail}
			/>
		);
	}

	return null;
}
