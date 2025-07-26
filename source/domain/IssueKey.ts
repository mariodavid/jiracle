/**
 * Domain value object for Jira issue keys
 * Encapsulates issue key validation, parsing, and formatting logic
 */
export class IssueKey {
	/**
	 * Create IssueKey from string and throw if invalid
	 */
	static fromString(key: string): IssueKey {
		if (!key || typeof key !== 'string' || key.trim() === '') {
			throw new Error('Issue key is required and cannot be empty');
		}

		const trimmedKey = key.trim();
		if (!IssueKey.issueKeyRegex.test(trimmedKey)) {
			throw new Error(
				`Invalid issue key format: "${trimmedKey}". Expected format: PROJECT-123 (e.g., DEF-123, ABC-456)`,
			);
		}

		const upperKey = trimmedKey.toUpperCase();
		const [project, numberString] = upperKey.split('-');
		const number = Number(numberString);

		return new IssueKey(project!, number);
	}

	/**
	 * Try to parse issue key string, return undefined if invalid
	 */
	static tryParse(key: string): IssueKey | undefined {
		try {
			return IssueKey.fromString(key);
		} catch {
			return undefined;
		}
	}

	/**
	 * Check if string is a valid issue key format
	 */
	static isValid(key: string): boolean {
		return IssueKey.tryParse(key) !== undefined;
	}

	private static get issueKeyRegex(): RegExp {
		return /^[a-z]+-\d+$/i;
	}

	private constructor(
		private readonly project: string,
		private readonly number: number,
	) {}

	/**
	 * Get the project prefix (e.g., "PROJ" from "PROJ-123")
	 */
	getProject(): string {
		return this.project;
	}

	/**
	 * Get the issue number (e.g., 123 from "PROJ-123")
	 */
	getNumber(): number {
		return this.number;
	}

	/**
	 * Format as standard issue key string (e.g., "PROJ-123")
	 */
	toString(): string {
		return `${this.project}-${this.number}`;
	}

	/**
	 * Check if this issue key equals another issue key
	 */
	equals(other: IssueKey): boolean {
		return this.project === other.project && this.number === other.number;
	}

	/**
	 * Check if this issue key matches a pattern
	 * Supports wildcards: "PROJ-*", "*-123", or exact match
	 */
	matches(pattern: string): boolean {
		if (!pattern || typeof pattern !== 'string') {
			return false;
		}

		const normalizedPattern = pattern.trim().toUpperCase();
		const issueKeyString = this.toString();

		// Exact match
		if (normalizedPattern === issueKeyString) {
			return true;
		}

		// Wildcard patterns
		if (normalizedPattern.includes('*')) {
			const regexPattern = normalizedPattern
				.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
				.replace(/\\\*/g, '.*'); // Convert * to .*

			const regex = new RegExp(`^${regexPattern}$`);
			return regex.test(issueKeyString);
		}

		return false;
	}

	/**
	 * Check if this issue belongs to the specified project
	 */
	belongsToProject(projectKey: string): boolean {
		if (!projectKey || typeof projectKey !== 'string') {
			return false;
		}

		return this.project === projectKey.trim().toUpperCase();
	}
}
