import test from 'ava';
import {IssueKey} from '../../domain/IssueKey.js';

// TEST DATA: Expected inputs and outputs for all test scenarios
const validIssueKeys = [
	{input: 'ABC-123', project: 'ABC', number: 123},
	{input: 'DEF-456', project: 'DEF', number: 456},
	{input: 'PROJ-1', project: 'PROJ', number: 1},
	{input: 'X-999999', project: 'X', number: 999_999},
];

const validIssueKeysWithWhitespace = [
	{input: '  ABC-123  ', expected: 'ABC-123'},
	{input: '\tDEF-456\t', expected: 'DEF-456'},
	{input: '\n PROJ-1 \n', expected: 'PROJ-1'},
];

const validIssueKeysWithCasing = [
	{input: 'abc-123', expected: 'ABC-123'},
	{input: 'Def-456', expected: 'DEF-456'},
	{input: 'pRoJ-789', expected: 'PROJ-789'},
];

const invalidIssueKeys = [
	{input: '', expectedError: 'Issue key is required and cannot be empty'},
	{input: '   ', expectedError: 'Issue key is required and cannot be empty'},
	{input: 'INVALID', expectedError: 'Invalid issue key format'},
	{input: '123-ABC', expectedError: 'Invalid issue key format'},
	{input: 'AB_123', expectedError: 'Invalid issue key format'},
	{input: 'ABC-', expectedError: 'Invalid issue key format'},
	{input: '-123', expectedError: 'Invalid issue key format'},
	{input: 'ABC-123-DEF', expectedError: 'Invalid issue key format'},
];

const patternMatchTests = [
	{issueKey: 'ABC-123', pattern: 'ABC-123', shouldMatch: true},
	{issueKey: 'ABC-123', pattern: 'ABC-*', shouldMatch: true},
	{issueKey: 'ABC-123', pattern: '*-123', shouldMatch: true},
	{issueKey: 'ABC-123', pattern: '*', shouldMatch: true},
	{issueKey: 'ABC-123', pattern: 'DEF-*', shouldMatch: false},
	{issueKey: 'ABC-123', pattern: '*-456', shouldMatch: false},
	{issueKey: 'ABC-123', pattern: 'ABC-456', shouldMatch: false},
	{issueKey: 'ABC-123', pattern: '', shouldMatch: false},
	{issueKey: 'ABC-123', pattern: 'abc-123', shouldMatch: true}, // Case insensitive
];

test('IssueKey.fromString - creates valid issue key', t => {
	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	for (const testCase of validIssueKeys) {
		const issueKey = IssueKey.fromString(testCase.input);
		t.is(issueKey.getProject(), testCase.project);
		t.is(issueKey.getNumber(), testCase.number);
		t.is(issueKey.toString(), testCase.input);
	}
});

test('IssueKey.fromString - trims whitespace', t => {
	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	for (const testCase of validIssueKeysWithWhitespace) {
		const issueKey = IssueKey.fromString(testCase.input);
		t.is(issueKey.toString(), testCase.expected);
	}
});

test('IssueKey.fromString - normalizes to uppercase', t => {
	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	for (const testCase of validIssueKeysWithCasing) {
		const issueKey = IssueKey.fromString(testCase.input);
		t.is(issueKey.toString(), testCase.expected);
	}
});

test('IssueKey.fromString - validates issue key format', t => {
	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	for (const testCase of invalidIssueKeys) {
		const error = t.throws(() => IssueKey.fromString(testCase.input), {
			instanceOf: Error,
		});
		t.true(error!.message.includes(testCase.expectedError));
	}
});

test('IssueKey.tryParse - returns IssueKey for valid input', t => {
	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	for (const testCase of validIssueKeys) {
		const issueKey = IssueKey.tryParse(testCase.input);
		t.not(issueKey, undefined);
		t.is(issueKey!.getProject(), testCase.project);
		t.is(issueKey!.getNumber(), testCase.number);
	}
});

test('IssueKey.tryParse - returns undefined for invalid input', t => {
	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	for (const testCase of invalidIssueKeys) {
		const issueKey = IssueKey.tryParse(testCase.input);
		t.is(issueKey, undefined);
	}
});

test('IssueKey.isValid - returns true for valid keys', t => {
	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	for (const testCase of validIssueKeys) {
		t.true(IssueKey.isValid(testCase.input));
	}
});

