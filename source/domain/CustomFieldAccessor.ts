import type {JiraIssue, JiraIssueField} from '../jira/types.js';

export class CustomFieldAccessor {
	static getValue<T = unknown>(
		issue: JiraIssue,
		fieldKey: string,
	): T | undefined {
		const accessor = new CustomFieldAccessor();
		accessor.validateFieldKey(fieldKey);
		return accessor.extractValue<T>(issue.fields, fieldKey);
	}

	static getStringValue(
		issue: JiraIssue,
		fieldKey: string,
	): string | undefined {
		const value = this.getValue(issue, fieldKey);
		if (value === null || value === undefined) {
			return undefined;
		}

		return String(value);
	}

	static hasValue(issue: JiraIssue, fieldKey: string): boolean {
		const value = this.getValue(issue, fieldKey);
		return value !== null && value !== undefined && value !== '';
	}

	private validateFieldKey(fieldKey: string): void {
		if (!fieldKey) {
			throw new Error('Field key cannot be empty');
		}

		if (!fieldKey.startsWith('customfield_')) {
			throw new Error(
				`Invalid custom field key: ${fieldKey}. Custom fields must start with 'customfield_'`,
			);
		}

		const fieldNumber = fieldKey.slice('customfield_'.length);
		if (!/^\d+$/.test(fieldNumber)) {
			throw new Error(
				`Invalid custom field key: ${fieldKey}. Field number must be numeric`,
			);
		}
	}

	private extractValue<T>(
		fields: JiraIssueField,
		fieldKey: string,
	): T | undefined {
		const fieldsRecord = fields as Record<string, unknown>;
		const value = fieldsRecord[fieldKey];

		if (value === null || value === undefined) {
			return undefined;
		}

		return value as T;
	}
}
