import test from 'ava';
import {WorklogTransferService} from '../../services/WorklogTransferService.js';
import {WorklogEntry} from '../../domain/WorklogEntry.js';
import {IssueKey} from '../../domain/IssueKey.js';
import {LocalDate} from '../../domain/LocalDate.js';
import type {JiraClient} from '../../jira/client.js';
import type {WorklogResponse} from '../../jira/types.js';

// Mock JiraClient for testing
class MockJiraClient {
	private mockWorklogs: WorklogEntry[] = [];
	private readonly mockIssues = new Set<string>();
	private createdWorklogs: Array<{issueKey: string; worklog: any}> = [];
	private deletedWorklogs: Array<{issueKey: string; worklogId: string}> = [];

	setMockWorklogs(worklogs: WorklogEntry[]): void {
		this.mockWorklogs = worklogs;
	}

	setMockIssueExists(issueKey: string, exists = true): void {
		if (exists) {
			this.mockIssues.add(issueKey);
		} else {
			this.mockIssues.delete(issueKey);
		}
	}

	getCreatedWorklogs(): Array<{issueKey: string; worklog: any}> {
		return this.createdWorklogs;
	}

	getDeletedWorklogs(): Array<{issueKey: string; worklogId: string}> {
		return this.deletedWorklogs;
	}

	clearHistory(): void {
		this.createdWorklogs = [];
		this.deletedWorklogs = [];
	}

	async fetchIssue(issueKey: IssueKey): Promise<any> {
		if (!this.mockIssues.has(issueKey.toString())) {
			throw new Error(`Issue ${issueKey.toString()} not found`);
		}

		return {key: issueKey.toString()};
	}

	async getIssueWorklogs(issueKey: string): Promise<WorklogResponse> {
		const worklogs = this.mockWorklogs
			.filter(w => w.issueKey.toString() === issueKey)
			.map(w => ({
				id: w.id,
				issueId: '12345',
				author: w.author,
				comment: w.comment,
				started: w.date.toISOString() + 'T10:00:00.000+0100',
				timeSpentSeconds: w.duration,
			}));

		return {
			startAt: 0,
			maxResults: 20,
			total: worklogs.length,
			worklogs,
		};
	}

	async addWorklog(issueKey: string, worklogData: any): Promise<void> {
		this.createdWorklogs.push({issueKey, worklog: worklogData});
	}

	async deleteWorklog(issueKey: string, worklogId: string): Promise<void> {
		this.deletedWorklogs.push({issueKey, worklogId});
	}

	async getCurrentUser(): Promise<{emailAddress: string}> {
		return {emailAddress: 'test@example.com'};
	}
}

test('WorklogTransferService - successful transfer with single worklog', async t => {
	// EXPLICIT TEST DATA
	const sourceIssueKey = 'PROJ-123';
	const targetIssueKey = 'PROJ-456';
	const currentUserEmail = 'test@example.com';

	const testWorklog = WorklogEntry.create({
		issueKey: IssueKey.fromString(sourceIssueKey),
		duration: 7200, // 2 hours
		comment: 'Test worklog for transfer',
		date: LocalDate.fromString('2026-01-09'),
		author: {displayName: 'Test User', emailAddress: currentUserEmail},
	});

	const expectedStats = {
		sourceWorklogsFound: 1,
		worklogsToTransfer: 1,
		worklogsTransferred: 1,
		worklogsDeleted: 1,
		errors: [],
	};

	// OPERATIONS
	const mockClient = new MockJiraClient();
	mockClient.setMockWorklogs([testWorklog]);
	mockClient.setMockIssueExists(sourceIssueKey);
	mockClient.setMockIssueExists(targetIssueKey);

	const service = new WorklogTransferService(
		mockClient as unknown as JiraClient,
		currentUserEmail,
	);

	const result = await service.transferWorklogs(sourceIssueKey, targetIssueKey);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.stats.sourceWorklogsFound, expectedStats.sourceWorklogsFound);
	t.is(result.stats.worklogsToTransfer, expectedStats.worklogsToTransfer);
	t.is(result.stats.worklogsTransferred, expectedStats.worklogsTransferred);
	t.is(result.stats.worklogsDeleted, expectedStats.worklogsDeleted);
	t.is(result.stats.errors.length, expectedStats.errors.length);

	t.is(result.transferredWorklogs.length, 1);
	t.is(result.transferredWorklogs[0]?.action, 'deleted');
	t.is(result.transferredWorklogs[0]?.comment, 'Test worklog for transfer');
	t.is(result.transferredWorklogs[0]?.duration, '2h');

	// Verify API calls
	const createdWorklogs = mockClient.getCreatedWorklogs();
	const deletedWorklogs = mockClient.getDeletedWorklogs();

	t.is(createdWorklogs.length, 1);
	t.is(createdWorklogs[0]?.issueKey, targetIssueKey);
	t.is(createdWorklogs[0]?.worklog.comment, 'Test worklog for transfer');

	t.is(deletedWorklogs.length, 1);
	t.is(deletedWorklogs[0]?.issueKey, sourceIssueKey);
	t.is(deletedWorklogs[0]?.worklogId, testWorklog.id);
});

