import React from 'react';
import {useInput} from 'ink';
import {Alert} from '@inkjs/ui';
import type {Props} from './types/index.js';
import {useWorklogFlow} from './hooks/useWorklogFlow.js';
import LoadingScreen from './components/LoadingScreen.js';
import MainMenu from './components/MainMenu.js';
import IssueSelectionModeComponent from './components/IssueSelectionMode.js';
import IssueList from './components/IssueList.js';
import ManualIssueInput from './components/ManualIssueInput.js';
import TimeSelection from './components/WorklogForm/TimeSelection.js';
import CustomTimeInput from './components/WorklogForm/CustomTimeInput.js';
import CommentInput from './components/WorklogForm/CommentInput.js';
import DateSelection from './components/WorklogForm/DateSelection.js';
import WorklogSummary from './components/WorklogSummary.js';

export default function App({config}: Props) {
	const {
		// State
		favoriteIssues,
		assignedIssues,
		step,
		error,
		selectedIssue,
		selectedTime,
		comment,
		selectedDate,
		issueSelectionMode,
		manualIssueKey,
		inputError,

		// State setters
		setSelectedTime,
		setComment,
		setManualIssueKey,
		setInputError,

		// Handlers
		handleIssueSelect,
		handleTimeSelect,
		handleBackToIssueSelection,
		handleBackToTimeSelection,
		handleBackToCommentInput,
		handleBackToMainMenu,
		handleBackToIssueSelectionMode,
		handleMainMenuSelect,
		handleIssueSelectionModeSelect,
		handleManualIssueSubmit,
		handleCustomTimeSubmit,
		handleCommentSubmit,
		handleDateSelect,
	} = useWorklogFlow(config);

	// ESC key handling for navigation
	useInput((_, key) => {
		if (key.escape) {
			if (step === 'issue-selection-mode') {
				handleBackToMainMenu();
			} else if (step === 'issue-selection') {
				handleBackToIssueSelectionMode();
			} else if (step === 'manual-issue-input') {
				handleBackToIssueSelectionMode();
			} else if (step === 'time-selection') {
				if (issueSelectionMode === 'other') {
					handleBackToIssueSelectionMode();
				} else {
					handleBackToIssueSelection();
				}
			} else if (step === 'custom-time-input') {
				handleBackToTimeSelection();
			} else if (step === 'comment-input') {
				handleBackToTimeSelection();
			} else if (step === 'date-selection') {
				handleBackToCommentInput();
			}
		}
	});

	if (step === 'loading') {
		return <LoadingScreen message="Loading configuration and issues..." />;
	}

	if (step === 'error') {
		return <Alert variant="error">Error: {error}</Alert>;
	}

	if (step === 'main-menu') {
		return <MainMenu onSelect={handleMainMenuSelect} />;
	}

	if (step === 'issue-selection-mode') {
		return (
			<IssueSelectionModeComponent onSelect={handleIssueSelectionModeSelect} />
		);
	}

	if (step === 'manual-issue-input') {
		return (
			<ManualIssueInput
				value={manualIssueKey}
				error={inputError}
				onChange={value => {
					setManualIssueKey(value);
					if (inputError) {
						setInputError(''); // Clear error when user starts typing
					}
				}}
				onSubmit={value => {
					setManualIssueKey(value);
					handleManualIssueSubmit();
				}}
			/>
		);
	}

	if (step === 'issue-selection') {
		const modeTitle =
			issueSelectionMode === 'favorites'
				? 'Favorite Issues'
				: 'Assigned Issues';
		const currentIssues =
			issueSelectionMode === 'favorites' ? favoriteIssues : assignedIssues;

		return (
			<IssueList
				issues={currentIssues}
				title={modeTitle}
				onSelect={handleIssueSelect}
			/>
		);
	}

	if (step === 'time-selection' && selectedIssue) {
		return (
			<TimeSelection
				selectedIssue={selectedIssue}
				onSelect={handleTimeSelect}
			/>
		);
	}

	if (step === 'custom-time-input' && selectedIssue) {
		return (
			<CustomTimeInput
				selectedIssue={selectedIssue}
				value={selectedTime}
				onChange={setSelectedTime}
				onSubmit={value => {
					setSelectedTime(value);
					handleCustomTimeSubmit();
				}}
			/>
		);
	}

	if (step === 'comment-input' && selectedIssue) {
		return (
			<CommentInput
				selectedIssue={selectedIssue}
				selectedTime={selectedTime}
				value={comment}
				onChange={setComment}
				onSubmit={value => {
					setComment(value);
					handleCommentSubmit();
				}}
			/>
		);
	}

	if (step === 'date-selection' && selectedIssue) {
		return (
			<DateSelection
				selectedIssue={selectedIssue}
				selectedTime={selectedTime}
				comment={comment}
				onSelect={handleDateSelect}
			/>
		);
	}

	if (step === 'submitting') {
		return <WorklogSummary variant="submitting" />;
	}

	if (step === 'success') {
		return (
			<WorklogSummary
				variant="success"
				selectedIssue={selectedIssue}
				selectedTime={selectedTime}
				comment={comment}
				selectedDate={selectedDate}
			/>
		);
	}

	return null;
}
