import type {JiraIssue} from '../jira/types.js';
import {CustomFieldAccessor} from './CustomFieldAccessor.js';

export enum BillabilityStatus {
	Billable = 'BILLABLE',
	NonBillable = 'NON_BILLABLE',
}

export class BillabilityRule {
	static create(
		customField?: string,
		billableValues?: string[],
	): BillabilityRule {
		return new BillabilityRule(customField, billableValues);
	}

	static alwaysBillable(): BillabilityRule {
		return new BillabilityRule();
	}

	private constructor(
		private readonly customField?: string,
		private readonly billableValues?: readonly string[],
	) {}

	evaluate(issue: JiraIssue): BillabilityStatus {
		if (!this.customField) {
			return BillabilityStatus.Billable;
		}

		const fieldValue = CustomFieldAccessor.getValue(issue, this.customField);
		return this.determineFromCustomField(fieldValue);
	}

	equals(other: BillabilityRule): boolean {
		if (this.customField !== other.customField) {
			return false;
		}

		if (!this.billableValues && !other.billableValues) {
			return true;
		}

		if (!this.billableValues || !other.billableValues) {
			return false;
		}

		if (this.billableValues.length !== other.billableValues.length) {
			return false;
		}

		return this.billableValues.every(value =>
			other.billableValues!.includes(value),
		);
	}

	private determineFromCustomField(value: unknown): BillabilityStatus {
		if (value === null || value === undefined || value === '') {
			return BillabilityStatus.NonBillable;
		}

		if (this.billableValues && this.billableValues.length > 0) {
			const stringValue = String(value);
			return this.billableValues.includes(stringValue)
				? BillabilityStatus.Billable
				: BillabilityStatus.NonBillable;
		}

		return BillabilityStatus.Billable;
	}
}
