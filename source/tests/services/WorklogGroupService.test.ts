import test from 'ava';
import {WorklogGroupService} from '../../services/WorklogGroupService.js';
import {IssueKey} from '../../domain/IssueKey.js';
import type {JiraConfig, FavoriteIssue} from '../../jira/types.js';

test('WorklogGroupService - resolveDefaultsFor with group assignment via project mapping', t => {
	// EXPLICIT TEST DATA
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		defaultComment: 'Global default',
		defaultTime: '1h',
		groups: [
			{
				id: 'dev-team',
				name: 'Development Team',
				defaultComment: 'Dev work',
				defaultTime: '2h',
			},
		],
		projects: [
			{
				key: 'PROJ',
				groupId: 'dev-team',
			},
		],
		favorites: [
			{
				key: IssueKey.fromString('PROJ-123'),
				alias: 'Test issue',
			},
		],
	};

	const service = new WorklogGroupService(config);
	const issueKey = IssueKey.fromString('PROJ-123');

	const expectedComment = 'Dev work';
	const expectedTime = '2h';
	const expectedCommentSource = 'group';
	const expectedTimeSource = 'group';

	// OPERATIONS
	const result = service.resolveDefaultsFor(issueKey);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.comment, expectedComment);
	t.is(result.time, expectedTime);
	t.is(result.source.comment, expectedCommentSource);
	t.is(result.source.time, expectedTimeSource);
	t.truthy(result.group);
	t.is(result.group?.getId(), 'dev-team');
});

test('WorklogGroupService - resolveDefaultsFor without group assignment', t => {
	// EXPLICIT TEST DATA
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		defaultComment: 'Global default',
		defaultTime: '3h',
		favorites: [
			{
				key: IssueKey.fromString('UNGROUPED-456'),
				defaultComment: 'Issue comment',
				defaultTime: '4h',
			},
		],
	};

	const service = new WorklogGroupService(config);
	const issueKey = IssueKey.fromString('UNGROUPED-456');

	const expectedComment = 'Issue comment';
	const expectedTime = '4h';
	const expectedCommentSource = 'issue';
	const expectedTimeSource = 'issue';

	// OPERATIONS
	const result = service.resolveDefaultsFor(issueKey);

	// SPECIFIC VALUE COMPARISONS
	t.is(result.comment, expectedComment);
	t.is(result.time, expectedTime);
	t.is(result.source.comment, expectedCommentSource);
	t.is(result.source.time, expectedTimeSource);
	t.is(result.group, undefined);
});

test('WorklogGroupService - getGroupForIssue returns group for favorite issue', t => {
	// EXPLICIT TEST DATA
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		groups: [
			{
				id: 'qa-team',
				name: 'QA Team',
			},
		],
		favorites: [
			{
				key: IssueKey.fromString('QA-789'),
				groupId: 'qa-team',
			},
		],
	};

	const service = new WorklogGroupService(config);
	const issueKey = IssueKey.fromString('QA-789');

	const expectedGroupId = 'qa-team';
	const expectedGroupName = 'QA Team';

	// OPERATIONS
	const group = service.getGroupForIssue(issueKey);

	// SPECIFIC VALUE COMPARISONS
	t.truthy(group);
	t.is(group!.getId(), expectedGroupId);
	t.is(group!.getName(), expectedGroupName);
});

test('WorklogGroupService - getGroupForIssue returns undefined for unassigned issue', t => {
	// EXPLICIT TEST DATA
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		groups: [
			{
				id: 'dev-team',
				name: 'Development Team',
			},
		],
	};

	const service = new WorklogGroupService(config);
	const issueKey = IssueKey.fromString('UNASSIGNED-999');

	const expectedResult = undefined;

	// OPERATIONS
	const group = service.getGroupForIssue(issueKey);

	// SPECIFIC VALUE COMPARISONS
	t.is(group, expectedResult);
});

test('WorklogGroupService - getAllGroups returns all groups', t => {
	// EXPLICIT TEST DATA
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		groups: [
			{
				id: 'team-a',
				name: 'Team A',
			},
			{
				id: 'team-b',
				name: 'Team B',
			},
		],
	};

	const service = new WorklogGroupService(config);

	const expectedGroupCount = 2;
	const expectedTeamAId = 'team-a';
	const expectedTeamBId = 'team-b';

	// OPERATIONS
	const groups = service.getAllGroups();

	// SPECIFIC VALUE COMPARISONS
	t.is(groups.length, expectedGroupCount);
	t.true(groups.some(group => group.getId() === expectedTeamAId));
	t.true(groups.some(group => group.getId() === expectedTeamBId));
});

test('WorklogGroupService - getGroupById returns correct group', t => {
	// EXPLICIT TEST DATA
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		groups: [
			{
				id: 'specific-team',
				name: 'Specific Team',
				defaultComment: 'Team comment',
			},
		],
	};

	const service = new WorklogGroupService(config);
	const groupId = 'specific-team';

	const expectedGroupName = 'Specific Team';
	const expectedDefaultComment = 'Team comment';

	// OPERATIONS
	const group = service.getGroupById(groupId);

	// SPECIFIC VALUE COMPARISONS
	t.truthy(group);
	t.is(group!.getName(), expectedGroupName);
	t.is(group!.getDefaultComment(), expectedDefaultComment);
});

test('WorklogGroupService - getGroupById returns undefined for non-existent group', t => {
	// EXPLICIT TEST DATA
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		groups: [],
	};

	const service = new WorklogGroupService(config);
	const nonExistentGroupId = 'non-existent';

	const expectedResult = undefined;

	// OPERATIONS
	const group = service.getGroupById(nonExistentGroupId);

	// SPECIFIC VALUE COMPARISONS
	t.is(group, expectedResult);
});

