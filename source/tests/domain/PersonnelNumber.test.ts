import test from 'ava';
import {PersonnelNumber} from '../../domain/PersonnelNumber.js';

test('PersonnelNumber validation and creation', t => {
	// EXPLICIT TEST DATA
	const validNumbers = ['1234', '12345', '123456', '12345678'];
	const invalidNumbers = ['123', '123456789', 'abcd', '', '12a4', '  '];

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	for (const validNumber of validNumbers) {
		const personnelNumber = PersonnelNumber.fromString(validNumber);
		t.is(
			personnelNumber.toString(),
			validNumber.trim(),
			`Should accept ${validNumber}`,
		);
	}

	for (const invalidNumber of invalidNumbers) {
		t.throws(
			() => PersonnelNumber.fromString(invalidNumber),
			{
				message: `Invalid personnel number: ${invalidNumber}. Must be 4-8 digits`,
			},
			`Should reject ${invalidNumber}`,
		);
	}
});

test('PersonnelNumber static validation', t => {
	// EXPLICIT TEST DATA
	const validCases = [
		{input: '1234', expected: true},
		{input: '123456', expected: true},
		{input: '12345678', expected: true},
	];
	const invalidCases = [
		{input: '123', expected: false},
		{input: '123456789', expected: false},
		{input: 'abcd', expected: false},
		{input: '', expected: false},
	];

	// SPECIFIC VALUE COMPARISONS
	for (const testCase of validCases) {
		t.is(
			PersonnelNumber.isValid(testCase.input),
			testCase.expected,
			`Should validate ${testCase.input} as ${String(testCase.expected)}`,
		);
	}

	for (const testCase of invalidCases) {
		t.is(
			PersonnelNumber.isValid(testCase.input),
			testCase.expected,
			`Should validate ${testCase.input} as ${String(testCase.expected)}`,
		);
	}
});

test('PersonnelNumber display methods', t => {
	// EXPLICIT TEST DATA
	const personnelNumber = PersonnelNumber.fromString('123456');
	const expectedValue = '123456';
	const expectedDisplayString = 'Personnel #123456';

	// SPECIFIC VALUE COMPARISONS
	t.is(personnelNumber.getValue(), expectedValue, 'Should return raw value');
	t.is(personnelNumber.toString(), expectedValue, 'Should convert to string');
	t.is(
		personnelNumber.toDisplayString(),
		expectedDisplayString,
		'Should format for display',
	);
});

test('PersonnelNumber equality comparison', t => {
	// EXPLICIT TEST DATA
	const number1 = PersonnelNumber.fromString('123456');
	const number2 = PersonnelNumber.fromString('123456');
	const number3 = PersonnelNumber.fromString('654321');

	// SPECIFIC VALUE COMPARISONS
	t.true(number1.equals(number2), 'Should identify equal numbers');
	t.false(number1.equals(number3), 'Should identify different numbers');
});

test('PersonnelNumber utility methods', t => {
	// EXPLICIT TEST DATA
	const shortNumber = PersonnelNumber.fromString('1234');
	const longNumber = PersonnelNumber.fromString('12345678');
	const sapValidNumber = PersonnelNumber.fromString('123456');

	// SPECIFIC VALUE COMPARISONS
	t.is(
		shortNumber.getLength(),
		4,
		'Should return correct length for short number',
	);
	t.is(
		longNumber.getLength(),
		8,
		'Should return correct length for long number',
	);
	t.false(
		shortNumber.isValidSAPFormat(),
		'Short number should not be valid SAP format',
	);
	t.true(
		sapValidNumber.isValidSAPFormat(),
		'Standard number should be valid SAP format',
	);
	t.true(
		longNumber.isValidSAPFormat(),
		'Long number should be valid SAP format',
	);
});

test('PersonnelNumber constructor validation', t => {
	// EXPLICIT TEST DATA
	const validNumber = '123456';
	const invalidNumber = 'abc123';

	// OPERATIONS & SPECIFIC VALUE COMPARISONS
	const personnelNumber = new PersonnelNumber(validNumber);
	t.is(
		personnelNumber.toString(),
		validNumber,
		'Constructor should accept valid number',
	);

	t.throws(
		() => new PersonnelNumber(invalidNumber),
		{message: `Invalid personnel number: ${invalidNumber}. Must be 4-8 digits`},
		'Constructor should reject invalid number',
	);
});

test('PersonnelNumber handles whitespace trimming', t => {
	// EXPLICIT TEST DATA
	const numberWithSpaces = '  123456  ';
	const expectedCleanNumber = '123456';

	// OPERATIONS
	const personnelNumber = PersonnelNumber.fromString(numberWithSpaces);

	// SPECIFIC VALUE COMPARISONS
	t.is(
		personnelNumber.toString(),
		expectedCleanNumber,
		'Should trim whitespace',
	);
});
