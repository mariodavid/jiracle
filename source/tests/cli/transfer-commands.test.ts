import test from 'ava';
import {executeTransferWorklogs} from '../../cli/transfer-commands.js';

test('executeTransferWorklogs - rejects same source and target issue', async t => {
	// EXPLICIT TEST DATA
	const sameIssueKey = 'PROJ-123';
	const parameters = {
		sourceIssue: sameIssueKey,
		targetIssue: sameIssueKey,
	};

	const expectedErrorMessage = 'Source and target issues cannot be the same';

	// OPERATIONS
	const result = await executeTransferWorklogs(parameters);

	// SPECIFIC VALUE COMPARISONS
	t.false(result.success);
	t.is(result.message, expectedErrorMessage);
	t.is(result.summary, undefined);
});

test('executeTransferWorklogs - rejects invalid issue key without dash', async t => {
	// EXPLICIT TEST DATA
	const invalidSourceIssue = 'invalid';
	const validTargetIssue = 'PROJ-456';
	const expectedFailureIndicator = 'failed';

	// OPERATIONS
	const result = await executeTransferWorklogs({
		sourceIssue: invalidSourceIssue,
		targetIssue: validTargetIssue,
	});

	// SPECIFIC VALUE COMPARISONS
	t.false(result.success, 'Should reject issue key without dash separator');
	t.true(
		result.message.includes(expectedFailureIndicator),
		'Should indicate validation failure',
	);
});

test('executeTransferWorklogs - rejects issue key without number', async t => {
	// EXPLICIT TEST DATA
	const invalidSourceIssue = 'PROJ';
	const validTargetIssue = 'PROJ-456';
	const expectedFailureIndicator = 'failed';

	// OPERATIONS
	const result = await executeTransferWorklogs({
		sourceIssue: invalidSourceIssue,
		targetIssue: validTargetIssue,
	});

	// SPECIFIC VALUE COMPARISONS
	t.false(result.success, 'Should reject issue key without number part');
	t.true(
		result.message.includes(expectedFailureIndicator),
		'Should indicate validation failure',
	);
});

test('executeTransferWorklogs - rejects numeric-only issue key', async t => {
	// EXPLICIT TEST DATA
	const invalidSourceIssue = '123';
	const validTargetIssue = 'PROJ-456';
	const expectedFailureIndicator = 'failed';

	// OPERATIONS
	const result = await executeTransferWorklogs({
		sourceIssue: invalidSourceIssue,
		targetIssue: validTargetIssue,
	});

	// SPECIFIC VALUE COMPARISONS
	t.false(result.success, 'Should reject numeric-only issue key');
	t.true(
		result.message.includes(expectedFailureIndicator),
		'Should indicate validation failure',
	);
});

test('executeTransferWorklogs - rejects issue key ending with dash', async t => {
	// EXPLICIT TEST DATA
	const invalidSourceIssue = 'PROJ-';
	const validTargetIssue = 'PROJ-456';
	const expectedFailureIndicator = 'failed';

	// OPERATIONS
	const result = await executeTransferWorklogs({
		sourceIssue: invalidSourceIssue,
		targetIssue: validTargetIssue,
	});

	// SPECIFIC VALUE COMPARISONS
	t.false(result.success, 'Should reject issue key ending with dash');
	t.true(
		result.message.includes(expectedFailureIndicator),
		'Should indicate validation failure',
	);
});

test('executeTransferWorklogs - rejects issue key starting with dash', async t => {
	// EXPLICIT TEST DATA
	const invalidSourceIssue = '-123';
	const validTargetIssue = 'PROJ-456';
	const expectedFailureIndicator = 'failed';

	// OPERATIONS
	const result = await executeTransferWorklogs({
		sourceIssue: invalidSourceIssue,
		targetIssue: validTargetIssue,
	});

	// SPECIFIC VALUE COMPARISONS
	t.false(result.success, 'Should reject issue key starting with dash');
	t.true(
		result.message.includes(expectedFailureIndicator),
		'Should indicate validation failure',
	);
});

