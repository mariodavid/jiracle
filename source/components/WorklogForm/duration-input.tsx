import React, {useState, useRef} from 'react';
import {Text, Box, useInput} from 'ink';
import type {JiraIssue, JiraConfig} from '../../jira-client.js';
import {resolveDefaults} from '../../jira-client.js';
import {TimeParsingService} from '../../services/time-parsing-service.js';
import {
	useInputValidation,
	type AllowedUnit,
} from '../../hooks/use-input-validation.js';

type DurationInputProps = {
	selectedIssue?: JiraIssue;
	value: string;
	onChange: (value: string) => void;
	onSubmit: (value: string) => void;
	compact?: boolean;
	config?: JiraConfig;
	issueSelectionMode?: 'favorites' | 'assigned' | 'other' | undefined;
	allowedUnits?: AllowedUnit[];
	incrementMinutes?: number;
};

export default function DurationInput({
	selectedIssue,
	value,
	onChange,
	onSubmit,
	compact = false,
	config,
	issueSelectionMode,
	allowedUnits = ['h', 'm', 'd'],
	incrementMinutes = 15,
}: DurationInputProps) {
	// Remove unused parameter warning
	void issueSelectionMode;

	// Use the input validation hook
	const {isValidInputChar} = useInputValidation(allowedUnits);

	// Determine default time based on issue and configuration
	const getDefaultTime = () => {
		// If value is explicitly provided, always use it (parent has already calculated default)
		if (value) return value;

		// Use the new hierarchical default resolution
		if (selectedIssue && config) {
			const defaults = resolveDefaults(config, selectedIssue.key);
			return defaults.time;
		}

		// Check for global default time
		if (config?.defaultTime) return config.defaultTime;

		// Fallback to 1h
		return '1h';
	};

	const defaultTime = getDefaultTime();
	const initialValue = value || defaultTime;
	const [timeInputValue, setTimeInputValue] = useState(initialValue);
	const [cursorPosition, setCursorPosition] = useState(initialValue.length);
	const [isSelected, setIsSelected] = useState(true); // Start with text selected
	const isSelectedRef = useRef(true); // Track selection state synchronously
	const timeInputValueRef = useRef(initialValue); // Track current value synchronously

	const handleTimeInputChange = (inputValue: string) => {
		setTimeInputValue(inputValue);
		onChange(inputValue);
	};

	const normalizeTimeOnSubmit = (inputValue: string) => {
		const normalizedValue = TimeParsingService.normalizeTimeString(inputValue);

		// Update the display if normalization happened
		if (normalizedValue !== inputValue) {
			setTimeInputValue(normalizedValue);
			timeInputValueRef.current = normalizedValue;
			onChange(normalizedValue);
		}

		return normalizedValue;
	};

	const adjustTime = (direction: 'up' | 'down') => {
		const newTimeString = TimeParsingService.adjustTime(
			timeInputValueRef.current,
			direction,
			incrementMinutes,
		);

		setTimeInputValue(newTimeString);
		timeInputValueRef.current = newTimeString;
		setCursorPosition(newTimeString.length);
		onChange(newTimeString);
		// Re-select the text after arrow key adjustment
		setIsSelected(true);
		isSelectedRef.current = true;
	};

	useInput((input, key) => {
		if (key.upArrow) {
			adjustTime('up');
			// Keep selection active after arrow key adjustment
		} else if (key.downArrow) {
			adjustTime('down');
			// Keep selection active after arrow key adjustment
		} else if (key.return) {
			const normalizedValue = normalizeTimeOnSubmit(timeInputValueRef.current);
			onSubmit(normalizedValue);
		} else if (key.tab) {
			// Also normalize on Tab (like Enter)
			const normalizedValue = normalizeTimeOnSubmit(timeInputValueRef.current);
			onSubmit(normalizedValue);
		} else if (key.backspace || key.delete) {
			if (isSelected) {
				// If text is selected, clear everything
				setTimeInputValue('');
				timeInputValueRef.current = '';
				setCursorPosition(0);
				handleTimeInputChange('');
				setIsSelected(false);
				isSelectedRef.current = false;
			} else if (timeInputValueRef.current.length > 0) {
				const newValue = timeInputValueRef.current.slice(0, -1);
				setTimeInputValue(newValue);
				timeInputValueRef.current = newValue;
				setCursorPosition(Math.max(0, cursorPosition - 1));
				handleTimeInputChange(newValue);
			}
		} else if (input && input.length === 1) {
			// Validate input character
			if (isSelectedRef.current) {
				// If text is selected, replace everything with first character
				if (/[\d.,hdm]/.test(input)) {
					setTimeInputValue(input);
					timeInputValueRef.current = input;
					setCursorPosition(1);
					handleTimeInputChange(input);
					setIsSelected(false);
					isSelectedRef.current = false;
				}
			} else if (isValidInputChar(input, timeInputValueRef.current)) {
				// Normal typing - append to existing text if valid
				const newValue = timeInputValueRef.current + input;
				setTimeInputValue(newValue);
				timeInputValueRef.current = newValue;
				setCursorPosition(newValue.length);
				handleTimeInputChange(newValue);
				// If invalid, ignore the character (no feedback, just don't add it)
			}
		}
	});
	const renderInput = () => {
		return (
			<Box>
				<Text
					color={isSelected ? 'black' : 'white'}
					backgroundColor={isSelected ? 'blue' : undefined}
				>
					{timeInputValue}
					{!isSelected && <Text color="cyan">█</Text>}
					{/* No padding to prevent flickering when focus changes */}
				</Text>
			</Box>
		);
	};

	if (compact) {
		return <Box flexDirection="column">{renderInput()}</Box>;
	}

	return (
		<Box flexDirection="column" height={40}>
			{selectedIssue && (
				<>
					<Text key="selected-issue" color="green">
						Selected: {selectedIssue.key} - {selectedIssue.fields.summary}
					</Text>
					<Text key="spacer-issue"> </Text>
				</>
			)}
			<Text key="enter-time-label" color="cyan">
				Enter time:
			</Text>
			<Text key="spacer-1"> </Text>
			{renderInput()}
			<Text key="spacer-2"> </Text>
			<Text key="empty-space" color="redBright" wrap="wrap">
				{' '}
			</Text>
		</Box>
	);
}
