import React, {useState, useRef} from 'react';
import {Text, Box, useInput} from 'ink';
import type {JiraIssue} from '../../jira-client.js';

type CustomTimeInputProps = {
	selectedIssue?: JiraIssue;
	value: string;
	onChange: (value: string) => void;
	onSubmit: (value: string) => void;
	compact?: boolean;
};

export default function CustomTimeInput({
	selectedIssue,
	value,
	onChange,
	onSubmit,
	compact = false,
}: CustomTimeInputProps) {
	const [timeInputValue, setTimeInputValue] = useState(value || '1h');
	const [cursorPosition, setCursorPosition] = useState((value || '1h').length);
	const [isSelected, setIsSelected] = useState(true); // Start with text selected
	const isSelectedRef = useRef(true); // Track selection state synchronously
	const timeInputValueRef = useRef(value || '1h'); // Track current value synchronously

	// Helper function to check if a character is valid for the current input
	const isValidInputChar = (char: string, currentValue: string): boolean => {
		if (!/[0-9.,hdm]/.test(char)) return false;

		const newValue = currentValue + char;

		// Don't allow starting with dot or comma
		if (/^[.,]/.test(newValue)) return false;

		// Check for invalid patterns
		if (newValue.includes('..')) return false; // Multiple dots
		if (newValue.includes(',,')) return false; // Multiple commas
		if (newValue.includes('.,') || newValue.includes(',.')) return false; // Mixed separators
		if (/\d+[.,]\d+[.,]/.test(newValue)) return false; // Multiple decimal separators

		// Allow h+digits - we'll auto-complete with 'm' when user exits field

		// Don't allow units at the beginning
		if (/^[hdm]/.test(newValue)) return false;

		// Handle units based on current state
		if (/[hdm]/.test(newValue)) {
			// If we have 'h' in the string
			if (/h/.test(newValue)) {
				// Don't allow dots/commas after h
				if (/h[.,]/.test(newValue)) return false;
				// Don't allow multiple h units
				if (/h.*h/.test(newValue)) return false;
				// Don't allow digits after h if there was a decimal before h (e.g., reject "2.5h2")
				if (/\d+[.,]\d+h\d/.test(newValue)) return false;
				// Don't allow m after h if there was a decimal before h (e.g., reject "2.5hm")
				if (/\d+[.,]\d+hm/.test(newValue)) return false;
				// After h, only allow digits followed by m (e.g., 2h30m)
				if (/h\d/.test(newValue)) {
					// If we have h followed by digits and another character that's not a digit or m
					if (/h\d+[^0-9m]/.test(newValue)) return false;
					// Don't allow other units after h+digits except m
					if (/h\d+[hd]/.test(newValue)) return false;
				}
				// Don't allow d after h
				if (/h.*d/.test(newValue)) return false;
			}

			// If we have 'd' in the string
			if (/d/.test(newValue)) {
				// Don't allow anything after d
				if (/d./.test(newValue)) return false;
			}

			// If we have 'm' in the string
			if (/m/.test(newValue)) {
				// Don't allow anything after m
				if (/m./.test(newValue)) return false;
			}
		}

		return true;
	};

	// Helper function to parse time strings to hours
	const parseTimeToHours = (timeStr: string): number => {
		if (!timeStr) return 1;

		// Handle combined format (2h30m, 1h15m, etc.)
		const combinedMatch = timeStr.match(/^(\d+)h(\d+)m$/i);
		if (combinedMatch && combinedMatch[1] && combinedMatch[2]) {
			const hours = parseFloat(combinedMatch[1]);
			const minutes = parseFloat(combinedMatch[2]);
			return hours + minutes / 60;
		}

		// Handle days (1d = 8h)
		const dayMatch = timeStr.match(/^(\d+(?:[.,]\d+)?)d$/i);
		if (dayMatch && dayMatch[1]) {
			return parseFloat(dayMatch[1].replace(',', '.')) * 8;
		}

		// Handle hours (1h, 2.5h, etc.)
		const hourMatch = timeStr.match(/^(\d+(?:[.,]\d+)?)h?$/i);
		if (hourMatch && hourMatch[1]) {
			return parseFloat(hourMatch[1].replace(',', '.'));
		}

		// Handle minutes (30m, 90m, etc.)
		const minuteMatch = timeStr.match(/^(\d+)m$/i);
		if (minuteMatch && minuteMatch[1]) {
			return parseFloat(minuteMatch[1]) / 60;
		}

		// Default to 1 hour if unparseable
		return 1;
	};

	const handleTimeInputChange = (inputValue: string) => {
		setTimeInputValue(inputValue);
		onChange(inputValue);
	};

	const normalizeTimeOnSubmit = (inputValue: string) => {
		let normalizedValue = inputValue;
		
		// Convert comma to dot (German decimal separator)
		if (normalizedValue.includes(',')) {
			normalizedValue = normalizedValue.replace(/,/g, '.');
		}
		
		// If user just entered numbers, add 'h' automatically
		if (/^\d+([.,]\d+)?$/.test(normalizedValue)) {
			normalizedValue = normalizedValue + 'h';
		}
		
		// If user entered h+digits (like "2h5"), add 'm' automatically
		if (/^\d+h\d+$/.test(normalizedValue)) {
			normalizedValue = normalizedValue + 'm';
		}
		
		// Update the display if normalization happened
		if (normalizedValue !== inputValue) {
			setTimeInputValue(normalizedValue);
			onChange(normalizedValue);
		}
		
		return normalizedValue;
	};

	const adjustTime = (direction: 'up' | 'down') => {
		const currentHours = parseTimeToHours(timeInputValueRef.current);
		const newHours =
			direction === 'up'
				? Math.min(currentHours + 1, 24)
				: Math.max(currentHours - 1, 1);
		// Round to integers for arrow key adjustments (always round down)
		const roundedHours = Math.floor(newHours);
		const timeString = `${roundedHours}h`;
		setTimeInputValue(timeString);
		timeInputValueRef.current = timeString;
		setCursorPosition(timeString.length);
		onChange(timeString);
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
				if (/[0-9.,hdm]/.test(input)) {
					setTimeInputValue(input);
					timeInputValueRef.current = input;
					setCursorPosition(1);
					handleTimeInputChange(input);
					setIsSelected(false);
					isSelectedRef.current = false;
				}
			} else {
				// Normal typing - append to existing text if valid
				if (isValidInputChar(input, timeInputValueRef.current)) {
					const newValue = timeInputValueRef.current + input;
					setTimeInputValue(newValue);
					timeInputValueRef.current = newValue;
					setCursorPosition(newValue.length);
					handleTimeInputChange(newValue);
				}
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
		return (
			<Box flexDirection="column">
				{renderInput()}
				<Box marginTop={1}>
					<Text color="gray">↑/↓ adjust or type</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" height={40}>
			{selectedIssue && (
				<>
					<Text color="green">
						Selected: {selectedIssue.key} - {selectedIssue.fields.summary}
					</Text>
					<Text> </Text>
				</>
			)}
			<Text color="cyan">Enter time:</Text>
			<Text> </Text>
			{renderInput()}
			<Text> </Text>
			<Text color="redBright" wrap="wrap">
				{' '}
			</Text>
			<Text color="gray">
				Type or use ↑/↓ to adjust, Enter to continue, ESC to go back
			</Text>
		</Box>
	);
}
