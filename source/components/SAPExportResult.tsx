import React from 'react';
import {Box, Text, useInput} from 'ink';
import {Alert} from '@inkjs/ui';
import type {SAPExportResult as SAPResult} from '../services/SAPExportService.js';

type SAPExportResultProps = {
	result: SAPResult;
	onBack: () => void;
};

export function SAPExportResult({result, onBack}: SAPExportResultProps) {
	useInput(input => {
		if (input === 'q') {
			onBack();
		}
	});

	if (result.success) {
		return (
			<Box flexDirection="column">
				<Box marginBottom={2}>
					<Text bold>Export Successful ✓</Text>
				</Box>

				<Alert key="success-alert" variant="success">
					{result.message ?? 'Timesheet successfully exported to SAP S/4HANA'}
				</Alert>

				<Box flexDirection="column" marginTop={2} marginBottom={2}>
					<Text>The data will be available in S/4HANA shortly.</Text>
					<Text color="yellow">
						Remember to release your time sheet in S/4HANA.
					</Text>
				</Box>

				<Box marginTop={1}>
					<Text dimColor>[Q] Back to menu</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Box marginBottom={2}>
				<Text bold>Export Failed ✗</Text>
			</Box>

			<Alert key="error-alert" variant="error">
				Failed to export timesheet to SAP S/4HANA.
			</Alert>

			{result.errors && result.errors.length > 0 && (
				<Box flexDirection="column" marginTop={2}>
					<Text bold color="red">
						Errors:
					</Text>
					{result.errors.map((error, index) => (
						<Text key={`error-${index}`} color="red">
							• {error}
						</Text>
					))}
				</Box>
			)}

			{result.warnings && result.warnings.length > 0 && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold color="yellow">
						Warnings:
					</Text>
					{result.warnings.map((warning, index) => (
						<Text key={`warning-${index}`} color="yellow">
							• {warning}
						</Text>
					))}
				</Box>
			)}

			<Box flexDirection="column" marginTop={2}>
				<Text>Please fix these issues and try again.</Text>
			</Box>

			<Box marginTop={1}>
				<Text dimColor>[Q] Back to menu</Text>
			</Box>
		</Box>
	);
}
