import React, {useState, useEffect, useCallback, useRef} from 'react';
import {Box, Text, useInput} from 'ink';
import {TextInput, Spinner} from '@inkjs/ui';
import DurationInput from './WorklogForm/DurationInput.js';
import type {JiraConfig} from '../jira-client.js';
import {resolveDefaults} from '../jira-client.js';
import {uiLogger} from '../utils/logger.js';
import {useFormNavigation} from '../hooks/useFormNavigation.js';

interface InlineWorklogFormProps {
	issueKey: string;
	date: Date;
	defaultTimeSpent?: string;
	defaultComment?: string;
	onSubmit: (data: {
		issueKey: string;
		timeSpent: string;
		comment: string;
		date: Date;
	}) => void;
	onCancel: () => void;
	isSubmitting?: boolean;
	error?: string | null;
	config?: JiraConfig;
	isFavorite?: boolean;
	isIssueKeyEditable?: boolean;
}

type FocusArea = 'issueKey' | 'date' | 'time' | 'comment' | 'submit' | 'cancel';

export function InlineWorklogForm({
	issueKey,
	date,
	defaultTimeSpent,
	defaultComment = '',
	onSubmit,
	onCancel,
	isSubmitting = false,
	error = null,
	config,
	isFavorite = false,
	isIssueKeyEditable = false,
}: InlineWorklogFormProps) {
	// Determine default time based on configuration
	const getDefaultTime = () => {
		if (defaultTimeSpent) return defaultTimeSpent;

		// Use the new hierarchical default resolution
		if (config) {
			const defaults = resolveDefaults(config, issueKey);
			return defaults.time;
		}

		// Fallback to 1h
		return '1h';
	};

	const [currentIssueKey, setCurrentIssueKey] = useState(issueKey);
	const [currentDate, setCurrentDate] = useState(date);
	const [dateInputValue, setDateInputValue] = useState(
		date.toISOString().split('T')[0], // YYYY-MM-DD format
	);
	const [selectedTime, setSelectedTime] = useState(() => {
		return getDefaultTime();
	});
	const [timeInputValue, setTimeInputValue] = useState(() => {
		return getDefaultTime();
	});
	const [comment, setComment] = useState(defaultComment);
	const submittingRef = useRef(false);

	const handleSubmit = useCallback(() => {
		uiLogger.debug('InlineWorklogForm: handleSubmit called', {
			isSubmitting,
			submittingRef: submittingRef.current,
			selectedTime,
			comment,
			timestamp: new Date().toISOString(),
		});

		// Immediate synchronous check with ref
		if (isSubmitting || submittingRef.current) {
			uiLogger.debug('InlineWorklogForm: Blocked duplicate submission');
			return; // Don't submit if already submitting
		}

		// Set ref immediately (synchronous)
		submittingRef.current = true;
		const timeSpent = selectedTime;
		onSubmit({
			issueKey: currentIssueKey,
			timeSpent,
			comment,
			date: currentDate,
		});
	}, [
		isSubmitting,
		selectedTime,
		comment,
		currentIssueKey,
		currentDate,
		onSubmit,
	]);

	const getFocusAreas = (): FocusArea[] => {
		if (isIssueKeyEditable) {
			return ['issueKey', 'date', 'time', 'comment', 'submit', 'cancel'];
		}
		return ['time', 'comment', 'submit', 'cancel'];
	};

	const getInitialFocus = (): FocusArea => {
		return isIssueKeyEditable ? 'issueKey' : 'time';
	};

	const formNavigation = useFormNavigation({
		focusAreas: getFocusAreas() as any,
		initialFocus: getInitialFocus(),
		globalHandlers: {
			onEscape: onCancel,
			onCtrlEnter: handleSubmit,
		},
		handlers: {
			issueKey: {
				onEnter: () => void 0,
			},
			date: {
				onEnter: () => void 0,
			},
			time: {
				onEnter: () => void 0,
				onTab: () => {
					normalizeTimeOnBlur(timeInputValue);
				},
				onShiftTab: () => {
					normalizeTimeOnBlur(timeInputValue);
				},
			},
			comment: {
				onEnter: handleSubmit,
			},
			submit: {
				onEnter: handleSubmit,
			},
			cancel: {
				onEnter: onCancel,
			},
		},
	});

	const {currentFocus: focusArea, navigateToArea} = formNavigation;

	// Reset submitting ref when parent submission completes
	useEffect(() => {
		if (!isSubmitting) {
			submittingRef.current = false;
		}
	}, [isSubmitting]);

	const handleTimeInputChange = (value: string) => {
		setTimeInputValue(value);
		setSelectedTime(value);
	};

	const normalizeTimeOnBlur = (inputValue: string) => {
		// If user just entered numbers, add 'h' automatically
		if (/^\d+([.,]\d+)?$/.test(inputValue)) {
			const normalizedValue = inputValue + 'h';
			setTimeInputValue(normalizedValue);
			setSelectedTime(normalizedValue);
			return normalizedValue;
		}
		return inputValue;
	};

	// Simple date input component using useInput
	const SimpleDateInput = ({
		value,
		onChange,
		onSubmit,
		isActive,
	}: {
		value: string;
		onChange: (value: string) => void;
		onSubmit: () => void;
		isActive: boolean;
	}) => {
		const [inputValue, setInputValue] = useState(value);

		useInput(
			(input, key) => {
				if (!isActive) return;

				if (key.return) {
					onChange(inputValue);
					onSubmit();
					return;
				}

				if (key.backspace || key.delete) {
					if (inputValue.length > 0) {
						const newValue = inputValue.slice(0, -1);
						setInputValue(newValue);
					}
					return;
				}

				// Only allow digits and hyphens
				if (/[\d-]/.test(input)) {
					const newValue = inputValue + input;
					if (newValue.length <= 10) {
						// Max length for YYYY-MM-DD
						setInputValue(newValue);
						onChange(newValue);
					}
				}
			},
			{isActive},
		);

		return (
			<Text color={isActive ? 'white' : 'gray'}>
				{inputValue}
				{isActive && '|'}
			</Text>
		);
	};

	const handleDateChange = (value: string) => {
		setDateInputValue(value);

		// Only update the date state if it's a valid date format
		if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
			try {
				const newDate = new Date(value + 'T00:00:00.000Z');
				if (!isNaN(newDate.getTime())) {
					setCurrentDate(newDate);
				}
			} catch (error) {
				// Ignore invalid dates
			}
		}
	};

	const renderButtons = () => {
		return (
			<Box gap={2}>
				<Text
					key="submit-button"
					color={focusArea === 'submit' ? 'black' : 'blue'}
					backgroundColor={focusArea === 'submit' ? 'blue' : undefined}
				>
					{' [Submit] '}
				</Text>
				<Text
					key="cancel-button"
					color={focusArea === 'cancel' ? 'black' : 'blue'}
					backgroundColor={focusArea === 'cancel' ? 'blue' : undefined}
				>
					{' [Cancel] '}
				</Text>
			</Box>
		);
	};

	// Show loading screen when submitting
	if (isSubmitting) {
		return (
			<Box flexDirection="column" minHeight={10}>
				{/* Loading content */}
				<Box
					marginTop={3}
					justifyContent="center"
					alignItems="center"
					minHeight={8}
				>
					<Box flexDirection="row" alignItems="center">
						<Spinner type="dots" />
						<Box marginLeft={1}>
							<Text color="yellow">Submitting Worklog</Text>
						</Box>
					</Box>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" minHeight={10}>
			{/* Issue Key Input - only if editable */}
			{isIssueKeyEditable && (
				<Box marginTop={1} flexDirection="column">
					<Text color="yellow">Issue Key:</Text>
					<Box marginTop={1}>
						<TextInput
							defaultValue={currentIssueKey}
							onChange={setCurrentIssueKey}
							onSubmit={value => {
								setCurrentIssueKey(value);
								navigateToArea('date' as any);
							}}
							placeholder="e.g. JTS-123, AD-456..."
							isDisabled={focusArea !== 'issueKey'}
						/>
					</Box>
				</Box>
			)}

			{/* Date Input - only if issue key is editable */}
			{isIssueKeyEditable && (
				<Box marginTop={1} flexDirection="column">
					<Text color="yellow">Date:</Text>
					<Box marginTop={1}>
						<SimpleDateInput
							value={dateInputValue || ''}
							onChange={handleDateChange}
							onSubmit={() => navigateToArea('time' as any)}
							isActive={focusArea === 'date'}
						/>
					</Box>
				</Box>
			)}

			{/* Main Content */}
			<Box marginTop={1} flexDirection="row" minHeight={8}>
				{/* Left Column: Time Selection */}
				<Box flexDirection="column" width={25} minHeight={8}>
					<Text color="yellow">Time spent:</Text>
					<Box marginTop={1}>
						{focusArea === 'time' ? (
							<DurationInput
								value={timeInputValue}
								onChange={handleTimeInputChange}
								onSubmit={() => navigateToArea('comment' as any)}
								compact={true}
								config={config}
								issueSelectionMode={isFavorite ? 'favorites' : null}
								incrementMinutes={60}
							/>
						) : (
							<Box>
								<Text color="gray">{timeInputValue}</Text>
							</Box>
						)}
					</Box>
				</Box>

				{/* Separator */}
				<Box marginX={2}>
					<Text color="gray">│</Text>
				</Box>

				{/* Right Column: Comment */}
				<Box flexDirection="column" flexGrow={1} minHeight={8}>
					<Text color="yellow">Comment:</Text>
					<Box marginTop={1} height={4}>
						<TextInput
							defaultValue={comment}
							onChange={setComment}
							onSubmit={handleSubmit}
							placeholder="Enter work description..."
							isDisabled={focusArea !== 'comment'}
						/>
					</Box>
					<Box marginTop={2} justifyContent="flex-end">
						{renderButtons()}
					</Box>
				</Box>
			</Box>

			{/* Error Display */}
			{error && (
				<Box marginTop={1}>
					<Text color="red">Error: {error}</Text>
				</Box>
			)}
		</Box>
	);
}
