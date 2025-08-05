import React, {useState, useCallback} from 'react';
import {Box} from 'ink';
import type {JiraConfig} from '../jira/types.js';
import {SAPExportService} from '../services/SAPExportService.js';
import type {SAPExportResult} from '../services/SAPExportService.js';
import {MonthYearSelector} from './MonthYearSelector.js';
import type {MonthYearSelection} from './MonthYearSelector.js';
import {SAPExportConfirmation} from './SAPExportConfirmation.js';
import {SAPExportResult as SAPResultComponent} from './SAPExportResult.js';
import LoadingScreen from './LoadingScreen.js';

type SAPExportViewProps = {
	config: JiraConfig;
	onBack: () => void;
};

type ExportStep = 'select-period' | 'confirm' | 'exporting' | 'result';

export function SAPExportView({config, onBack}: SAPExportViewProps) {
	const [step, setStep] = useState<ExportStep>('select-period');
	const [selection, setSelection] = useState<MonthYearSelection | undefined>();
	const [result, setResult] = useState<SAPExportResult | undefined>();

	const sapService = new SAPExportService(config);

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
			const exportResult = await sapService.exportTimesheetLegacy({
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
	}, [selection, config.sap, sapService]);

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
		return <LoadingScreen message="Exporting timesheet to SAP S/4HANA..." />;
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
