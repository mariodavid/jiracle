import test from 'ava';
import {Money} from '../../domain/Money.js';

// TEST DATA
const VALID_EUR_AMOUNT = 1000;
const VALID_USD_AMOUNT = 1500;
const INVALID_NEGATIVE_AMOUNT = -100;
const EMPTY_CURRENCY = '';
const VALID_EUR_CURRENCY = 'EUR';
const VALID_USD_CURRENCY = 'USD';

test('Money constructor validates positive amounts', t => {
	const validMoney = new Money(VALID_EUR_AMOUNT, VALID_EUR_CURRENCY);

	t.is(validMoney.getAmount(), VALID_EUR_AMOUNT);
	t.is(validMoney.getCurrency(), VALID_EUR_CURRENCY);
});

test('Money constructor throws error for negative amounts', t => {
	const error = t.throws(
		() => new Money(INVALID_NEGATIVE_AMOUNT, VALID_EUR_CURRENCY),
		{instanceOf: Error},
	);

	t.is(error?.message, 'Money amount cannot be negative');
});

test('Money constructor throws error for empty currency', t => {
	const error = t.throws(() => new Money(VALID_EUR_AMOUNT, EMPTY_CURRENCY), {
		instanceOf: Error,
	});

	t.is(error?.message, 'Currency code is required');
});

test('Money.zero creates zero amount money', t => {
	const zeroMoney = Money.zero(VALID_EUR_CURRENCY);

	t.is(zeroMoney.getAmount(), 0);
	t.is(zeroMoney.getCurrency(), VALID_EUR_CURRENCY);
});

test('Money.fromEuros creates EUR money', t => {
	const euroMoney = Money.fromEuros(VALID_EUR_AMOUNT);

	t.is(euroMoney.getAmount(), VALID_EUR_AMOUNT);
	t.is(euroMoney.getCurrency(), 'EUR');
});

test('Money.add adds same currency amounts', t => {
	const money1 = new Money(500, VALID_EUR_CURRENCY);
	const money2 = new Money(300, VALID_EUR_CURRENCY);
	const expectedSum = 800;

	const result = money1.add(money2);

	t.is(result.getAmount(), expectedSum);
	t.is(result.getCurrency(), VALID_EUR_CURRENCY);
});

test('Money.add throws error for different currencies', t => {
	const eurMoney = new Money(VALID_EUR_AMOUNT, VALID_EUR_CURRENCY);
	const usdMoney = new Money(VALID_USD_AMOUNT, VALID_USD_CURRENCY);

	const error = t.throws(() => eurMoney.add(usdMoney), {instanceOf: Error});

	t.is(
		error?.message,
		`Cannot add different currencies: ${VALID_EUR_CURRENCY} and ${VALID_USD_CURRENCY}`,
	);
});

test('Money.subtract subtracts same currency amounts', t => {
	const money1 = new Money(1000, VALID_EUR_CURRENCY);
	const money2 = new Money(300, VALID_EUR_CURRENCY);
	const expectedDifference = 700;

	const result = money1.subtract(money2);

	t.is(result.getAmount(), expectedDifference);
	t.is(result.getCurrency(), VALID_EUR_CURRENCY);
});

test('Money.subtract throws error for negative result', t => {
	const money1 = new Money(300, VALID_EUR_CURRENCY);
	const money2 = new Money(500, VALID_EUR_CURRENCY);

	const error = t.throws(() => money1.subtract(money2), {instanceOf: Error});

	t.is(error?.message, 'Result would be negative');
});

test('Money.multiply multiplies by positive factor', t => {
	const money = new Money(100, VALID_EUR_CURRENCY);
	const factor = 2.5;
	const expectedResult = 250;

	const result = money.multiply(factor);

	t.is(result.getAmount(), expectedResult);
	t.is(result.getCurrency(), VALID_EUR_CURRENCY);
});

test('Money.multiply throws error for negative factor', t => {
	const money = new Money(100, VALID_EUR_CURRENCY);
	const negativeFactor = -2;

	const error = t.throws(() => money.multiply(negativeFactor), {
		instanceOf: Error,
	});

	t.is(error?.message, 'Cannot multiply by negative factor');
});

