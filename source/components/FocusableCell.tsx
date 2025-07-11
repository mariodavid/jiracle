import React from 'react';
import {Box, Text, useFocus} from 'ink';

export interface FocusableCellProps {
	value: string;
	focusId: string;
	isDefault?: boolean;
	isTotal?: boolean;
	width?: number;
	isActive?: boolean;
	issueKey?: string;
	columnIndex?: number;
	onFocusChange?: (
		issueKey: string,
		columnIndex: number,
		isFocused: boolean,
	) => void;
}

export function FocusableCell({
	value,
	focusId,
	isTotal = false,
	width = 8,
	isActive = true,
	issueKey,
	columnIndex,
	onFocusChange,
}: FocusableCellProps) {
	const {isFocused} = useFocus({id: focusId, isActive});

	// Call focus change callback when this cell gets focused
	React.useEffect(() => {
		if (
			isFocused &&
			issueKey !== undefined &&
			columnIndex !== undefined &&
			onFocusChange
		) {
			onFocusChange(issueKey, columnIndex, true);
		}
	}, [isFocused, issueKey, columnIndex, onFocusChange]);

	// Create a right-aligned value with some padding for visual spacing
	const displayValue = isFocused
		? ` ${value} `.padStart(width) // Full width when focused
		: value.padStart(width - 1) + ' '; // Normal spacing when not focused

	return (
		<Box width={width}>
			<Text
				bold={isTotal}
				color={isFocused ? 'black' : isTotal ? 'yellow' : undefined}
				backgroundColor={isFocused ? 'cyan' : undefined}
			>
				{displayValue}
			</Text>
		</Box>
	);
}
