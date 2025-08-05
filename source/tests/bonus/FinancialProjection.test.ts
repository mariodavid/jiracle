import test from 'ava';
import {FinancialProjection} from '../../bonus/BonusCalculator.js';
import {Money} from '../../domain/Money.js';

// TEST DATA
const EUR_CURRENCY = 'EUR';
const USD_CURRENCY = 'USD';
const CURRENT_AMOUNT_EUR = Money.fromEuros(5000);
const PROJECTED_AMOUNT_EUR = Money.fromEuros(12_000);
const MAXIMUM_AMOUNT_EUR = Money.fromEuros(15_000);

const PROJECTED_AMOUNT_USD = new Money(14_000, USD_CURRENCY);

test('FinancialProjection.create creates projection with same currency', t => {
	const projection = FinancialProjection.create({
		currentAmount: CURRENT_AMOUNT_EUR,
		projectedAmount: PROJECTED_AMOUNT_EUR,
		maximumPossible: MAXIMUM_AMOUNT_EUR,
	});

	t.true(projection.currentAmount.equals(CURRENT_AMOUNT_EUR));
	t.true(projection.projectedAmount.equals(PROJECTED_AMOUNT_EUR));
	t.true(projection.maximumPossible.equals(MAXIMUM_AMOUNT_EUR));
	t.is(projection.currency, EUR_CURRENCY);
});

test('FinancialProjection.create throws error for mixed currencies', t => {
	const error = t.throws(
		() =>
			FinancialProjection.create({
				currentAmount: CURRENT_AMOUNT_EUR, // EUR
				projectedAmount: PROJECTED_AMOUNT_USD, // USD - different!
				maximumPossible: MAXIMUM_AMOUNT_EUR, // EUR
			}),
		{instanceOf: Error},
	);

	t.is(
		error?.message,
		'All financial projection amounts must use the same currency',
	);
});

test('FinancialProjection maintains Money object benefits', t => {
	const projection = FinancialProjection.create({
		currentAmount: CURRENT_AMOUNT_EUR,
		projectedAmount: PROJECTED_AMOUNT_EUR,
		maximumPossible: MAXIMUM_AMOUNT_EUR,
	});

	// Test that Money objects maintain their behavior
	t.is(projection.currentAmount.formatSimple(), '€5,000');
	t.is(projection.projectedAmount.formatSimple(), '€12,000');
	t.is(projection.maximumPossible.formatSimple(), '€15,000');
});

test('FinancialProjection supports Money arithmetic operations', t => {
	const projection = FinancialProjection.create({
		currentAmount: CURRENT_AMOUNT_EUR,
		projectedAmount: PROJECTED_AMOUNT_EUR,
		maximumPossible: MAXIMUM_AMOUNT_EUR,
	});

	// Calculate remaining potential
	const remainingPotential = projection.maximumPossible.subtract(
		projection.currentAmount,
	);
	const expectedRemaining = Money.fromEuros(10_000); // 15000 - 5000

	t.true(remainingPotential.equals(expectedRemaining));
});

test('FinancialProjection supports Money comparison operations', t => {
	const projection = FinancialProjection.create({
		currentAmount: CURRENT_AMOUNT_EUR,
		projectedAmount: PROJECTED_AMOUNT_EUR,
		maximumPossible: MAXIMUM_AMOUNT_EUR,
	});

	// Test various comparisons
	t.true(projection.projectedAmount.isGreaterThan(projection.currentAmount));
	t.true(projection.maximumPossible.isGreaterThan(projection.projectedAmount));
	t.false(projection.currentAmount.isGreaterThan(projection.maximumPossible));
});

test('FinancialProjection currency consistency validation', t => {
	// All EUR - should work
	t.notThrows(() =>
		FinancialProjection.create({
			currentAmount: Money.fromEuros(1000),
			projectedAmount: Money.fromEuros(2000),
			maximumPossible: Money.fromEuros(3000),
		}),
	);

	// Mixed currencies - should fail
	t.throws(
		() =>
			FinancialProjection.create({
				currentAmount: Money.fromEuros(1000), // EUR
				projectedAmount: new Money(2000, 'USD'), // USD
				maximumPossible: Money.fromEuros(3000), // EUR
			}),
		{instanceOf: Error},
	);
});

test('FinancialProjection preserves Money immutability', t => {
	const originalCurrent = Money.fromEuros(5000);
	const originalProjected = Money.fromEuros(12_000);
	const originalMaximum = Money.fromEuros(15_000);

	const projection = FinancialProjection.create({
		currentAmount: originalCurrent,
		projectedAmount: originalProjected,
		maximumPossible: originalMaximum,
	});

	// Modify projection amounts (should not affect originals)
	const modifiedCurrent = projection.currentAmount.add(Money.fromEuros(1000));

	// Original Money objects should be unchanged
	t.is(originalCurrent.getAmount(), 5000);
	t.is(projection.currentAmount.getAmount(), 5000);
	t.is(modifiedCurrent.getAmount(), 6000);
});

test('FinancialProjection handles zero amounts correctly', t => {
	const zeroAmount = Money.zero(EUR_CURRENCY);
	const projection = FinancialProjection.create({
		currentAmount: zeroAmount,
		projectedAmount: PROJECTED_AMOUNT_EUR,
		maximumPossible: MAXIMUM_AMOUNT_EUR,
	});

	t.is(projection.currentAmount.getAmount(), 0);
	t.is(projection.currency, EUR_CURRENCY);
	t.true(projection.projectedAmount.isGreaterThan(projection.currentAmount));
});

test('FinancialProjection supports different currency types', t => {
	// Test with USD
	const usdProjection = FinancialProjection.create({
		currentAmount: new Money(5000, USD_CURRENCY),
		projectedAmount: new Money(12_000, USD_CURRENCY),
		maximumPossible: new Money(15_000, USD_CURRENCY),
	});

	t.is(usdProjection.currency, USD_CURRENCY);
	t.is(usdProjection.currentAmount.formatSimple(), 'USD5,000');

	// Test with custom currency
	const customCurrency = 'GBP';
	const gbpProjection = FinancialProjection.create({
		currentAmount: new Money(4000, customCurrency),
		projectedAmount: new Money(10_000, customCurrency),
		maximumPossible: new Money(12_000, customCurrency),
	});

	t.is(gbpProjection.currency, customCurrency);
});

test('FinancialProjection integration with realistic financial calculations', t => {
	// Simulate real bonus calculation scenario
	const targetAmount = Money.fromEuros(10_000);
	const currentEarned = targetAmount.multiply(0.5); // 50% bonus earned so far

	const yearEndProjection = targetAmount.multiply(1.2); // Projected 120% of target
	const maxPossible = targetAmount.multiply(1.5); // Maximum 150% possible

	const projection = FinancialProjection.create({
		currentAmount: currentEarned,
		projectedAmount: yearEndProjection,
		maximumPossible: maxPossible,
	});

	// Verify realistic financial relationships
	t.true(projection.projectedAmount.isGreaterThan(projection.currentAmount));
	t.true(projection.maximumPossible.isGreaterThan(projection.projectedAmount));

	// Check specific amounts
	t.is(projection.currentAmount.getAmount(), 5000); // 50% of 10k
	t.is(projection.projectedAmount.getAmount(), 12_000); // 120% of 10k
	t.is(projection.maximumPossible.getAmount(), 15_000); // 150% of 10k
});
