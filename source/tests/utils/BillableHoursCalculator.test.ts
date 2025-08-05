import test from 'ava';
import {
	BillableHoursCalculator,
	type WorklogWithIssue,
} from '../../utils/BillableHoursCalculator.js';
import type {JiraIssue, BonusConfig, WorklogEntry} from '../../jira/types.js';
import {IssueKey} from '../../domain/IssueKey.js';

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

function createTestWorklog(timeSpentSeconds: number): WorklogEntry {
	return {
		id: '67890',
		issueId: '12345',
		author: {displayName: 'Test User', emailAddress: 'test@example.com'},
		comment: 'Test worklog',
		started: '2023-01-01T09:00:00.000Z',
		timeSpentSeconds,
	};
}

function createTestBonusConfig(
	overrides: Partial<BonusConfig> = {},
): BonusConfig {
	return {
		enabled: true,
		hoursPerBonusDay: 8,
		targetDays: 200,
		targetAmount: 10_000,
		currency: 'EUR',
		targets: {
			minimum: {days: 150, label: 'Minimum', percentage: 75},
			standard: {days: 200, label: 'Standard', percentage: 100},
			stretch: {days: 220, label: 'Stretch', percentage: 110},
			maximum: {days: 240, label: 'Maximum', percentage: 120},
		},
		...overrides,
	};
}

test('isBillableWorklog - returns true when no custom field configured', t => {
	// EXPLICIT TEST DATA
	const issue = createTestIssue();
	const bonusConfig = createTestBonusConfig();

	// OPERATIONS
	const result = BillableHoursCalculator.isBillableWorklog(issue, bonusConfig);

	// SPECIFIC VALUE COMPARISONS
	t.true(result);
});

test('isBillableWorklog - returns true when custom field has non-empty value and no specific values configured', t => {
	// EXPLICIT TEST DATA
	const issue = createTestIssue({customfield_12345: 'External Client'});
	const bonusConfig = createTestBonusConfig({
		billableCustomField: 'customfield_12345',
	});

	// OPERATIONS
	const result = BillableHoursCalculator.isBillableWorklog(issue, bonusConfig);

	// SPECIFIC VALUE COMPARISONS
	t.true(result);
});

test('isBillableWorklog - returns false when custom field is null', t => {
	// EXPLICIT TEST DATA
	const issue = createTestIssue({customfield_12345: null});
	const bonusConfig = createTestBonusConfig({
		billableCustomField: 'customfield_12345',
	});

	// OPERATIONS
	const result = BillableHoursCalculator.isBillableWorklog(issue, bonusConfig);

	// SPECIFIC VALUE COMPARISONS
	t.false(result);
});

test('isBillableWorklog - returns false when custom field is empty string', t => {
	// EXPLICIT TEST DATA
	const issue = createTestIssue({customfield_12345: ''});
	const bonusConfig = createTestBonusConfig({
		billableCustomField: 'customfield_12345',
	});

	// OPERATIONS
	const result = BillableHoursCalculator.isBillableWorklog(issue, bonusConfig);

	// SPECIFIC VALUE COMPARISONS
	t.false(result);
});

test('isBillableWorklog - returns true when custom field value matches billable values', t => {
	// EXPLICIT TEST DATA
	const issue = createTestIssue({customfield_12345: 'External Client'});
	const bonusConfig = createTestBonusConfig({
		billableCustomField: 'customfield_12345',
		billableValues: ['External Client', 'Partner Project'],
	});

	// OPERATIONS
	const result = BillableHoursCalculator.isBillableWorklog(issue, bonusConfig);

	// SPECIFIC VALUE COMPARISONS
	t.true(result);
});

test('isBillableWorklog - returns false when custom field value does not match billable values', t => {
	// EXPLICIT TEST DATA
	const issue = createTestIssue({customfield_12345: 'Internal Meeting'});
	const bonusConfig = createTestBonusConfig({
		billableCustomField: 'customfield_12345',
		billableValues: ['External Client', 'Partner Project'],
	});

	// OPERATIONS
	const result = BillableHoursCalculator.isBillableWorklog(issue, bonusConfig);

	// SPECIFIC VALUE COMPARISONS
	t.false(result);
});

