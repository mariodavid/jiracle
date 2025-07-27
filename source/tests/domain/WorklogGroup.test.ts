import test from 'ava';
import {Duration} from '../../domain/Duration.js';
import {
	WorklogGroup,
	type CreateGroupParameters,
	type GroupId,
} from '../../domain/WorklogGroup.js';
import {IssueKey} from '../../domain/IssueKey.js';
import type {FavoriteIssue, Group} from '../../jira/types.js';

test('WorklogGroup.create - creates group with all parameters', t => {
	// EXPLICIT TEST DATA
	const groupId: GroupId = 'dev-team';
	const groupName = 'Development Team';
	const defaultDuration = new Duration('2h');
	const defaultComment = 'Development work';
	const desiredAmount = 40;
	const commentPrefillDays = 14;
	const favoriteIssues: FavoriteIssue[] = [
		{
			key: IssueKey.fromString('PROJ-123'),
			alias: 'Main feature',
			defaultComment: 'Feature development',
			defaultTime: '3h',
		},
	];

	const parameters: CreateGroupParameters = {
		id: groupId,
		name: groupName,
		defaultDuration,
		defaultComment,
		desiredAmount,
		commentPrefillDays,
		favoriteIssues,
	};

	const expectedId = 'dev-team';
	const expectedName = 'Development Team';
	const expectedDefaultTime = '2h';
	const expectedDefaultComment = 'Development work';
	const expectedDesiredAmount = 40;
	const expectedCommentPrefillDays = 14;
	const expectedFavoriteIssuesCount = 1;

	// OPERATIONS
	const group = WorklogGroup.create(parameters);

	// SPECIFIC VALUE COMPARISONS
	t.is(group.getId(), expectedId);
	t.is(group.getName(), expectedName);
	t.is(group.getDefaultTime(), expectedDefaultTime);
	t.is(group.getDefaultComment(), expectedDefaultComment);
	t.is(group.getDesiredAmount(), expectedDesiredAmount);
	t.is(group.getCommentPrefillDays(), expectedCommentPrefillDays);
	t.is(group.getFavoriteIssues().length, expectedFavoriteIssuesCount);
});

test('WorklogGroup.create - creates group with minimal parameters', t => {
	// EXPLICIT TEST DATA
	const groupId: GroupId = 'minimal-group';
	const groupName = 'Minimal Group';

	const parameters: CreateGroupParameters = {
		id: groupId,
		name: groupName,
	};

	const expectedId = 'minimal-group';
	const expectedName = 'Minimal Group';
	const expectedDefaultTime = undefined;
	const expectedDefaultComment = undefined;
	const expectedDesiredAmount = undefined;
	const expectedCommentPrefillDays = 7; // Default fallback
	const expectedFavoriteIssuesCount = 0;

	// OPERATIONS
	const group = WorklogGroup.create(parameters);

	// SPECIFIC VALUE COMPARISONS
	t.is(group.getId(), expectedId);
	t.is(group.getName(), expectedName);
	t.is(group.getDefaultTime(), expectedDefaultTime);
	t.is(group.getDefaultComment(), expectedDefaultComment);
	t.is(group.getDesiredAmount(), expectedDesiredAmount);
	t.is(group.getCommentPrefillDays(), expectedCommentPrefillDays);
	t.is(group.getFavoriteIssues().length, expectedFavoriteIssuesCount);
});

