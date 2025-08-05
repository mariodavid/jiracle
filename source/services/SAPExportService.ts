import type {JiraConfig} from '../jira/types.js';
import {MonthYear} from '../domain/MonthYear.js';
import {PersonnelNumber} from '../domain/PersonnelNumber.js';
import {ExportPeriod} from '../domain/ExportPeriod.js';
import {SAPResponse} from '../domain/SAPResponse.js';
import {
	SAPExportResult,
	type LegacySAPExportResult,
	toLegacyResult,
} from '../domain/SAPExportResult.js';

export type SAPExportRequest = {
	period: ExportPeriod;
	personnelNumber: PersonnelNumber;
	commentPrefix?: string;
	removeExistingTimesheets: boolean;
};

// Legacy compatibility - keep the old type for existing code
export type LegacySAPExportRequest = {
	year: number;
	month: number;
	persnr: string;
	commentPrefix?: string;
	removeExistingTimesheets: boolean;
};

// Legacy compatibility - re-export as the old name
export {type LegacySAPExportResult as SAPExportResult} from '../domain/SAPExportResult.js';

export class SAPExportService {
	constructor(private readonly config: JiraConfig) {}

	async exportTimesheet(
		request: SAPExportRequest,
	): Promise<LegacySAPExportResult> {
		const monthYear = request.period.getMonthYear();
		if (!monthYear) {
			return {
				success: false,
				errors: ['Export period must be within a single month'],
			};
		}

		const formData = new URLSearchParams({
			year: monthYear.getYear().toString(),
			month: monthYear.getMonth().toString(),
			persnr: request.personnelNumber.toString(),
			'comment-prefix': request.commentPrefix ?? '',
			's4-delete': request.removeExistingTimesheets
				? 'removeExistingTimesheets'
				: '',
			'export-s4': 'Send to S4/Hana',
		});

		try {
			const response = await fetch(
				`${this.config.jiraUrl}/plugins/servlet/timesheet`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						Authorization: `Bearer ${this.config.apiToken}`,
					},
					body: formData,
				},
			);

			const html = await response.text();

			if (!response.ok) {
				// Parse HTML even for error responses to extract specific error messages
				const sapResponse = new SAPResponse(html);
				const result = SAPExportResult.fromSAPResponse(sapResponse);
				const legacyResult = toLegacyResult(result);

				// Only use parsed results if they contain meaningful errors (not generic "Unknown response")
				if (
					legacyResult.errors &&
					legacyResult.errors.length > 0 &&
					!legacyResult.errors[0]?.includes('Unknown response from server')
				) {
					return legacyResult;
				}

				// Fallback to HTTP status if no specific errors found
				const httpError = SAPExportResult.fromHttpError(
					response.status,
					response.statusText,
				);
				return toLegacyResult(httpError);
			}

			const sapResponse = new SAPResponse(html);
			const result = SAPExportResult.fromSAPResponse(sapResponse);
			return toLegacyResult(result);
		} catch (error: unknown) {
			const networkError = SAPExportResult.fromNetworkError(
				error instanceof Error ? error : new Error('Unknown error'),
			);
			return toLegacyResult(networkError);
		}
	}

	// Legacy compatibility method for existing code
	async exportTimesheetLegacy(
		request: LegacySAPExportRequest,
	): Promise<LegacySAPExportResult> {
		// Validate personnel number first for legacy compatibility
		if (!request.persnr || !PersonnelNumber.isValid(request.persnr)) {
			return {
				success: false,
				errors: [
					'Personnel number (Persnr) is missing. Please configure in settings.',
				],
			};
		}

		const monthYear = new MonthYear(request.year, request.month);
		const period = ExportPeriod.forMonth(monthYear);
		const personnelNumber = PersonnelNumber.fromString(request.persnr);

		const modernRequest: SAPExportRequest = {
			period,
			personnelNumber,
			commentPrefix: request.commentPrefix,
			removeExistingTimesheets: request.removeExistingTimesheets,
		};

		return this.exportTimesheet(modernRequest);
	}
}
