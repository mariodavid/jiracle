import type {JiraConfig} from '../jira/types.js';

export type SAPExportRequest = {
	year: number;
	month: number;
	persnr: string;
	commentPrefix?: string;
	removeExistingTimesheets: boolean;
};

export type SAPExportResult = {
	success: boolean;
	message?: string;
	errors?: string[];
	warnings?: string[];
};

export class SAPExportService {
	constructor(private readonly config: JiraConfig) {}

	async exportTimesheet(request: SAPExportRequest): Promise<SAPExportResult> {
		const formData = new URLSearchParams({
			year: request.year.toString(),
			month: request.month.toString(),
			persnr: request.persnr,
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
				const parseResult = this.parseResponse(html);
				// Only use parsed results if they contain meaningful errors (not generic "Unknown response")
				if (
					parseResult.errors &&
					parseResult.errors.length > 0 &&
					!parseResult.errors[0]?.includes('Unknown response from server')
				) {
					return parseResult;
				}

				// Fallback to HTTP status if no specific errors found
				return {
					success: false,
					errors: [`HTTP ${response.status}: ${response.statusText}`],
				};
			}

			return this.parseResponse(html);
		} catch (error: unknown) {
			return {
				success: false,
				errors: [
					`Network error: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`,
				],
			};
		}
	}

	private parseResponse(html: string): SAPExportResult {
		if (html.includes('Timesheet successfully sent to S4/Hana.')) {
			return {
				success: true,
				message: 'Timesheet successfully exported to SAP S/4HANA',
			};
		}

		const errors: string[] = [];
		const warnings: string[] = [];

		// Check for specific error types first
		if (
			html.includes('Please provide the personnel number') ||
			html.includes('Cannot find employee for')
		) {
			errors.push(
				'Personnel number (Persnr) is missing. Please configure in settings.',
			);
		} else {
			// Only parse generic errors if no specific errors were found
			const errorPattern =
				/<div class="aui-message aui-message-error"[^>]*>(.*?)<\/div>/gs;

			let match;
			while ((match = errorPattern.exec(html)) !== null) {
				if (match[1]) {
					errors.push(this.cleanHtml(match[1]));
				}
			}
		}

		// Always parse warnings
		const warningPattern =
			/<div class="aui-message aui-message-warning"[^>]*>(.*?)<\/div>/gs;

		let match;
		while ((match = warningPattern.exec(html)) !== null) {
			if (match[1]) {
				warnings.push(this.cleanHtml(match[1]));
			}
		}

		if (html.includes('No worklogs found')) {
			errors.push('No worklogs found for the selected period.');
		}

		if (errors.length > 0) {
			return {
				success: false,
				errors,
				warnings: warnings.length > 0 ? warnings : undefined,
			};
		}

		return {
			success: false,
			errors: ['Unknown response from server. Export may have failed.'],
		};
	}

	private cleanHtml(html: string): string {
		return html
			.replace(/<[^>]*>/g, '')
			.replace(/\s+/g, ' ')
			.trim();
	}
}
