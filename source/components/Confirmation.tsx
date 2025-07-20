import React from 'react';
import {Box, Text} from 'ink';
import {ConfirmInput} from '@inkjs/ui';

interface ConfirmationProps {
	title?: string;
	message: string;
	onConfirm: (confirmed: boolean) => void;
}

export function Confirmation({title, message, onConfirm}: ConfirmationProps) {
	return (
		<Box flexDirection="column">
			{title && <Text>{title}</Text>}
			<Text>{message}</Text>
			<ConfirmInput
				submitOnEnter={false}
				onConfirm={() => {
					onConfirm(true);
				}}
				onCancel={() => {
					onConfirm(false);
				}}
			/>
		</Box>
	);
}