test('WorklogGroup.fromConfig - creates group from config object', t => {
	// EXPLICIT TEST DATA
	const config: Group = {
		id: 'config-group',
		name: 'Config Group',
		defaultComment: 'Config comment',
		defaultTime: '1h30m',
		desiredAmount: 35,
		commentPrefillDays: 10,
	};

	const expectedId = 'config-group';
	const expectedName = 'Config Group';
	const expectedDefaultTime = '1h30m';
	const expectedDefaultComment = 'Config comment';
	const expectedDesiredAmount = 35;
	const expectedCommentPrefillDays = 10;
	const expectedFavoriteIssuesCount = 0;

	// OPERATIONS
	const group = WorklogGroup.fromConfig(config);

	// SPECIFIC VALUE COMPARISONS
	t.is(group.getId(), expectedId);
	t.is(group.getName(), expectedName);
	t.is(group.getDefaultTime(), expectedDefaultTime);
	t.is(group.getDefaultComment(), expectedDefaultComment);
	t.is(group.getDesiredAmount(), expectedDesiredAmount);
	t.is(group.getCommentPrefillDays(), expectedCommentPrefillDays);
	t.is(group.getFavoriteIssues().length, expectedFavoriteIssuesCount);
});

test('WorklogGroup.fromConfig - handles invalid time format gracefully', t => {
	// EXPLICIT TEST DATA
	const config: Group = {
		id: 'invalid-time-group',
		name: 'Invalid Time Group',
		defaultTime: 'invalid-time-format',
	};

	const expectedId = 'invalid-time-group';
	const expectedName = 'Invalid Time Group';
	const expectedDefaultTime = undefined; // Should be undefined for invalid format

	// OPERATIONS
	const group = WorklogGroup.fromConfig(config);

	// SPECIFIC VALUE COMPARISONS
	t.is(group.getId(), expectedId);
	t.is(group.getName(), expectedName);
	t.is(group.getDefaultTime(), expectedDefaultTime);
});

test('resolveDefaultsFor - resolves from favorite issue (highest priority)', t => {
	// EXPLICIT TEST DATA
	const favoriteIssue: FavoriteIssue = {
		key: IssueKey.fromString('PROJ-456'),
		alias: 'Priority feature',
		defaultComment: 'Issue-specific comment',
		defaultTime: '4h',
	};

	const group = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
		defaultComment: 'Group comment',
		defaultDuration: new Duration('2h'),
		favoriteIssues: [favoriteIssue],
	});

	const issueKey: IssueKey = IssueKey.fromString('PROJ-456');
	const globalDefaults = {comment: 'Global comment', time: '1h'};

	const expectedComment = 'Issue-specific comment';
	const expectedTime = '4h';
	const expectedCommentSource = 'issue';
	const expectedTimeSource = 'issue';

	// OPERATIONS
	const resolved = group.resolveDefaultsFor(issueKey, globalDefaults);

	// SPECIFIC VALUE COMPARISONS
	t.is(resolved.comment, expectedComment);
	t.is(resolved.time, expectedTime);
	t.is(resolved.source.comment, expectedCommentSource);
	t.is(resolved.source.time, expectedTimeSource);
});

test('resolveDefaultsFor - resolves from group defaults (second priority)', t => {
	// EXPLICIT TEST DATA
	const group = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
		defaultComment: 'Group comment',
		defaultDuration: new Duration('3h'),
	});

	const issueKey: IssueKey = IssueKey.fromString('PROJ-789');
	const globalDefaults = {comment: 'Global comment', time: '1h'};

	const expectedComment = 'Group comment';
	const expectedTime = '3h';
	const expectedCommentSource = 'group';
	const expectedTimeSource = 'group';

	// OPERATIONS
	const resolved = group.resolveDefaultsFor(issueKey, globalDefaults);

	// SPECIFIC VALUE COMPARISONS
	t.is(resolved.comment, expectedComment);
	t.is(resolved.time, expectedTime);
	t.is(resolved.source.comment, expectedCommentSource);
	t.is(resolved.source.time, expectedTimeSource);
});

test('resolveDefaultsFor - resolves from global defaults (third priority)', t => {
	// EXPLICIT TEST DATA
	const group = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
	});

	const issueKey: IssueKey = IssueKey.fromString('PROJ-999');
	const globalDefaults = {comment: 'Global comment', time: '5h'};

	const expectedComment = 'Global comment';
	const expectedTime = '5h';
	const expectedCommentSource = 'global';
	const expectedTimeSource = 'global';

	// OPERATIONS
	const resolved = group.resolveDefaultsFor(issueKey, globalDefaults);

	// SPECIFIC VALUE COMPARISONS
	t.is(resolved.comment, expectedComment);
	t.is(resolved.time, expectedTime);
	t.is(resolved.source.comment, expectedCommentSource);
	t.is(resolved.source.time, expectedTimeSource);
});

