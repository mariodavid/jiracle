export class SAPResponse {
	private static get SUCCESS_INDICATOR() {
		return 'successfully sent to S4/Hana';
	}

	private static get ERROR_PATTERN() {
		return /<div class="aui-message aui-message-error"[^>]*>(.*?)<\/div>/gs;
	}

	private static get WARNING_PATTERN() {
		return /<div class="aui-message aui-message-warning"[^>]*>(.*?)<\/div>/gs;
	}

	constructor(private readonly html: string) {}

	isSuccess(): boolean {
		return this.html.includes(SAPResponse.SUCCESS_INDICATOR);
	}

	extractErrors(): string[] {
		const errors: string[] = [];
		const errorPattern = SAPResponse.ERROR_PATTERN;

		let match;
		while ((match = errorPattern.exec(this.html)) !== null) {
			if (match[1]) {
				errors.push(this.cleanHtml(match[1]));
			}
		}

		return errors;
	}

	extractWarnings(): string[] {
		const warnings: string[] = [];
		const warningPattern = SAPResponse.WARNING_PATTERN;

		let match;
		while ((match = warningPattern.exec(this.html)) !== null) {
			if (match[1]) {
				warnings.push(this.cleanHtml(match[1]));
			}
		}

		return warnings;
	}

	hasPersonnelNumberError(): boolean {
		return (
			this.html.includes('Please provide the personnel number') ||
			this.html.includes('Cannot find employee for')
		);
	}

	hasNoWorklogsError(): boolean {
		return this.html.includes('No worklogs found');
	}

	getRawHtml(): string {
		return this.html;
	}

	isEmpty(): boolean {
		return this.html.trim().length === 0;
	}

	containsText(text: string): boolean {
		return this.html.includes(text);
	}

	private cleanHtml(html: string): string {
		return html
			.replace(/<[^>]*>/g, '') // Remove HTML tags
			.replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
			.replace(/&amp;/g, '&') // Replace HTML entities
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/\s+/g, ' ') // Normalize whitespace
			.trim();
	}
}
