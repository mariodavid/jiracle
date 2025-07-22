import React from 'react';
import {Box, Text} from 'ink';
import {ConfirmInput} from '@inkjs/ui';

type CheckinConfirmationProps = {
	onConfirm: (confirmed: boolean) => void;
};

export function CheckinConfirmation({onConfirm}: CheckinConfirmationProps) {
	return (
		<Box flexDirection="column">
			<Text bold color="cyan">
				Start Work
			</Text>
			<Text>Do you want to check in and start work for today?</Text>
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