test('resolveDefaultsFor - falls back to defaults (lowest priority)', t => {
	// EXPLICIT TEST DATA
	const group = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
	});

	const issueKey: IssueKey = IssueKey.fromString('PROJ-000');

	const expectedComment = '';
	const expectedTime = '1h';
	const expectedCommentSource = 'fallback';
	const expectedTimeSource = 'fallback';

	// OPERATIONS
	const resolved = group.resolveDefaultsFor(issueKey);

	// SPECIFIC VALUE COMPARISONS
	t.is(resolved.comment, expectedComment);
	t.is(resolved.time, expectedTime);
	t.is(resolved.source.comment, expectedCommentSource);
	t.is(resolved.source.time, expectedTimeSource);
});

test('addFavoriteIssue - adds new favorite issue with group ID', t => {
	// EXPLICIT TEST DATA
	const originalGroup = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
	});

	const newFavorite: FavoriteIssue = {
		key: IssueKey.fromString('PROJ-123'),
		alias: 'New feature',
		defaultComment: 'New comment',
		defaultTime: '2h',
	};

	const expectedFavoriteIssuesCount = 1;
	const expectedFavoriteKey = 'PROJ-123';
	const expectedFavoriteGroupId = 'test-group';

	// OPERATIONS
	const updatedGroup = originalGroup.addFavoriteIssue(newFavorite);

	// SPECIFIC VALUE COMPARISONS
	t.is(updatedGroup.getFavoriteIssues().length, expectedFavoriteIssuesCount);
	t.is(
		updatedGroup.getFavoriteIssues()[0]!.key.toString(),
		expectedFavoriteKey,
	);
	t.is(updatedGroup.getFavoriteIssues()[0]!.groupId, expectedFavoriteGroupId);
	// Original group should be unchanged
	t.is(originalGroup.getFavoriteIssues().length, 0);
});

test('addFavoriteIssue - replaces existing favorite with same key', t => {
	// EXPLICIT TEST DATA
	const existingFavorite: FavoriteIssue = {
		key: IssueKey.fromString('PROJ-555'),
		alias: 'Old feature',
		defaultComment: 'Old comment',
	};

	const originalGroup = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
		favoriteIssues: [existingFavorite],
	});

	const updatedFavorite: FavoriteIssue = {
		key: IssueKey.fromString('PROJ-555'),
		alias: 'Updated feature',
		defaultComment: 'Updated comment',
		defaultTime: '3h',
	};

	const expectedFavoriteIssuesCount = 1;
	const expectedFavoriteAlias = 'Updated feature';
	const expectedFavoriteComment = 'Updated comment';
	const expectedFavoriteTime = '3h';

	// OPERATIONS
	const updatedGroup = originalGroup.addFavoriteIssue(updatedFavorite);

	// SPECIFIC VALUE COMPARISONS
	t.is(updatedGroup.getFavoriteIssues().length, expectedFavoriteIssuesCount);
	t.is(updatedGroup.getFavoriteIssues()[0]!.alias, expectedFavoriteAlias);
	t.is(
		updatedGroup.getFavoriteIssues()[0]!.defaultComment,
		expectedFavoriteComment,
	);
	t.is(updatedGroup.getFavoriteIssues()[0]!.defaultTime, expectedFavoriteTime);
});

