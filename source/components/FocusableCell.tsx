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

	// Create a fixed-width string with padding
	const displayValue = ` ${value} `.padStart(width);

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