test('executeTransferWorklogs - rejects lowercase issue key', async t => {
	// EXPLICIT TEST DATA
	const invalidSourceIssue = 'proj-123';
	const validTargetIssue = 'PROJ-456';
	const expectedFailureIndicator = 'failed';

	// OPERATIONS
	const result = await executeTransferWorklogs({
		sourceIssue: invalidSourceIssue,
		targetIssue: validTargetIssue,
	});

	// SPECIFIC VALUE COMPARISONS
	t.false(result.success, 'Should reject lowercase issue key');
	t.true(
		result.message.includes(expectedFailureIndicator),
		'Should indicate validation failure',
	);
});

test('executeTransferWorklogs - handles configuration loading errors', async t => {
	// EXPLICIT TEST DATA
	const parameters = {
		sourceIssue: 'PROJ-123',
		targetIssue: 'PROJ-456',
	};
	const nonExistentConfigPath = '/nonexistent/config.json';

	// OPERATIONS
	const result = await executeTransferWorklogs(
		parameters,
		nonExistentConfigPath,
	);

	// SPECIFIC VALUE COMPARISONS
	t.false(result.success);
	t.true(result.message.includes('failed'));
});

test('executeTransferWorklogs - parameter type handling', async t => {
	// EXPLICIT TEST DATA
	const validParameters = {
		sourceIssue: 'PROJ-123',
		targetIssue: 'PROJ-456',
		dryRun: true,
		currentUserOnly: true,
	};

	const parametersWithFalseFlags = {
		sourceIssue: 'PROJ-123',
		targetIssue: 'PROJ-456',
		dryRun: false,
		currentUserOnly: false,
	};

	// OPERATIONS
	const result1 = await executeTransferWorklogs(validParameters);
	const result2 = await executeTransferWorklogs(parametersWithFalseFlags);

	// SPECIFIC VALUE COMPARISONS
	// Both should handle the parameters and return proper result structure
	t.false(
		result1.success || result2.success,
		'Should fail due to missing config/connectivity',
	);
	t.true(result1.message.length > 0, 'Should provide meaningful error message');
	t.true(result2.message.length > 0, 'Should provide meaningful error message');

	// Both calls should handle different parameter values gracefully
	t.not(
		result1.message,
		result2.message,
		'Different parameters should potentially produce different messages',
	);
});

test('executeTransferWorklogs - handles undefined optional parameters', async t => {
	// EXPLICIT TEST DATA
	const minimalParameters = {
		sourceIssue: 'PROJ-123',
		targetIssue: 'PROJ-456',
		// DryRun and currentUserOnly are undefined
	};

	// OPERATIONS
	const result = await executeTransferWorklogs(minimalParameters);

	// SPECIFIC VALUE COMPARISONS
	// Should handle undefined optional parameters gracefully and fail due to missing config
	t.false(result.success, 'Should fail due to missing config/connectivity');
	t.true(result.message.length > 0, 'Should provide meaningful error message');
	t.true(result.message.includes('failed'), 'Should indicate failure reason');

	// Should not contain dry run indicators when flags are undefined
	t.false(
		result.message.includes('preview') ||
			result.message.includes('DRY RUN') ||
			result.message.includes('would'),
		'Should not contain dry run indicators when flags are undefined',
	);
});

test('executeTransferWorklogs - error handling returns proper structure', async t => {
	// EXPLICIT TEST DATA
	const parametersWithInvalidConfig = {
		sourceIssue: 'PROJ-123',
		targetIssue: 'PROJ-456',
	};
	const invalidConfigPath = '/dev/null/invalid'; // Path that will cause an error

	// OPERATIONS
	const result = await executeTransferWorklogs(
		parametersWithInvalidConfig,
		invalidConfigPath,
	);

	// SPECIFIC VALUE COMPARISONS
	t.false(result.success);
	t.is(typeof result.message, 'string');
	t.true(result.message.length > 0);
	t.is(result.summary, undefined);
	t.true(result.message.includes('failed'));
});
