import type {SAPResponse} from './SAPResponse.js';

export abstract class SAPExportResult {
	static success(message?: string): SAPExportSuccess {
		return new SAPExportSuccess(message);
	}

	static failure(errors: string[], warnings?: string[]): SAPExportFailure {
		return new SAPExportFailure(errors, warnings);
	}

	static fromSAPResponse(response: SAPResponse): SAPExportResult {
		if (response.isSuccess()) {
			return SAPExportResult.success(
				'Timesheet successfully exported to SAP S/4HANA',
			);
		}

		const errors = response.extractErrors();
		const warnings = response.extractWarnings();

		if (response.hasPersonnelNumberError()) {
			return SAPExportResult.failure([
				'Personnel number (Persnr) is missing. Please configure in settings.',
			]);
		}

		if (response.hasNoWorklogsError()) {
			return SAPExportResult.failure([
				'No worklogs found for the selected period.',
			]);
		}

		if (errors.length > 0) {
			return SAPExportResult.failure(
				errors,
				warnings.length > 0 ? warnings : undefined,
			);
		}

		return SAPExportResult.failure([
			'Unknown response from server. Export may have failed.',
		]);
	}

	static fromNetworkError(error: Error): SAPExportFailure {
		return SAPExportResult.failure([`Network error: ${error.message}`]);
	}

	static fromHttpError(status: number, statusText: string): SAPExportFailure {
		return SAPExportResult.failure([`HTTP ${status}: ${statusText}`]);
	}

	abstract isSuccess(): boolean;
	abstract isFailure(): boolean;
	abstract getMessage(): string | undefined;
}

export class SAPExportSuccess extends SAPExportResult {
	constructor(private readonly message?: string) {
		super();
	}

	isSuccess(): boolean {
		return true;
	}

	isFailure(): boolean {
		return false;
	}

	getMessage(): string | undefined {
		return this.message;
	}

	getSuccessMessage(): string {
		return this.message ?? 'Export completed successfully';
	}
}

export class SAPExportFailure extends SAPExportResult {
	constructor(
		private readonly errors: string[],
		private readonly warnings?: string[],
	) {
		super();
	}

	isSuccess(): boolean {
		return false;
	}

	isFailure(): boolean {
		return true;
	}

	getMessage(): string | undefined {
		return this.errors[0];
	}

	getErrors(): string[] {
		return [...this.errors];
	}

	getWarnings(): string[] {
		return this.warnings ? [...this.warnings] : [];
	}

	hasWarnings(): boolean {
		return Boolean(this.warnings && this.warnings.length > 0);
	}

	getErrorCount(): number {
		return this.errors.length;
	}

	getWarningCount(): number {
		return this.warnings?.length ?? 0;
	}

	getAllMessages(): string[] {
		const messages = [...this.errors];
		if (this.warnings) {
			messages.push(...this.warnings);
		}

		return messages;
	}
}

// Legacy compatibility type for existing code
export type LegacySAPExportResult = {
	success: boolean;
	message?: string;
	errors?: string[];
	warnings?: string[];
};

export function toLegacyResult(result: SAPExportResult): LegacySAPExportResult {
	if (result.isSuccess()) {
		const success = result as SAPExportSuccess;
		return {
			success: true,
			message: success.getMessage(),
		};
	}

	const failure = result as SAPExportFailure;
	return {
		success: false,
		errors: failure.getErrors(),
		warnings: failure.hasWarnings() ? failure.getWarnings() : undefined,
	};
}