test('removeFavoriteIssue - removes existing favorite issue', t => {
	// EXPLICIT TEST DATA
	const favoriteToKeep: FavoriteIssue = {
		key: IssueKey.fromString('PROJ-111'),
		alias: 'Keep this',
	};

	const favoriteToRemove: FavoriteIssue = {
		key: IssueKey.fromString('PROJ-222'),
		alias: 'Remove this',
	};

	const originalGroup = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
		favoriteIssues: [favoriteToKeep, favoriteToRemove],
	});

	const issueKeyToRemove: IssueKey = IssueKey.fromString('PROJ-222');

	const expectedFavoriteIssuesCount = 1;
	const expectedRemainingKey = 'PROJ-111';

	// OPERATIONS
	const updatedGroup = originalGroup.removeFavoriteIssue(issueKeyToRemove);

	// SPECIFIC VALUE COMPARISONS
	t.is(updatedGroup.getFavoriteIssues().length, expectedFavoriteIssuesCount);
	t.is(
		updatedGroup.getFavoriteIssues()[0]!.key.toString(),
		expectedRemainingKey,
	);
	// Original group should be unchanged
	t.is(originalGroup.getFavoriteIssues().length, 2);
});

test('removeFavoriteIssue - handles non-existent issue key', t => {
	// EXPLICIT TEST DATA
	const existingFavorite: FavoriteIssue = {
		key: IssueKey.fromString('PROJ-333'),
		alias: 'Existing',
	};

	const originalGroup = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
		favoriteIssues: [existingFavorite],
	});

	const nonExistentKey: IssueKey = IssueKey.fromString('PROJ-999');

	const expectedFavoriteIssuesCount = 1;
	const expectedRemainingKey = 'PROJ-333';

	// OPERATIONS
	const updatedGroup = originalGroup.removeFavoriteIssue(nonExistentKey);

	// SPECIFIC VALUE COMPARISONS
	t.is(updatedGroup.getFavoriteIssues().length, expectedFavoriteIssuesCount);
	t.is(
		updatedGroup.getFavoriteIssues()[0]!.key.toString(),
		expectedRemainingKey,
	);
});

test('meetsDesiredAmount - returns true when no desired amount is set', t => {
	// EXPLICIT TEST DATA
	const group = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
	});

	const actualAmount = new Duration('10h');

	const expectedResult = true;

	// OPERATIONS
	const result = group.meetsDesiredAmount(actualAmount);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedResult);
});

test('meetsDesiredAmount - returns true when actual meets desired amount', t => {
	// EXPLICIT TEST DATA
	const desiredAmountHours = 40;
	const group = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
		desiredAmount: desiredAmountHours,
	});

	const actualAmount = new Duration('40h');

	const expectedResult = true;

	// OPERATIONS
	const result = group.meetsDesiredAmount(actualAmount);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedResult);
});

test('meetsDesiredAmount - returns true when actual exceeds desired amount', t => {
	// EXPLICIT TEST DATA
	const desiredAmountHours = 30;
	const group = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
		desiredAmount: desiredAmountHours,
	});

	const actualAmount = new Duration('35h');

	const expectedResult = true;

	// OPERATIONS
	const result = group.meetsDesiredAmount(actualAmount);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedResult);
});

test('meetsDesiredAmount - returns false when actual is less than desired amount', t => {
	// EXPLICIT TEST DATA
	const desiredAmountHours = 40;
	const group = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
		desiredAmount: desiredAmountHours,
	});

	const actualAmount = new Duration('35h');

	const expectedResult = false;

	// OPERATIONS
	const result = group.meetsDesiredAmount(actualAmount);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedResult);
});

test('shouldPrefillComment - returns true when within prefill days', t => {
	// EXPLICIT TEST DATA
	const commentPrefillDays = 14;
	const group = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
		commentPrefillDays,
	});

	const daysAgo = 10;

	const expectedResult = true;

	// OPERATIONS
	const result = group.shouldPrefillComment(daysAgo);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedResult);
});

test('shouldPrefillComment - returns false when beyond prefill days', t => {
	// EXPLICIT TEST DATA
	const commentPrefillDays = 7;
	const group = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
		commentPrefillDays,
	});

	const daysAgo = 10;

	const expectedResult = false;

	// OPERATIONS
	const result = group.shouldPrefillComment(daysAgo);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedResult);
});

