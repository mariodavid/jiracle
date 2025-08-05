import React from 'react';
import {Box, Text, useInput} from 'ink';
import {Alert} from '@inkjs/ui';
import type {JiraConfig} from '../jira/types.js';
import type {MonthYearSelection} from './MonthYearSelector.js';

type SAPExportConfirmationProps = {
	config: JiraConfig;
	selection: MonthYearSelection;
	onConfirm: () => void;
	onCancel: () => void;
};

const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

export function SAPExportConfirmation({
	config,
	selection,
	onConfirm,
	onCancel,
}: SAPExportConfirmationProps) {
	const monthName = MONTH_NAMES[selection.month - 1];
	const sapConfig = config.sap;

	useInput((input, key) => {
		if (input === 'q' || key.escape) {
			onCancel();
			return;
		}

		if (key.return) {
			onConfirm();
		}
	});

	if (!sapConfig?.enabled) {
		return (
			<Box justifyContent="center">
				<Box flexDirection="column" width={60}>
					<Alert variant="error">
						SAP export is not enabled. Please configure SAP settings.
					</Alert>
				</Box>
			</Box>
		);
	}

	if (!sapConfig.persnr) {
		return (
			<Box justifyContent="center">
				<Box flexDirection="column" width={60}>
					<Alert variant="error">
						Personnel number (Persnr) is missing. Please configure in settings.
					</Alert>
				</Box>
			</Box>
		);
	}

	return (
		<Box justifyContent="center">
			<Box flexDirection="column" width={60}>
				<Box marginBottom={2} justifyContent="center">
					<Text bold>Export Timesheet to SAP S/4HANA</Text>
				</Box>

				<Box
					flexDirection="column"
					borderStyle="single"
					paddingX={2}
					paddingY={1}
					marginBottom={2}
				>
					<Text bold>Export Details:</Text>
					<Box marginTop={1} flexDirection="column">
						<Text>
							├─ Month: {monthName} {selection.year}
						</Text>
						<Text>├─ Personnel Number: {sapConfig.persnr}</Text>
						<Text>
							├─ Comment Prefix: {sapConfig.commentPrefix ?? '(none)'}
						</Text>
						<Text>
							└─ Delete Existing:{' '}
							{sapConfig.removeExistingTimesheets ? 'Yes' : 'No'}
						</Text>
					</Box>
				</Box>

				<Box flexDirection="column" marginBottom={2}>
					<Text>This will send your timesheet to SAP S/4HANA.</Text>
					{sapConfig.removeExistingTimesheets && (
						<Text color="yellow">Existing entries will be replaced.</Text>
					)}
				</Box>
			</Box>
		</Box>
	);
}