test('calculateBillableHours - returns total hours when no custom field configured', t => {
	// EXPLICIT TEST DATA
	const worklogsWithIssues: WorklogWithIssue[] = [
		{worklog: createTestWorklog(3600), issue: createTestIssue()}, // 1 hour
		{worklog: createTestWorklog(7200), issue: createTestIssue()}, // 2 hours
	];
	const bonusConfig = createTestBonusConfig();
	const expectedHours = 3;

	// OPERATIONS
	const result = BillableHoursCalculator.calculateBillableHours(
		worklogsWithIssues,
		bonusConfig,
	);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedHours);
});

test('calculateBillableHours - filters only billable worklogs', t => {
	// EXPLICIT TEST DATA
	const worklogsWithIssues: WorklogWithIssue[] = [
		{
			worklog: createTestWorklog(3600),
			issue: createTestIssue({customfield_12345: 'External Client'}),
		}, // 1 hour - billable
		{
			worklog: createTestWorklog(7200),
			issue: createTestIssue({customfield_12345: null}),
		}, // 2 hours - non-billable
		{
			worklog: createTestWorklog(1800),
			issue: createTestIssue({customfield_12345: 'Partner Project'}),
		}, // 0.5 hours - billable
	];
	const bonusConfig = createTestBonusConfig({
		billableCustomField: 'customfield_12345',
		billableValues: ['External Client', 'Partner Project'],
	});
	const expectedHours = 1.5;

	// OPERATIONS
	const result = BillableHoursCalculator.calculateBillableHours(
		worklogsWithIssues,
		bonusConfig,
	);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedHours);
});

test('calculateNonBillableHours - returns zero when no custom field configured', t => {
	// EXPLICIT TEST DATA
	const worklogsWithIssues: WorklogWithIssue[] = [
		{worklog: createTestWorklog(3600), issue: createTestIssue()}, // 1 hour
		{worklog: createTestWorklog(7200), issue: createTestIssue()}, // 2 hours
	];
	const bonusConfig = createTestBonusConfig();
	const expectedHours = 0;

	// OPERATIONS
	const result = BillableHoursCalculator.calculateNonBillableHours(
		worklogsWithIssues,
		bonusConfig,
	);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedHours);
});

test('calculateNonBillableHours - filters only non-billable worklogs', t => {
	// EXPLICIT TEST DATA
	const worklogsWithIssues: WorklogWithIssue[] = [
		{
			worklog: createTestWorklog(3600),
			issue: createTestIssue({customfield_12345: 'External Client'}),
		}, // 1 hour - billable
		{
			worklog: createTestWorklog(7200),
			issue: createTestIssue({customfield_12345: null}),
		}, // 2 hours - non-billable
		{
			worklog: createTestWorklog(1800),
			issue: createTestIssue({customfield_12345: 'Internal Meeting'}),
		}, // 0.5 hours - non-billable
	];
	const bonusConfig = createTestBonusConfig({
		billableCustomField: 'customfield_12345',
		billableValues: ['External Client', 'Partner Project'],
	});
	const expectedHours = 2.5;

	// OPERATIONS
	const result = BillableHoursCalculator.calculateNonBillableHours(
		worklogsWithIssues,
		bonusConfig,
	);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedHours);
});

test('calculateTotalHours - sums all worklog hours', t => {
	// EXPLICIT TEST DATA
	const worklogsWithIssues: WorklogWithIssue[] = [
		{worklog: createTestWorklog(3600), issue: createTestIssue()}, // 1 hour
		{worklog: createTestWorklog(7200), issue: createTestIssue()}, // 2 hours
		{worklog: createTestWorklog(1800), issue: createTestIssue()}, // 0.5 hours
	];
	const expectedHours = 3.5;

	// OPERATIONS
	const result =
		BillableHoursCalculator.calculateTotalHours(worklogsWithIssues);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedHours);
});

test('calculateBillableHours - returns total hours when bonus disabled', t => {
	// EXPLICIT TEST DATA
	const worklogsWithIssues: WorklogWithIssue[] = [
		{
			worklog: createTestWorklog(3600),
			issue: createTestIssue({customfield_12345: null}),
		}, // 1 hour - would be non-billable
		{
			worklog: createTestWorklog(7200),
			issue: createTestIssue({customfield_12345: 'External'}),
		}, // 2 hours - would be billable
	];
	const bonusConfig = createTestBonusConfig({
		enabled: false,
		billableCustomField: 'customfield_12345',
		billableValues: ['External'],
	});
	const expectedHours = 3;

	// OPERATIONS
	const result = BillableHoursCalculator.calculateBillableHours(
		worklogsWithIssues,
		bonusConfig,
	);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedHours);
});
