import test from 'ava';
import {InputValidation, createInputValidator} from './inputValidation.js';

test('InputValidation - allows valid numeric input', t => {
	const validator = new InputValidation();

	t.true(validator.isValidInputChar('1', ''));
	t.true(validator.isValidInputChar('2', '1'));
	t.true(validator.isValidInputChar('5', '12'));
});

test('InputValidation - allows valid decimal separators', t => {
	const validator = new InputValidation();

	t.true(validator.isValidInputChar('.', '1'));
	t.true(validator.isValidInputChar(',', '2'));
	t.true(validator.isValidInputChar('5', '1.'));
	t.true(validator.isValidInputChar('5', '2,'));
});

test('InputValidation - allows valid units', t => {
	const validator = new InputValidation();

	t.true(validator.isValidInputChar('h', '2'));
	t.true(validator.isValidInputChar('m', '30'));
	t.true(validator.isValidInputChar('d', '1'));
});

test('InputValidation - rejects invalid starting characters', t => {
	const validator = new InputValidation();

	t.false(validator.isValidInputChar('.', ''));
	t.false(validator.isValidInputChar(',', ''));
	t.false(validator.isValidInputChar('h', ''));
	t.false(validator.isValidInputChar('m', ''));
	t.false(validator.isValidInputChar('d', ''));
});

test('InputValidation - rejects invalid characters', t => {
	const validator = new InputValidation();

	t.false(validator.isValidInputChar('a', '1'));
	t.false(validator.isValidInputChar('x', '2'));
	t.false(validator.isValidInputChar('!', '1'));
	t.false(validator.isValidInputChar(' ', '1'));
});

test('InputValidation - rejects multiple decimal separators', t => {
	const validator = new InputValidation();

	t.false(validator.isValidInputChar('.', '1.2'));
	t.false(validator.isValidInputChar(',', '1,5'));
	t.false(validator.isValidInputChar('.', '1,2'));
	t.false(validator.isValidInputChar(',', '1.5'));
});

test('InputValidation - rejects invalid hour patterns', t => {
	const validator = new InputValidation();

	// Multiple h units
	t.false(validator.isValidInputChar('h', '2h'));

	// Decimal after h
	t.false(validator.isValidInputChar('.', '2h'));
	t.false(validator.isValidInputChar(',', '2h'));

	// Invalid units after h+digits
	t.false(validator.isValidInputChar('h', '2h30'));
	t.false(validator.isValidInputChar('d', '2h30'));

	// Digits after decimal + h
	t.false(validator.isValidInputChar('2', '2.5h'));

	// Minutes after decimal + h
	t.false(validator.isValidInputChar('m', '2.5h'));

	// Days after hours
	t.false(validator.isValidInputChar('d', '2h'));
});

test('InputValidation - rejects characters after complete units', t => {
	const validator = new InputValidation();

	// Nothing after days
	t.false(validator.isValidInputChar('1', '1d'));
	t.false(validator.isValidInputChar('h', '1d'));
	t.false(validator.isValidInputChar('m', '1d'));

	// Nothing after minutes
	t.false(validator.isValidInputChar('1', '30m'));
	t.false(validator.isValidInputChar('h', '30m'));
	t.false(validator.isValidInputChar('d', '30m'));
});

test('InputValidation - allows valid hour+minute patterns', t => {
	const validator = new InputValidation();

	t.true(validator.isValidInputChar('3', '2h'));
	t.true(validator.isValidInputChar('0', '2h3'));
	t.true(validator.isValidInputChar('m', '2h30'));
});

test('InputValidation - respects allowed units restriction', t => {
	const validator = new InputValidation(['h', 'm']);

	t.true(validator.isValidInputChar('h', '2'));
	t.true(validator.isValidInputChar('m', '30'));
	t.false(validator.isValidInputChar('d', '1'));
});

test('InputValidation - handles edge cases', t => {
	const validator = new InputValidation();

	// Multiple consecutive dots/commas
	t.false(validator.isValidInputChar('.', '1..'));
	t.false(validator.isValidInputChar(',', '1,,'));

	// Mixed separators
	t.false(validator.isValidInputChar(',', '1.'));
	t.false(validator.isValidInputChar('.', '1,'));

	// Complex decimal patterns
	t.false(validator.isValidInputChar('.', '1.2.'));
	t.false(validator.isValidInputChar(',', '1,2,'));
});

test('createInputValidator - factory function works correctly', t => {
	const validator = createInputValidator(['h', 'm']);

	t.true(validator.isValidInputChar('h', '2'));
	t.true(validator.isValidInputChar('m', '30'));
	t.false(validator.isValidInputChar('d', '1'));
});