test('Money.format formats EUR with German locale', t => {
	const money = new Money(1234.56, 'EUR');
	const expectedFormat = '1.234,56\u00A0€';

	const result = money.format('de-DE');

	t.is(result, expectedFormat);
});

test('Money.format formats USD with fallback', t => {
	const money = new Money(1234, 'USD');
	const expectedFormat = 'USD 1.234';

	const result = money.format('de-DE');

	t.is(result, expectedFormat);
});

test('Money.formatSimple formats EUR with simple format', t => {
	const money = new Money(1234.56, 'EUR');
	const expectedFormat = '€1,235';

	const result = money.formatSimple();

	t.is(result, expectedFormat);
});

test('Money.formatSimple formats other currencies', t => {
	const money = new Money(1234, 'USD');
	const expectedFormat = 'USD1,234';

	const result = money.formatSimple();

	t.is(result, expectedFormat);
});

test('Money.equals compares money objects correctly', t => {
	const money1 = new Money(100, VALID_EUR_CURRENCY);
	const money2 = new Money(100, VALID_EUR_CURRENCY);
	const money3 = new Money(200, VALID_EUR_CURRENCY);
	const money4 = new Money(100, VALID_USD_CURRENCY);

	t.true(money1.equals(money2));
	t.false(money1.equals(money3));
	t.false(money1.equals(money4));
});

test('Money.isGreaterThan compares same currency amounts', t => {
	const money1 = new Money(200, VALID_EUR_CURRENCY);
	const money2 = new Money(100, VALID_EUR_CURRENCY);

	t.true(money1.isGreaterThan(money2));
	t.false(money2.isGreaterThan(money1));
});

test('Money.isGreaterThan throws error for different currencies', t => {
	const eurMoney = new Money(100, VALID_EUR_CURRENCY);
	const usdMoney = new Money(100, VALID_USD_CURRENCY);

	const error = t.throws(() => eurMoney.isGreaterThan(usdMoney), {
		instanceOf: Error,
	});

	t.is(
		error?.message,
		`Cannot compare different currencies: ${VALID_EUR_CURRENCY} and ${VALID_USD_CURRENCY}`,
	);
});

test('Money.isLessThan compares same currency amounts', t => {
	const money1 = new Money(100, VALID_EUR_CURRENCY);
	const money2 = new Money(200, VALID_EUR_CURRENCY);

	t.true(money1.isLessThan(money2));
	t.false(money2.isLessThan(money1));
});

test('Money.toNumber returns numeric amount', t => {
	const money = new Money(123.45, VALID_EUR_CURRENCY);

	t.is(money.toNumber(), 123.45);
});

test('Money.toString returns formatted string', t => {
	const money = new Money(1234, 'EUR');
	const expectedString = '€1,234';

	t.is(money.toString(), expectedString);
});

test('Money immutability: operations return new instances', t => {
	const originalMoney = new Money(100, VALID_EUR_CURRENCY);
	const addMoney = new Money(50, VALID_EUR_CURRENCY);

	const result = originalMoney.add(addMoney);

	t.is(originalMoney.getAmount(), 100);
	t.is(result.getAmount(), 150);
	t.not(originalMoney, result);
});

test('Money handles zero amounts correctly', t => {
	const zeroMoney = Money.zero(VALID_EUR_CURRENCY);
	const regularMoney = new Money(100, VALID_EUR_CURRENCY);

	const addResult = zeroMoney.add(regularMoney);
	const multiplyResult = zeroMoney.multiply(5);

	t.is(addResult.getAmount(), 100);
	t.is(multiplyResult.getAmount(), 0);
});

test('Money handles decimal precision correctly', t => {
	const money1 = new Money(0.1, VALID_EUR_CURRENCY);
	const money2 = new Money(0.2, VALID_EUR_CURRENCY);

	const result = money1.add(money2);

	t.is(result.getAmount(), 0.300_000_000_000_000_04); // JavaScript floating point
});
