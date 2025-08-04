import test from 'ava';
import {
	BillabilityRule,
	BillabilityStatus,
} from '../../domain/BillabilityRule.js';
import {IssueKey} from '../../domain/IssueKey.js';
import type {JiraIssue} from '../../jira/types.js';

function createTestIssue(customFields: Record<string, any> = {}): JiraIssue {
	return {
		id: '12345',
		key: IssueKey.fromString('TEST-123'),
		fields: {
			summary: 'Test Issue',
			status: {name: 'Open', statusCategory: {name: 'To Do'}},
			issuetype: {name: 'Task', iconUrl: 'icon.png'},
			priority: {name: 'Medium', iconUrl: 'priority.png'},
			assignee: {displayName: 'Test User', emailAddress: 'test@example.com'},
			created: '2023-01-01T00:00:00.000Z',
			updated: '2023-01-01T00:00:00.000Z',
			...customFields,
		},
	};
}

test('BillabilityRule.alwaysBillable returns billable for any issue', t => {
	// EXPLICIT TEST DATA
	const rule = BillabilityRule.alwaysBillable();
	const issue = createTestIssue();

	// OPERATIONS
	const result = rule.evaluate(issue);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, BillabilityStatus.Billable);
});

test('BillabilityRule.create with no custom field returns billable', t => {
	// EXPLICIT TEST DATA
	const rule = BillabilityRule.create();
	const issue = createTestIssue();

	// OPERATIONS
	const result = rule.evaluate(issue);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, BillabilityStatus.Billable);
});

test('BillabilityRule evaluates custom field as non-billable when null', t => {
	// EXPLICIT TEST DATA
	const rule = BillabilityRule.create('customfield_12345');
	const issue = createTestIssue({customfield_12345: null});

	// OPERATIONS
	const result = rule.evaluate(issue);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, BillabilityStatus.NonBillable);
});

test('BillabilityRule evaluates custom field as billable when has value and no specific values', t => {
	// EXPLICIT TEST DATA
	const rule = BillabilityRule.create('customfield_12345');
	const issue = createTestIssue({customfield_12345: 'External Client'});

	// OPERATIONS
	const result = rule.evaluate(issue);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, BillabilityStatus.Billable);
});

test('BillabilityRule evaluates specific values correctly when match found', t => {
	// EXPLICIT TEST DATA
	const rule = BillabilityRule.create('customfield_12345', [
		'External Client',
		'Partner',
	]);
	const issue = createTestIssue({customfield_12345: 'External Client'});

	// OPERATIONS
	const result = rule.evaluate(issue);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, BillabilityStatus.Billable);
});

test('BillabilityRule evaluates specific values correctly when no match found', t => {
	// EXPLICIT TEST DATA
	const rule = BillabilityRule.create('customfield_12345', [
		'External Client',
		'Partner',
	]);
	const issue = createTestIssue({customfield_12345: 'Internal Meeting'});

	// OPERATIONS
	const result = rule.evaluate(issue);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, BillabilityStatus.NonBillable);
});

test('BillabilityRule equals works correctly for same rules', t => {
	// EXPLICIT TEST DATA
	const rule1 = BillabilityRule.create('customfield_12345', [
		'External',
		'Partner',
	]);
	const rule2 = BillabilityRule.create('customfield_12345', [
		'External',
		'Partner',
	]);

	// OPERATIONS
	const result = rule1.equals(rule2);

	// SPECIFIC VALUE COMPARISONS
	t.true(result);
});

test('BillabilityRule equals returns false for different custom fields', t => {
	// EXPLICIT TEST DATA
	const rule1 = BillabilityRule.create('customfield_12345');
	const rule2 = BillabilityRule.create('customfield_67890');

	// OPERATIONS
	const result = rule1.equals(rule2);

	// SPECIFIC VALUE COMPARISONS
	t.false(result);
});
