import React from 'react';
import {Box, Text} from 'ink';
import {Spinner} from '@inkjs/ui';

type ConfirmationDialogProps = {
	children: React.ReactNode;
	width?: number;
	borderColor?: string;
	paddingX?: number;
	paddingY?: number;
	isLoading?: boolean;
	loadingText?: string;
};

export function ConfirmationDialog({
	children,
	width = 50,
	borderColor = 'cyan',
	paddingX = 1,
	paddingY = 1,
	isLoading = false,
	loadingText = 'Processing...',
}: ConfirmationDialogProps) {
	return (
		<Box justifyContent="center">
			<Box
				width={width}
				borderStyle="round"
				borderColor={borderColor}
				paddingX={paddingX}
				paddingY={paddingY}
			>
				{isLoading ? (
					<Box flexDirection="row" alignItems="center">
						<Spinner />
						<Text> {loadingText}</Text>
					</Box>
				) : (
					children
				)}
			</Box>
		</Box>
	);
}