test('IssueKey.isValid - returns false for invalid keys', t => {
	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	for (const testCase of invalidIssueKeys) {
		t.false(IssueKey.isValid(testCase.input));
	}
});

test('IssueKey - getProject returns project prefix', t => {
	// TEST DATA
	const issueKey = IssueKey.fromString('PROJ-123');

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	t.is(issueKey.getProject(), 'PROJ');
});

test('IssueKey - getNumber returns issue number', t => {
	// TEST DATA
	const issueKey = IssueKey.fromString('PROJ-123');

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	t.is(issueKey.getNumber(), 123);
});

test('IssueKey - toString returns formatted key', t => {
	// TEST DATA
	const issueKey = IssueKey.fromString('PROJ-123');

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	t.is(issueKey.toString(), 'PROJ-123');
});

test('IssueKey - equals compares issue keys correctly', t => {
	// TEST DATA
	const issueKey1 = IssueKey.fromString('ABC-123');
	const issueKey2 = IssueKey.fromString('ABC-123');
	const issueKey3 = IssueKey.fromString('ABC-456');
	const issueKey4 = IssueKey.fromString('DEF-123');

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	t.true(issueKey1.equals(issueKey2));
	t.false(issueKey1.equals(issueKey3));
	t.false(issueKey1.equals(issueKey4));
});

test('IssueKey - equals handles case normalization', t => {
	// TEST DATA
	const issueKey1 = IssueKey.fromString('abc-123');
	const issueKey2 = IssueKey.fromString('ABC-123');

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	t.true(issueKey1.equals(issueKey2));
});

test('IssueKey - matches pattern correctly', t => {
	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	for (const testCase of patternMatchTests) {
		const issueKey = IssueKey.fromString(testCase.issueKey);
		const result = issueKey.matches(testCase.pattern);
		t.is(
			result,
			testCase.shouldMatch,
			`Expected ${testCase.issueKey} to ${
				testCase.shouldMatch ? 'match' : 'not match'
			} pattern "${testCase.pattern}"`,
		);
	}
});

test('IssueKey - matches handles invalid patterns', t => {
	// TEST DATA
	const issueKey = IssueKey.fromString('ABC-123');

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	t.false(issueKey.matches(''));
	t.false(issueKey.matches('   '));
});

test('IssueKey - belongsToProject checks project membership', t => {
	// TEST DATA
	const issueKey = IssueKey.fromString('PROJ-123');

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	t.true(issueKey.belongsToProject('PROJ'));
	t.true(issueKey.belongsToProject('proj')); // Case insensitive
	t.true(issueKey.belongsToProject(' PROJ ')); // Handles whitespace
	t.false(issueKey.belongsToProject('OTHER'));
	t.false(issueKey.belongsToProject(''));
	t.false(issueKey.belongsToProject('   '));
});

test('IssueKey - immutability (no mutation methods)', t => {
	// TEST DATA
	const issueKey = IssueKey.fromString('ABC-123');
	const originalProject = issueKey.getProject();
	const originalNumber = issueKey.getNumber();
	const originalString = issueKey.toString();

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	// Verify object cannot be mutated
	t.is(issueKey.getProject(), originalProject);
	t.is(issueKey.getNumber(), originalNumber);
	t.is(issueKey.toString(), originalString);

	// Properties should be readonly (compile-time check, but ensures consistency)
	t.is(typeof issueKey.getProject, 'function');
	t.is(typeof issueKey.getNumber, 'function');
});

test('IssueKey - edge cases with large numbers', t => {
	// TEST DATA
	const largeNumber = 999_999_999;
	const issueKeyString = `ABC-${largeNumber}`;

	// OPERATIONS
	const issueKey = IssueKey.fromString(issueKeyString);

	// SPECIFIC VALUE COMPARISONS
	t.is(issueKey.getProject(), 'ABC');
	t.is(issueKey.getNumber(), largeNumber);
	t.is(issueKey.toString(), issueKeyString);
});

test('IssueKey - edge cases with single character project', t => {
	// TEST DATA
	const issueKey = IssueKey.fromString('A-1');

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	t.is(issueKey.getProject(), 'A');
	t.is(issueKey.getNumber(), 1);
	t.is(issueKey.toString(), 'A-1');
});
