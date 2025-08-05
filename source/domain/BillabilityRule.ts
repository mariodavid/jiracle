import type {JiraIssue} from '../jira/types.js';
import {uiLogger} from '../utils/logger.js';
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
		uiLogger.debug('BillabilityRule: Evaluating custom field', {
			customField: this.customField,
			value,
			valueType: typeof value,
			billableValues: this.billableValues,
		});

		if (value === null || value === undefined || value === '') {
			return BillabilityStatus.NonBillable;
		}

		if (this.billableValues && this.billableValues.length > 0) {
			const stringValue = String(value);
			const isBillable = this.billableValues.includes(stringValue);

			uiLogger.debug('BillabilityRule: Specific values check', {
				stringValue,
				billableValues: this.billableValues,
				isBillable,
			});

			return isBillable
				? BillabilityStatus.Billable
				: BillabilityStatus.NonBillable;
		}

		return BillabilityStatus.Billable;
	}
}
