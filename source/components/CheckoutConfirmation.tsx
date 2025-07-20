import React from 'react';
import {Box, Text} from 'ink';
import {ConfirmInput} from '@inkjs/ui';

interface CheckoutConfirmationProps {
	onConfirm: (confirmed: boolean) => void;
}

export function CheckoutConfirmation({onConfirm}: CheckoutConfirmationProps) {
	return (
		<Box flexDirection="column">
			<Text bold color="yellow">
				End Work
			</Text>
			<Text>Do you want to check out and end work for today?</Text>
			<ConfirmInput
				submitOnEnter={true}
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
