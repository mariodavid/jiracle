import {useCallback} from 'react';
import type {JiraConfig} from '../jira/types.js';
import {SAPExportService} from '../services/SAPExportService.js';
import type {LegacySAPExportResult} from '../domain/SAPExportResult.js';

export function useSAPExport(config: JiraConfig) {
	const handleExport = useCallback(
		async (parameters: {
			year: number;
			month: number;
			persnr: string;
			commentPrefix?: string;
			removeExistingTimesheets: boolean;
		}): Promise<LegacySAPExportResult> => {
			const sapService = new SAPExportService(config);
			return sapService.exportTimesheetLegacy(parameters);
		},

		[config],
	);

	return {handleExport};
}
