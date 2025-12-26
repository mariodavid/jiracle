import React, {useState, useEffect, useCallback, useRef} from 'react';
import {Box, Text, useInput, useFocus} from 'ink';
import {TextInput, Spinner} from '@inkjs/ui';
import type {JiraConfig, WorklogEntry} from '../jira-client.js';
import {resolveDefaults} from '../jira-client.js';
import {getCommentWithPrefill} from '../jira/utils.js';
import {uiLogger} from '../utils/logger.js';
import {LocalDate} from '../domain/LocalDate.js';
import {Duration} from '../domain/Duration.js';
import {type IssueKey} from '../domain/IssueKey.js';
import DurationInput from './WorklogForm/DurationInput.js';
import {IssueKeyInput} from './WorklogForm/IssueKeyInput.js';

type InlineWorklogFormProps = {
	issueKey?: IssueKey;
	date: LocalDate;
	defaultTimeSpent?: Duration;
	defaultComment?: string;
	onSubmit: (data: {
		issueKey: IssueKey;
		timeSpent: Duration;
		comment: string;
		date: LocalDate;
		worklogId?: string; // For edit mode
	}) => void;
	onCancel: () => void;
	isSubmitting?: boolean;
	error?: string | undefined;
	config?: JiraConfig;
	isFavorite?: boolean;
	isIssueKeyEditable?: boolean;
	// Edit mode props
	isEditMode?: boolean;
	worklogId?: string;
	// Recent worklogs for comment prefill
	recentWorklogs?: WorklogEntry[];
};

type FocusArea = 'issueKey' | 'date' | 'time' | 'comment' | 'submit' | 'cancel';

const EMPTY_ARRAY: WorklogEntry[] = [];