test('WorklogTransferService - dry run mode does not make changes', async t => {
	// EXPLICIT TEST DATA
	const sourceIssueKey = 'PROJ-123';
	const targetIssueKey = 'PROJ-456';
	const currentUserEmail = 'test@example.com';

	const testWorklog = WorklogEntry.create({
		issueKey: IssueKey.fromString(sourceIssueKey),
		duration: 3600, // 1 hour
		comment: 'Test worklog for dry run',
		date: LocalDate.fromString('2026-01-10'),
		author: {displayName: 'Test User', emailAddress: currentUserEmail},
	});

	const expectedStats = {
		sourceWorklogsFound: 1,
		worklogsToTransfer: 1,
		worklogsTransferred: 0,
		worklogsDeleted: 0,
		errors: [],
	};

	// OPERATIONS
	const mockClient = new MockJiraClient();
	mockClient.setMockWorklogs([testWorklog]);
	mockClient.setMockIssueExists(sourceIssueKey);
	mockClient.setMockIssueExists(targetIssueKey);

	const service = new WorklogTransferService(
		mockClient as unknown as JiraClient,
		currentUserEmail,
	);

	const result = await service.transferWorklogs(
		sourceIssueKey,
		targetIssueKey,
		{dryRun: true},
	);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.stats.sourceWorklogsFound, expectedStats.sourceWorklogsFound);
	t.is(result.stats.worklogsToTransfer, expectedStats.worklogsToTransfer);
	t.is(result.stats.worklogsTransferred, expectedStats.worklogsTransferred);
	t.is(result.stats.worklogsDeleted, expectedStats.worklogsDeleted);
	t.is(result.stats.errors.length, expectedStats.errors.length);

	t.is(result.transferredWorklogs.length, 1);
	t.is(result.transferredWorklogs[0]?.action, 'skipped');
	t.is(result.transferredWorklogs[0]?.reason, 'Dry run mode');

	// Verify no API calls were made
	const createdWorklogs = mockClient.getCreatedWorklogs();
	const deletedWorklogs = mockClient.getDeletedWorklogs();

	t.is(createdWorklogs.length, 0);
	t.is(deletedWorklogs.length, 0);
});

test('WorklogTransferService - filters worklogs by current user', async t => {
	// EXPLICIT TEST DATA
	const sourceIssueKey = 'PROJ-123';
	const targetIssueKey = 'PROJ-456';
	const currentUserEmail = 'test@example.com';
	const otherUserEmail = 'other@example.com';

	const userWorklog = WorklogEntry.create({
		issueKey: IssueKey.fromString(sourceIssueKey),
		duration: 3600,
		comment: 'My worklog',
		date: LocalDate.fromString('2026-01-09'),
		author: {displayName: 'Test User', emailAddress: currentUserEmail},
	});

	const otherUserWorklog = WorklogEntry.create({
		issueKey: IssueKey.fromString(sourceIssueKey),
		duration: 7200,
		comment: 'Other users worklog',
		date: LocalDate.fromString('2026-01-09'),
		author: {displayName: 'Other User', emailAddress: otherUserEmail},
	});

	const expectedStats = {
		sourceWorklogsFound: 2,
		worklogsToTransfer: 1, // Only current user's worklog
		worklogsTransferred: 1,
		worklogsDeleted: 1,
		errors: [],
	};

	// OPERATIONS
	const mockClient = new MockJiraClient();
	mockClient.setMockWorklogs([userWorklog, otherUserWorklog]);
	mockClient.setMockIssueExists(sourceIssueKey);
	mockClient.setMockIssueExists(targetIssueKey);

	const service = new WorklogTransferService(
		mockClient as unknown as JiraClient,
		currentUserEmail,
	);

	const result = await service.transferWorklogs(
		sourceIssueKey,
		targetIssueKey,
		{currentUserOnly: true},
	);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.stats.sourceWorklogsFound, expectedStats.sourceWorklogsFound);
	t.is(result.stats.worklogsToTransfer, expectedStats.worklogsToTransfer);
	t.is(result.stats.worklogsTransferred, expectedStats.worklogsTransferred);
	t.is(result.stats.worklogsDeleted, expectedStats.worklogsDeleted);

	t.is(result.transferredWorklogs.length, 1);
	t.is(result.transferredWorklogs[0]?.comment, 'My worklog');

	// Verify only user's worklog was transferred
	const createdWorklogs = mockClient.getCreatedWorklogs();
	t.is(createdWorklogs.length, 1);
	t.is(createdWorklogs[0]?.worklog.comment, 'My worklog');
});

