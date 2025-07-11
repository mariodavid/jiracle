import React, {useState, useEffect, useCallback, useRef} from 'react';
import {Box, Text, useInput, useFocus} from 'ink';
import {TextInput, Spinner} from '@inkjs/ui';
import CustomTimeInput from './WorklogForm/CustomTimeInput.js';
import type {JiraConfig} from '../jira-client.js';
import {resolveDefaults} from '../jira-client.js';

interface InlineWorklogFormProps {
	issueKey: string;
	date: Date;
	defaultTimeSpent?: string;
	defaultComment?: string;
	onSubmit: (data: {timeSpent: string; comment: string}) => void;
	onCancel: () => void;
	isSubmitting?: boolean;
	error?: string | null;
	config?: JiraConfig;
	isFavorite?: boolean;
}

type FocusArea = 'time' | 'comment' | 'submit' | 'cancel';

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

	const [selectedTime, setSelectedTime] = useState(() => {
		return getDefaultTime();
	});
	const [timeInputValue, setTimeInputValue] = useState(() => {
		return getDefaultTime();
	});
	const [comment, setComment] = useState(defaultComment);
	const [focusArea, setFocusArea] = useState<FocusArea>('time');
	const submittingRef = useRef(false);

	const {isFocused} = useFocus({autoFocus: true});

	// Reset submitting ref when parent submission completes
	useEffect(() => {
		if (!isSubmitting) {
			submittingRef.current = false;
		}
	}, [isSubmitting]);

	// Format date for display
	const formatDate = (date: Date) => {
		const days = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
		];
		const months = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
		];
		return `${days[date.getDay()]}, ${
			months[date.getMonth()]
		} ${date.getDate()}`;
	};

	useInput(
		(_, key) => {
			if (!isFocused) return;

			// Escape to cancel
			if (key.escape) {
				onCancel();
				return;
			}

			// Tab navigation between areas
			if (key.tab) {
				if (focusArea === 'time') {
					// Normalize time when leaving time field
					normalizeTimeOnBlur(timeInputValue);
					setFocusArea('comment');
				} else if (focusArea === 'comment') {
					setFocusArea('submit');
				} else if (focusArea === 'submit') {
					setFocusArea('cancel');
				} else if (focusArea === 'cancel') {
					setFocusArea('time');
				}
				return;
			}

			// Ctrl+Enter submits from anywhere
			if (key.ctrl && key.return) {
				handleSubmit();
			}

			// Handle enter in specific areas
			if (key.return) {
				if (focusArea === 'submit') {
					handleSubmit();
				} else if (focusArea === 'cancel') {
					onCancel();
				} else if (focusArea === 'comment') {
					handleSubmit();
				}
			}
		},
		{isActive: isFocused},
	);

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

	const handleSubmit = useCallback(() => {
		console.log('InlineWorklogForm: handleSubmit called', {
			isSubmitting,
			submittingRef: submittingRef.current,
			selectedTime,
			comment,
			timestamp: new Date().toISOString(),
		});

		// Immediate synchronous check with ref
		if (isSubmitting || submittingRef.current) {
			console.log('InlineWorklogForm: Blocked duplicate submission');
			return; // Don't submit if already submitting
		}

		// Set ref immediately (synchronous)
		submittingRef.current = true;
		const timeSpent = selectedTime;
		onSubmit({timeSpent, comment});
	}, [isSubmitting, selectedTime, comment, onSubmit]);

	const renderButtons = () => {
		return (
			<Box gap={2}>
				<Text
					color={focusArea === 'submit' ? 'black' : 'blue'}
					backgroundColor={focusArea === 'submit' ? 'blue' : undefined}
				>
					{' [Submit] '}
				</Text>
				<Text
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
				{/* Header row - same level as table header */}
				<Box flexDirection="row">
					<Box width={20}>
						<Text bold color="white">
							Log Work
						</Text>
					</Box>
					<Box flexGrow={1} justifyContent="center">
						<Text color="cyan" bold>
							{issueKey} on {formatDate(date)}
						</Text>
					</Box>
				</Box>

				{/* Separator - same as table */}
				<Box width={68}>
					<Text color="gray">{'─'.repeat(68)}</Text>
				</Box>

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
			{/* Header row - same level as table header */}
			<Box flexDirection="row">
				<Box width={20}>
					<Text bold color="white">
						Log Work
					</Text>
				</Box>
				<Box flexGrow={1} justifyContent="center">
					<Text color="cyan" bold>
						{issueKey} on {formatDate(date)}
					</Text>
				</Box>
			</Box>

			{/* Separator - same as table */}
			<Box width={68}>
				<Text color="gray">{'─'.repeat(68)}</Text>
			</Box>

			{/* Main Content */}
			<Box marginTop={1} flexDirection="row" minHeight={8}>
				{/* Left Column: Time Selection */}
				<Box flexDirection="column" width={25} minHeight={8}>
					<Text color="yellow">Time spent:</Text>
					<Box marginTop={1}>
						{focusArea === 'time' ? (
							<CustomTimeInput
								value={timeInputValue}
								onChange={handleTimeInputChange}
								onSubmit={() => setFocusArea('comment')}
								compact={true}
								config={config}
								issueSelectionMode={isFavorite ? 'favorites' : null}
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
