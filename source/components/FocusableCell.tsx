import React from 'react';
import {Box, Text, useFocus} from 'ink';

export interface FocusableCellProps {
	value: string;
	focusId: string;
	isDefault?: boolean;
	isTotal?: boolean;
	width?: number;
}

export function FocusableCell({
	value,
	focusId,
	isTotal = false,
	width = 8,
}: FocusableCellProps) {
	const {isFocused} = useFocus({id: focusId, isActive: true});

	// Create a right-aligned value with some padding for visual spacing
	const displayValue = isFocused 
		? ` ${value} `.padStart(width)  // Full width when focused
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
