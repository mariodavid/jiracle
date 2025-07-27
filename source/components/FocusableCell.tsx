import React from 'react';
import {Box, Text, useFocus} from 'ink';
import type {IssueKey} from '../domain/IssueKey.js';

export type FocusableCellProps = {
	value: string;
	focusId: string;
	isDefault?: boolean;
	isTotal?: boolean;
	width?: number;
	isActive?: boolean;
	issueKey?: IssueKey;
	columnIndex?: number;
	rightAlign?: boolean;
	onFocusChange?: (
		issueKey: IssueKey,
		columnIndex: number,
		isFocused: boolean,
	) => void;
};

export function FocusableCell({
	value,
	focusId,
	isTotal = false,
	width = 8,
	isActive = true,
	issueKey,
	columnIndex,
	rightAlign = false,
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

	// Handle display value differently for right-aligned cells
	const displayValue = rightAlign
		? value
				.split('\n')
				.map(line => line.padStart(width - 1))
				.join('\n') // Right-align each line for multi-line content
		: isFocused
		? ` ${value} `.padStart(width) // Full width when focused
		: value.padStart(width - 1) + ' '; // Normal spacing when not focused

	return (
		<Box width={width} justifyContent={rightAlign ? 'flex-end' : 'flex-start'}>
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
