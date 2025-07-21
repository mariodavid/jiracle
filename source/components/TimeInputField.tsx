import React, {useState, useRef} from 'react';
import {Text, Box, useInput} from 'ink';

type TimeInputFieldProps = {
	value: string;
	onChange: (value: string) => void;
	onSubmit: (value: string) => void;
	compact?: boolean;
	label?: string;
	incrementMinutes?: number;
};

export default function TimeInputField({
	value,
	onChange,
	onSubmit,
	compact = false,
	label,
	incrementMinutes = 15,
}: TimeInputFieldProps) {
	const initialValue = value || '08:00';
	const [timeInputValue, setTimeInputValue] = useState(initialValue);
	const [cursorPosition, setCursorPosition] = useState(initialValue.length);
	const [isSelected, setIsSelected] = useState(true); // Start with text selected
	const isSelectedRef = useRef(true); // Track selection state synchronously
	const timeInputValueRef = useRef(initialValue); // Track current value synchronously

	// Helper function to check if a character is valid for time input (HH:MM)
	const isValidInputChar = (char: string, currentValue: string): boolean => {
		if (!/[\d:]/.test(char)) return false;

		const newValue = currentValue + char;

		// Don't allow starting with colon
		if (newValue.startsWith(':')) return false;

		// Don't allow multiple colons
		if ((newValue.match(/:/g) || []).length > 1) return false;

		// Don't allow more than 5 characters (HH:MM)
		if (newValue.length > 5) return false;

		// Don't allow digits in wrong positions
		if (newValue.length === 1 && !/\d/.test(newValue)) return false;
		if (newValue.length === 2) {
			// Two characters: either HH or H:
			if (!newValue.includes(':')) {
				// Two digit hour (00-23)
				if (!/^[01]\d|2[0-3]$/.test(newValue)) return false;
			} else if (!/^\d:$/.test(newValue)) {
				// Single digit hour with colon (8:)
				return false;
			}
		}

		if (newValue.length === 3) {
			// Three characters: either HH: or H:M
			if (newValue[2] === ':') {
				// Two digit hour with colon (08:)
				if (!/^[01]\d:|2[0-3]:$/.test(newValue)) return false;
			} else if (!/^\d:[0-5]$/.test(newValue)) {
				// Single digit hour with one minute digit (8:3)
				return false;
			}
		}

		if (newValue.length === 4) {
			// Four characters: either HH:M or H:MM
			if (/^\d:/.test(newValue)) {
				// Single digit hour with two minute digits (8:30)
				if (!/^\d:[0-5]\d$/.test(newValue)) return false;
			} else if (!/^[01]\d:[0-5]|2[0-3]:[0-5]$/.test(newValue)) {
				// Two digit hour with one minute digit (08:3)
				return false;
			}
		}

		if (
			newValue.length === 5 && // Five characters: HH:MM format
			!/^[01]\d:[0-5]\d|2[0-3]:[0-5]\d$/.test(newValue)
		)
			return false;

		return true;
	};

	// Helper function to parse time string to minutes since midnight
	const parseTimeToMinutes = (timeStr: string): number => {
		const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
		if (!match) return 8 * 60; // Default to 08:00

		const hours = Number.parseInt(match[1]!, 10);
		const minutes = Number.parseInt(match[2]!, 10);

		if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
			return 8 * 60; // Default to 08:00
		}

		return hours * 60 + minutes;
	};

	// Helper function to format minutes to HH:MM
	const formatMinutesToTime = (totalMinutes: number): string => {
		// Wrap around 24 hours
		const normalizedMinutes =
			((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
		const hours = Math.floor(normalizedMinutes / 60);
		const minutes = normalizedMinutes % 60;
		return `${hours.toString().padStart(2, '0')}:${minutes
			.toString()
			.padStart(2, '0')}`;
	};

	const handleTimeInputChange = (inputValue: string) => {
		setTimeInputValue(inputValue);
		onChange(inputValue);
	};

	const normalizeTimeOnSubmit = (inputValue: string): string => {
		let normalizedValue = inputValue;

		// If incomplete, try to complete it
		if (/^\d{1,2}$/.test(normalizedValue)) {
			// Just hours, add :00
			const hours = Number.parseInt(normalizedValue, 10);
			if (hours >= 0 && hours <= 23) {
				normalizedValue = `${hours.toString().padStart(2, '0')}:00`;
			}
		} else if (/^\d{1,2}:$/.test(normalizedValue)) {
			// Hours with colon, add 00
			normalizedValue += '00';
		} else if (/^\d{1,2}:\d$/.test(normalizedValue)) {
			// Hours with single minute digit, pad
			normalizedValue += '0';
		} else if (/^\d:\d{2}$/.test(normalizedValue)) {
			// Single hour digit with minutes (8:30), pad hour
			const match = normalizedValue.match(/^(\d):(\d{2})$/);
			if (match) {
				const hours = Number.parseInt(match[1]!, 10);
				const minutes = Number.parseInt(match[2]!, 10);
				if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
					normalizedValue = `${hours.toString().padStart(2, '0')}:${minutes
						.toString()
						.padStart(2, '0')}`;
				}
			}
		}

		// Validate final format
		const match = normalizedValue.match(/^(\d{1,2}):(\d{2})$/);
		if (match) {
			const hours = Number.parseInt(match[1]!, 10);
			const minutes = Number.parseInt(match[2]!, 10);

			if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
				normalizedValue = `${hours.toString().padStart(2, '0')}:${minutes
					.toString()
					.padStart(2, '0')}`;
			} else {
				normalizedValue = '08:00'; // Default fallback
			}
		} else {
			normalizedValue = '08:00'; // Default fallback
		}

		// Update the display if normalization happened
		if (normalizedValue !== inputValue) {
			setTimeInputValue(normalizedValue);
			onChange(normalizedValue);
		}

		return normalizedValue;
	};

	const adjustTime = (
		direction: 'up' | 'down',
		increment: 'hour' | 'minute' = 'minute',
	) => {
		const currentMinutes = parseTimeToMinutes(timeInputValueRef.current);
		let newMinutes: number;

		if (increment === 'hour') {
			newMinutes =
				direction === 'up' ? currentMinutes + 60 : currentMinutes - 60;
		} else {
			// Configurable minute increments
			newMinutes =
				direction === 'up'
					? currentMinutes + incrementMinutes
					: currentMinutes - incrementMinutes;
		}

		const timeString = formatMinutesToTime(newMinutes);
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
			// Shift+Up for hour increments, regular Up for 15-minute increments
			adjustTime('up', key.shift ? 'hour' : 'minute');
		} else if (key.downArrow) {
			adjustTime('down', key.shift ? 'hour' : 'minute');
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
				if (/[\d:]/.test(input)) {
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
					backgroundColor={isSelected ? 'cyan' : undefined}
				>
					{timeInputValue}
					{!isSelected && <Text color="cyan">█</Text>}
				</Text>
			</Box>
		);
	};

	if (compact) {
		return <Box>{renderInput()}</Box>;
	}

	return (
		<Box flexDirection="column">
			{label && <Text color="cyan">{label}:</Text>}
			<Text> </Text>
			{renderInput()}
			<Text> </Text>
		</Box>
	);
}