test('shouldPrefillComment - uses default 7 days when not configured', t => {
	// EXPLICIT TEST DATA
	const group = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
	});

	const daysAgoWithinDefault = 5;
	const daysAgoBeyondDefault = 10;

	const expectedResultWithin = true;
	const expectedResultBeyond = false;

	// OPERATIONS
	const resultWithin = group.shouldPrefillComment(daysAgoWithinDefault);
	const resultBeyond = group.shouldPrefillComment(daysAgoBeyondDefault);

	// SPECIFIC VALUE COMPARISONS
	t.is(resultWithin, expectedResultWithin);
	t.is(resultBeyond, expectedResultBeyond);
});

test('containsIssue - returns true for existing favorite issue', t => {
	// EXPLICIT TEST DATA
	const favoriteIssue: FavoriteIssue = {
		key: IssueKey.fromString('PROJ-123'),
		alias: 'Favorite feature',
	};

	const group = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
		favoriteIssues: [favoriteIssue],
	});

	const existingIssueKey: IssueKey = IssueKey.fromString('PROJ-123');

	const expectedResult = true;

	// OPERATIONS
	const result = group.containsIssue(existingIssueKey);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedResult);
});

test('containsIssue - returns false for non-existent issue', t => {
	// EXPLICIT TEST DATA
	const favoriteIssue: FavoriteIssue = {
		key: IssueKey.fromString('PROJ-123'),
		alias: 'Favorite feature',
	};

	const group = WorklogGroup.create({
		id: 'test-group',
		name: 'Test Group',
		favoriteIssues: [favoriteIssue],
	});

	const nonExistentIssueKey: IssueKey = IssueKey.fromString('PROJ-999');

	const expectedResult = false;

	// OPERATIONS
	const result = group.containsIssue(nonExistentIssueKey);

	// SPECIFIC VALUE COMPARISONS
	t.is(result, expectedResult);
});

test('toConfig - converts group back to configuration format', t => {
	// EXPLICIT TEST DATA
	const group = WorklogGroup.create({
		id: 'config-group',
		name: 'Config Group',
		defaultComment: 'Config comment',
		defaultDuration: new Duration('2h30m'),
		desiredAmount: 40,
		commentPrefillDays: 14,
	});

	const expectedId = 'config-group';
	const expectedName = 'Config Group';
	const expectedDefaultComment = 'Config comment';
	const expectedDefaultTime = '2h30m';
	const expectedDesiredAmount = 40;
	const expectedCommentPrefillDays = 14;

	// OPERATIONS
	const config = group.toConfig();

	// SPECIFIC VALUE COMPARISONS
	t.is(config.id, expectedId);
	t.is(config.name, expectedName);
	t.is(config.defaultComment, expectedDefaultComment);
	t.is(config.defaultTime, expectedDefaultTime);
	t.is(config.desiredAmount, expectedDesiredAmount);
	t.is(config.commentPrefillDays, expectedCommentPrefillDays);
});

test('toConfig - handles undefined values correctly', t => {
	// EXPLICIT TEST DATA
	const group = WorklogGroup.create({
		id: 'minimal-group',
		name: 'Minimal Group',
	});

	const expectedId = 'minimal-group';
	const expectedName = 'Minimal Group';
	const expectedDefaultComment = undefined;
	const expectedDefaultTime = undefined;
	const expectedDesiredAmount = undefined;
	const expectedCommentPrefillDays = undefined;

	// OPERATIONS
	const config = group.toConfig();

	// SPECIFIC VALUE COMPARISONS
	t.is(config.id, expectedId);
	t.is(config.name, expectedName);
	t.is(config.defaultComment, expectedDefaultComment);
	t.is(config.defaultTime, expectedDefaultTime);
	t.is(config.desiredAmount, expectedDesiredAmount);
	t.is(config.commentPrefillDays, expectedCommentPrefillDays);
});
