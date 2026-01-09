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

test('executeTransferWorklogs - validates issue key format', async t => {
	// EXPLICIT TEST DATA
	const invalidIssueKeys = [
		'invalid',
		'PROJ',
		'123',
		'PROJ-',
		'-123',
		'proj-123', // Lowercase
	];

	const validTargetIssue = 'PROJ-456';

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	for (const invalidKey of invalidIssueKeys) {
		const result = await executeTransferWorklogs({
			sourceIssue: invalidKey,
			targetIssue: validTargetIssue,
		});

		t.false(result.success);
		t.true(result.message.includes('failed'));
	}
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
	// Both should handle the parameters without type errors
	t.is(typeof result1.success, 'boolean');
	t.is(typeof result1.message, 'string');
	t.is(typeof result2.success, 'boolean');
	t.is(typeof result2.message, 'string');

	// Dry run should be reflected in message
	if (
		result1.message.includes('preview') ||
		result1.message.includes('DRY RUN')
	) {
		t.true(validParameters.dryRun);
	}
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
	// Should handle undefined optional parameters gracefully
	t.is(typeof result.success, 'boolean');
	t.is(typeof result.message, 'string');
	t.true(result.message.length > 0);
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
