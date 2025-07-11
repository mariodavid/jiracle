import React from 'react';
import {Box, Text} from 'ink';
import {ConfirmInput} from '@inkjs/ui';

interface DeleteWorklogConfirmationProps {
	issueKey: string;
	dayLabel: string;
	onConfirm: (confirmed: boolean) => void;
}

export function DeleteWorklogConfirmation({
	issueKey,
	dayLabel,
	onConfirm,
}: DeleteWorklogConfirmationProps) {
	return (
		<Box flexDirection="column">
			<Text>{`Delete all worklogs for ${issueKey} on ${dayLabel}?`}</Text>
			<ConfirmInput
				submitOnEnter={false}
				onConfirm={() => onConfirm(true)}
				onCancel={() => onConfirm(false)}
			/>
		</Box>
	);
}
