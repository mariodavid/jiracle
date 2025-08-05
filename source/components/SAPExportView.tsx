import React, {useState, useCallback} from 'react';
import {Box, Text} from 'ink';
import {Spinner} from '@inkjs/ui';
import type {JiraConfig} from '../jira/types.js';
import type {LegacySAPExportResult} from '../domain/SAPExportResult.js';
import {MonthYearSelector} from './MonthYearSelector.js';
import type {MonthYearSelection} from './MonthYearSelector.js';
import {SAPExportConfirmation} from './SAPExportConfirmation.js';
import {SAPExportResult as SAPResultComponent} from './SAPExportResult.js';
import LoadingScreen from './LoadingScreen.js';

type SAPExportViewProps = {
	config: JiraConfig;
	onBack: () => void;
	onExport: (parameters: {
		year: number;
		month: number;
		persnr: string;
		commentPrefix?: string;
		removeExistingTimesheets: boolean;
	}) => Promise<LegacySAPExportResult>;
};

type ExportStep = 'select-period' | 'confirm' | 'exporting' | 'result';

export function SAPExportView({config, onBack, onExport}: SAPExportViewProps) {
	const [step, setStep] = useState<ExportStep>('select-period');
	const [selection, setSelection] = useState<MonthYearSelection | undefined>();
	const [result, setResult] = useState<LegacySAPExportResult | undefined>();

	const handlePeriodSelect = useCallback((selected: MonthYearSelection) => {
		setSelection(selected);
		setStep('confirm');
	}, []);

	const handleConfirm = useCallback(async () => {
		if (!selection || !config.sap) {
			return;
		}

		setStep('exporting');

		try {
			const exportResult = await onExport({
				year: selection.year,
				month: selection.month,
				persnr: config.sap.persnr,
				commentPrefix: config.sap.commentPrefix,
				removeExistingTimesheets: config.sap.removeExistingTimesheets,
			});

			setResult(exportResult);
			setStep('result');
		} catch (error: unknown) {
			setResult({
				success: false,
				errors: [
					`Unexpected error: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`,
				],
			});
			setStep('result');
		}
	}, [selection, config.sap, onExport]);

	const handleCancel = useCallback(() => {
		if (step === 'select-period') {
			onBack();
		} else {
			setStep('select-period');
			setSelection(undefined);
			setResult(undefined);
		}
	}, [step, onBack]);

	const handleBackToMenu = useCallback(() => {
		onBack();
	}, [onBack]);

	if (step === 'select-period') {
		return (
			<Box flexDirection="column">
				<MonthYearSelector
					onSelect={handlePeriodSelect}
					onCancel={handleCancel}
				/>
			</Box>
		);
	}

	if (step === 'confirm' && selection) {
		return (
			<Box flexDirection="column">
				<SAPExportConfirmation
					config={config}
					selection={selection}
					onConfirm={handleConfirm}
					onCancel={handleCancel}
				/>
			</Box>
		);
	}

	if (step === 'exporting') {
		return (
			<Box
				width="100%"
				justifyContent="center"
				alignItems="center"
				paddingY={5}
			>
				<Box flexDirection="row" alignItems="center">
					<Spinner type="dots" />
					<Box marginLeft={1}>
						<Text>Exporting timesheet to SAP S/4HANA...</Text>
					</Box>
				</Box>
			</Box>
		);
	}

	if (step === 'result' && result) {
		return (
			<Box flexDirection="column">
				<SAPResultComponent result={result} onBack={handleBackToMenu} />
			</Box>
		);
	}

	return <LoadingScreen message="Loading..." />;
}