test('WorklogTransferService - handles source issue not found error', async t => {
	// EXPLICIT TEST DATA
	const sourceIssueKey = 'NONEXISTENT-123';
	const targetIssueKey = 'PROJ-456';
	const currentUserEmail = 'test@example.com';

	const expectedErrorMessage =
		'Source issue NONEXISTENT-123 not found or not accessible';

	// OPERATIONS
	const mockClient = new MockJiraClient();
	mockClient.setMockIssueExists(targetIssueKey);
	// Source issue is NOT set as existing

	const service = new WorklogTransferService(
		mockClient as unknown as JiraClient,
		currentUserEmail,
	);

	const result = await service.transferWorklogs(sourceIssueKey, targetIssueKey);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.stats.errors.length, 1);
	t.true(result.stats.errors[0]?.includes(expectedErrorMessage) ?? false);
	t.is(result.stats.worklogsTransferred, 0);
	t.is(result.transferredWorklogs.length, 0);
});

test('WorklogTransferService - handles target issue not found error', async t => {
	// EXPLICIT TEST DATA
	const sourceIssueKey = 'PROJ-123';
	const targetIssueKey = 'NONEXISTENT-456';
	const currentUserEmail = 'test@example.com';

	const expectedErrorMessage =
		'Target issue NONEXISTENT-456 not found or not accessible';

	// OPERATIONS
	const mockClient = new MockJiraClient();
	mockClient.setMockIssueExists(sourceIssueKey);
	// Target issue is NOT set as existing

	const service = new WorklogTransferService(
		mockClient as unknown as JiraClient,
		currentUserEmail,
	);

	const result = await service.transferWorklogs(sourceIssueKey, targetIssueKey);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.stats.errors.length, 1);
	t.true(result.stats.errors[0]?.includes(expectedErrorMessage) ?? false);
	t.is(result.stats.worklogsTransferred, 0);
	t.is(result.transferredWorklogs.length, 0);
});

test('WorklogTransferService - handles same source and target issue', async t => {
	// EXPLICIT TEST DATA
	const sameIssueKey = 'PROJ-123';
	const currentUserEmail = 'test@example.com';

	// OPERATIONS
	const mockClient = new MockJiraClient();
	mockClient.setMockIssueExists(sameIssueKey);
	mockClient.setMockWorklogs([]); // No worklogs

	const service = new WorklogTransferService(
		mockClient as unknown as JiraClient,
		currentUserEmail,
	);

	const result = await service.transferWorklogs(sameIssueKey, sameIssueKey);

	// SPECIFIC VALUE COMPARISONS
	// Should still process (validation happens in CLI layer)
	t.is(result.stats.errors.length, 0);
	t.is(result.stats.worklogsToTransfer, 0);
});

test('WorklogTransferService - handles empty worklog list', async t => {
	// EXPLICIT TEST DATA
	const sourceIssueKey = 'PROJ-123';
	const targetIssueKey = 'PROJ-456';
	const currentUserEmail = 'test@example.com';

	const expectedStats = {
		sourceWorklogsFound: 0,
		worklogsToTransfer: 0,
		worklogsTransferred: 0,
		worklogsDeleted: 0,
		errors: [],
	};

	// OPERATIONS
	const mockClient = new MockJiraClient();
	mockClient.setMockWorklogs([]); // No worklogs
	mockClient.setMockIssueExists(sourceIssueKey);
	mockClient.setMockIssueExists(targetIssueKey);

	const service = new WorklogTransferService(
		mockClient as unknown as JiraClient,
		currentUserEmail,
	);

	const result = await service.transferWorklogs(sourceIssueKey, targetIssueKey);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.stats.sourceWorklogsFound, expectedStats.sourceWorklogsFound);
	t.is(result.stats.worklogsToTransfer, expectedStats.worklogsToTransfer);
	t.is(result.stats.worklogsTransferred, expectedStats.worklogsTransferred);
	t.is(result.stats.worklogsDeleted, expectedStats.worklogsDeleted);
	t.is(result.stats.errors.length, expectedStats.errors.length);
	t.is(result.transferredWorklogs.length, 0);
});