export function InlineWorklogForm({
	issueKey,
	date,
	defaultTimeSpent,
	defaultComment = '',
	onSubmit,
	onCancel,
	isSubmitting = false,
	error = undefined,
	config,
	isFavorite = false,
	isIssueKeyEditable = false,
	isEditMode = false,
	worklogId,
	recentWorklogs = EMPTY_ARRAY,
}: InlineWorklogFormProps) {
	// Determine default time based on configuration
	// Determine default time based on configuration
	const getDefaultTime = () => {
		if (defaultTimeSpent) return defaultTimeSpent;

		// Use the new hierarchical default resolution
		if (config && issueKey) {
			const defaults = resolveDefaults(config, issueKey);
			return new Duration(defaults.time);
		}

		// Fallback to 1h
		return new Duration('1h');
	};

	// Determine default comment with recent worklog prefill
	const getDefaultComment = () => {
		if (!config || !issueKey) {
			return defaultComment || '';
		}

		const result = getCommentWithPrefill(config, issueKey, recentWorklogs, {
			isEditMode,
			explicitDefault: defaultComment,
			referenceDate: currentDate,
		});

		return result;
	};

	const [currentIssueKey, setCurrentIssueKey] = useState(issueKey);
	// State for the text input value to support controlled input and immediate parsing effects

	const [currentDate, setCurrentDate] = useState(date);
	const [dateInputValue, setDateInputValue] = useState(
		date.toISOString(), // YYYY-MM-DD format
	);
	const [selectedTime, setSelectedTime] = useState(() => {
		return getDefaultTime();
	});
	const [timeInputValue, setTimeInputValue] = useState(() => {
		return getDefaultTime().toString();
	});
	const [comment, setComment] = useState(() => {
		return getDefaultComment();
	});

	// Update comment when recent worklogs arrive (for comment prefilling)
	// Update comment when recent worklogs arrive (for comment prefilling)
	// Update comment when recent worklogs arrive (for comment prefilling)
	const previousDepsRef = useRef({
		recentWorklogs,
		isEditMode,
		defaultComment,
		config,
		issueKey,
		currentDate,
	});

	useEffect(() => {
		previousDepsRef.current = {
			recentWorklogs,
			isEditMode,
			defaultComment,
			config,
			issueKey,
			currentDate,
		};

		// Only update if we're not in edit mode and have config
		if (!isEditMode && recentWorklogs.length > 0 && config && issueKey) {
			const newComment = getCommentWithPrefill(
				config,
				issueKey,
				recentWorklogs,
				{
					isEditMode,
					explicitDefault: defaultComment,
					referenceDate: currentDate,
				},
			);

			if (newComment !== comment) {
				setComment(newComment);
			}
		}
	}, [
		recentWorklogs,
		isEditMode,
		defaultComment,
		config,
		issueKey,
		currentDate,
		comment, // Added comment to deps to allow check against current state, though strictly not needed if we trust the closure, but good for debug
	]);
	const [focusArea, setFocusArea] = useState<FocusArea>(
		isIssueKeyEditable ? 'issueKey' : 'time',
	);
	const submittingRef = useRef(false);

	const {isFocused} = useFocus({autoFocus: true});

	// Reset submitting ref when parent submission completes
	useEffect(() => {
		if (!isSubmitting) {
			submittingRef.current = false;
		}
	}, [isSubmitting]);

	const handleReverseTabNavigation = () => {
		switch (focusArea) {
			case 'issueKey': {
				setFocusArea('cancel');
				break;
			}

			case 'date': {
				if (isIssueKeyEditable) {
					setFocusArea('issueKey');
				} else {
					setFocusArea('cancel');
				}

				break;
			}

			case 'time': {
				if (isIssueKeyEditable) {
					setFocusArea('date');
				} else {
					setFocusArea('cancel');
				}

				break;
			}

			case 'comment': {
				normalizeTimeOnBlur(timeInputValue);
				setFocusArea('time');
				break;
			}

			case 'submit': {
				setFocusArea('comment');
				break;
			}

			case 'cancel': {
				setFocusArea('submit');
				break;
			}

			default: {
				break;
			}
		}
	};

	const handleForwardTabNavigation = () => {
		switch (focusArea) {
			case 'issueKey': {
				if (isIssueKeyEditable) {
					setFocusArea('date');
				} else {
					setFocusArea('time');
				}

				break;
			}

			case 'date': {
				setFocusArea('time');
				break;
			}

			case 'time': {
				normalizeTimeOnBlur(timeInputValue);
				setFocusArea('comment');
				break;
			}

			case 'comment': {
				setFocusArea('submit');
				break;
			}

			case 'submit': {
				setFocusArea('cancel');
				break;
			}

			case 'cancel': {
				if (isIssueKeyEditable) {
					setFocusArea('issueKey');
				} else {
					setFocusArea('time');
				}

				break;
			}

			default: {
				break;
			}
		}
	};

	const handleEnterKey = () => {
		switch (focusArea) {
			case 'submit': {
				handleSubmit();
				break;
			}

			case 'cancel': {
				onCancel();
				break;
			}

			case 'comment': {
				handleSubmit();
				break;
			}

			default: {
				// No action for other focus areas (date, time, issueKey)
				break;
			}
		}
	};

	useInput(
		(_, key) => {
			if (!isFocused) return;

			if (key.escape) {
				onCancel();
				return;
			}

			if (key.tab) {
				if (key.shift) {
					handleReverseTabNavigation();
				} else {
					handleForwardTabNavigation();
				}

				return;
			}

			if (key.ctrl && key.return) {
				handleSubmit();
				return;
			}

			if (key.return) {
				handleEnterKey();
			}
		},
		{isActive: isFocused},
	);

	const handleTimeInputChange = (value: string) => {
		setTimeInputValue(value);
		setSelectedTime(new Duration(value));
	};

	const normalizeTimeOnBlur = (inputValue: string) => {
		// If user just entered numbers, add 'h' automatically
		if (/^\d+([.,]\d+)?$/.test(inputValue)) {
			const normalizedValue = inputValue + 'h';
			setTimeInputValue(normalizedValue);
			setSelectedTime(new Duration(normalizedValue));
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
		try {
			const localDate = LocalDate.fromString(value);
			setCurrentDate(localDate);
		} catch {
			// Ignore invalid dates
		}
	};

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

		// Don't submit if issue key is not set
		if (!currentIssueKey) {
			uiLogger.debug('InlineWorklogForm: Cannot submit without issue key');
			submittingRef.current = false;
			return;
		}

		// Set ref immediately (synchronous)
		submittingRef.current = true;
		const timeSpent = selectedTime;
		onSubmit({
			issueKey: currentIssueKey,
			timeSpent,
			comment,
			date: currentDate,
			...(isEditMode && worklogId && {worklogId}),
		});
	}, [
		isSubmitting,
		selectedTime,
		comment,
		currentIssueKey,
		currentDate,
		onSubmit,
		isEditMode,
		worklogId,
	]);

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
			<Box
				width="100%"
				justifyContent="center"
				alignItems="center"
				paddingY={5}
			>
				<Box flexDirection="row" alignItems="center">
					<Spinner type="dots" />
					<Box marginLeft={1}>
						<Text>Submitting Worklog</Text>
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
						<IssueKeyInput
							issueKey={currentIssueKey}
							isActive={focusArea === 'issueKey'}
							onChange={newKey => {
								if (newKey) {
									setCurrentIssueKey(previous => {
										if (previous?.equals(newKey)) {
											return previous;
										}

										return newKey;
									});
								}
							}}
							onSubmit={() => {
								setFocusArea('date');
							}}
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
							value={dateInputValue ?? ''}
							isActive={focusArea === 'date'}
							onChange={handleDateChange}
							onSubmit={() => {
								setFocusArea('time');
							}}
						/>
					</Box>
				</Box>
			)}

			{/* Time Input */}
			<Box marginTop={1} flexDirection="column">
				<Text color="yellow">Time spent:</Text>
				<Box marginTop={1}>
					{focusArea === 'time' ? (
						<DurationInput
							value={timeInputValue}
							compact={true}
							config={config}
							issueSelectionMode={isFavorite ? 'favorites' : undefined}
							incrementMinutes={60}
							onChange={handleTimeInputChange}
							onSubmit={() => {
								setFocusArea('comment');
							}}
							onBlur={normalizeTimeOnBlur}
						/>
					) : (
						<Box>
							<Text color="gray">{timeInputValue}</Text>
						</Box>
					)}
				</Box>
			</Box>

			{/* Comment Input */}
			<Box marginTop={1} flexDirection="column">
				<Text color="yellow">Comment:</Text>
				<Box marginTop={1}>
					<TextInput
						key={`comment-${comment}-${issueKey?.toString() ?? 'unknown'}`}
						defaultValue={comment}
						placeholder="Enter work description..."
						isDisabled={focusArea !== 'comment'}
						onChange={setComment}
						onSubmit={handleSubmit}
					/>
				</Box>
			</Box>

			{/* Buttons */}
			<Box marginTop={2} justifyContent="flex-start">
				{renderButtons()}
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