test('WorklogGroupService - addFavoriteToGroup adds favorite to existing group', t => {
	// EXPLICIT TEST DATA
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		groups: [
			{
				id: 'target-group',
				name: 'Target Group',
			},
		],
	};

	const service = new WorklogGroupService(config);
	const groupId = 'target-group';
	const newFavorite: FavoriteIssue = {
		key: IssueKey.fromString('NEW-123'),
		alias: 'New issue',
		defaultComment: 'New comment',
	};

	const expectedResult = true;
	const expectedFavoriteCount = 1;

	// OPERATIONS
	const result = service.addFavoriteToGroup(groupId, newFavorite);
	const updatedGroup = service.getGroupById(groupId);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedResult);
	t.truthy(updatedGroup);
	t.is(updatedGroup!.getFavoriteIssues().length, expectedFavoriteCount);
	t.true(
		updatedGroup!
			.getFavoriteIssues()[0]!
			.key.equals(IssueKey.fromString('NEW-123')),
	);
});

test('WorklogGroupService - addFavoriteToGroup returns false for non-existent group', t => {
	// EXPLICIT TEST DATA
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		groups: [],
	};

	const service = new WorklogGroupService(config);
	const nonExistentGroupId = 'non-existent';
	const newFavorite: FavoriteIssue = {
		key: IssueKey.fromString('TEST-456'),
		alias: 'Test issue',
	};

	const expectedResult = false;

	// OPERATIONS
	const result = service.addFavoriteToGroup(nonExistentGroupId, newFavorite);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedResult);
});

test('WorklogGroupService - removeFavoriteFromGroup removes favorite from group', t => {
	// EXPLICIT TEST DATA
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		groups: [
			{
				id: 'source-group',
				name: 'Source Group',
			},
		],
		favorites: [
			{
				key: IssueKey.fromString('REMOVE-789'),
				groupId: 'source-group',
				alias: 'Issue to remove',
			},
		],
	};

	const service = new WorklogGroupService(config);
	const groupId = 'source-group';
	const issueKeyToRemove = IssueKey.fromString('REMOVE-789');

	const expectedResult = true;
	const expectedFavoriteCountAfterRemoval = 0;

	// OPERATIONS
	const result = service.removeFavoriteFromGroup(groupId, issueKeyToRemove);
	const updatedGroup = service.getGroupById(groupId);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedResult);
	t.truthy(updatedGroup);
	t.is(
		updatedGroup!.getFavoriteIssues().length,
		expectedFavoriteCountAfterRemoval,
	);
});

test('WorklogGroupService - removeFavoriteFromGroup returns false for non-existent group', t => {
	// EXPLICIT TEST DATA
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		groups: [],
	};

	const service = new WorklogGroupService(config);
	const nonExistentGroupId = 'non-existent';
	const issueKey = IssueKey.fromString('TEST-999');

	const expectedResult = false;

	// OPERATIONS
	const result = service.removeFavoriteFromGroup(nonExistentGroupId, issueKey);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedResult);
});

test('WorklogGroupService - resolveCommentPrefillDaysFor uses group configuration', t => {
	// EXPLICIT TEST DATA
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		commentPrefillDays: 5,
		groups: [
			{
				id: 'prefill-group',
				name: 'Prefill Group',
				commentPrefillDays: 14,
			},
		],
		favorites: [
			{
				key: IssueKey.fromString('PREFILL-111'),
				groupId: 'prefill-group',
			},
		],
	};

	const service = new WorklogGroupService(config);
	const issueKey = IssueKey.fromString('PREFILL-111');

	const expectedPrefillDays = 14;

	// OPERATIONS
	const prefillDays = service.resolveCommentPrefillDaysFor(issueKey);

	// SPECIFIC VALUE COMPARISONS
	t.is(prefillDays, expectedPrefillDays);
});

test('WorklogGroupService - resolveCommentPrefillDaysFor uses issue-level configuration', t => {
	// EXPLICIT TEST DATA
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		commentPrefillDays: 3,
		favorites: [
			{
				key: IssueKey.fromString('ISSUE-222'),
				commentPrefillDays: 21,
			},
		],
	};

	const service = new WorklogGroupService(config);
	const issueKey = IssueKey.fromString('ISSUE-222');

	const expectedPrefillDays = 21;

	// OPERATIONS
	const prefillDays = service.resolveCommentPrefillDaysFor(issueKey);

	// SPECIFIC VALUE COMPARISONS
	t.is(prefillDays, expectedPrefillDays);
});

test('WorklogGroupService - resolveCommentPrefillDaysFor uses global default when no specific config', t => {
	// EXPLICIT TEST DATA
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
		commentPrefillDays: 10,
	};

	const service = new WorklogGroupService(config);
	const issueKey = IssueKey.fromString('GLOBAL-333');

	const expectedPrefillDays = 10;

	// OPERATIONS
	const prefillDays = service.resolveCommentPrefillDaysFor(issueKey);

	// SPECIFIC VALUE COMPARISONS
	t.is(prefillDays, expectedPrefillDays);
});

test('WorklogGroupService - resolveCommentPrefillDaysFor uses fallback when no config', t => {
	// EXPLICIT TEST DATA
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'token',
	};

	const service = new WorklogGroupService(config);
	const issueKey = IssueKey.fromString('FALLBACK-444');

	const expectedPrefillDays = 7;

	// OPERATIONS
	const prefillDays = service.resolveCommentPrefillDaysFor(issueKey);

	// SPECIFIC VALUE COMPARISONS
	t.is(prefillDays, expectedPrefillDays);
});
