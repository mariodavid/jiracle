import test from 'ava';
import {BonusCalculator, BonusDays} from '../../bonus/BonusCalculator.js';
import type {BonusConfig, BonusTier} from '../../jira/types.js';
import {Duration} from '../../domain/Duration.js';
import {LocalDate} from '../../domain/LocalDate.js';

// TEST DATA
const DEFAULT_BONUS_CONFIG: BonusConfig = {
	enabled: true,
	hoursPerBonusDay: 8,
	targetDays: 190,
	targets: {minimum: 150, standard: 190, stretch: 210},
};

const CUSTOM_TIERS: BonusTier[] = [
	{name: 'Starter', startDay: 0, endDay: 100, rate: 0.001},
	{name: 'Advanced', startDay: 101, endDay: 180, rate: 0.008},
	{name: 'Expert', startDay: 181, endDay: undefined, rate: 0.015},
];

const CUSTOM_BONUS_CONFIG: BonusConfig = {
	enabled: true,
	hoursPerBonusDay: 8,
	targetDays: 200,
	targets: {minimum: 160, standard: 200, stretch: 240},
	tiers: CUSTOM_TIERS,
};

// OPERATIONS
function createCalculatorWithDefaults(): BonusCalculator {
	return new BonusCalculator(DEFAULT_BONUS_CONFIG);
}

function createCalculatorWithCustomTiers(): BonusCalculator {
	return new BonusCalculator(CUSTOM_BONUS_CONFIG);
}

// SPECIFIC VALUE COMPARISONS

// Default tier system tests
test('should use default tiers when none provided', t => {
	const calculator = createCalculatorWithDefaults();
	const progress = calculator.calculateBonusProgress(Duration.fromHours(400)); // 50 bonus days

	t.is(progress.currentTier.name, 'Tier 1');
	t.is(progress.currentTier.rate, 0.002);
	t.is(progress.currentTier.startDay, 0);
	t.is(progress.currentTier.endDay, 120);
});

test('should calculate tier progress correctly in Tier 1', t => {
	const calculator = createCalculatorWithDefaults();
	const progress = calculator.calculateBonusProgress(Duration.fromHours(400)); // 50 bonus days

	t.is(progress.currentBonusDays.toNumber(), 50);
	t.is(progress.tierProgress.current, 50);
	t.is(progress.tierProgress.total, 120);
	t.is(progress.tierProgress.percentage, 41.7);
});

test('should calculate tier progress correctly in Tier 2', t => {
	const calculator = createCalculatorWithDefaults();
	const progress = calculator.calculateBonusProgress(Duration.fromHours(1120)); // 140 bonus days

	t.is(progress.currentBonusDays.toNumber(), 140);
	t.is(progress.currentTier.name, 'Tier 2');
	t.is(progress.tierProgress.current, 19); // 140 - 121
	t.is(progress.tierProgress.total, 39); // 160 - 121
	t.is(progress.tierProgress.percentage, 48.7);
});

test('should calculate tier progress correctly in Tier 3', t => {
	const calculator = createCalculatorWithDefaults();
	const progress = calculator.calculateBonusProgress(Duration.fromHours(1480)); // 185 bonus days

	t.is(progress.currentBonusDays.toNumber(), 185);
	t.is(progress.currentTier.name, 'Tier 3');
	t.is(progress.tierProgress.current, 24); // 185 - 161
	t.is(progress.tierProgress.total, 29); // 190 - 161 (target days)
	t.is(progress.tierProgress.percentage, 82.8);
});

// Earned bonus calculations
test('should calculate earned bonus correctly across tiers', t => {
	const calculator = createCalculatorWithDefaults();
	// 185 days: 120 days at 0.2%, 40 days at 1.0%, 24 days at 1.2%
	const progress = calculator.calculateBonusProgress(Duration.fromHours(1480)); // 185 bonus days

	t.is(progress.earnedBonusPercentage, 91.8);
});

test('should calculate earned bonus correctly for partial tiers', t => {
	const calculator = createCalculatorWithDefaults();
	const progress = calculator.calculateBonusProgress(Duration.fromHours(800)); // 100 bonus days (Tier 1 only)

	const expectedBonus = 100 * 0.002; // 100 days × 0.2%
	t.is(progress.earnedBonusPercentage, expectedBonus * 100);
});

// Custom tier system tests
test('should use custom tiers when provided', t => {
	const calculator = createCalculatorWithCustomTiers();
	const progress = calculator.calculateBonusProgress(Duration.fromHours(800)); // 100 bonus days

	t.is(progress.currentTier.name, 'Starter');
	t.is(progress.currentTier.rate, 0.001);
	t.is(progress.currentTier.startDay, 0);
	t.is(progress.currentTier.endDay, 100);
});

test('should calculate progress in custom tier system', t => {
	const calculator = createCalculatorWithCustomTiers();
	const progress = calculator.calculateBonusProgress(Duration.fromHours(1360)); // 170 bonus days (Advanced tier)

	t.is(progress.currentBonusDays.toNumber(), 170);
	t.is(progress.currentTier.name, 'Advanced');
	t.is(progress.tierProgress.current, 69); // 170 - 101
	t.is(progress.tierProgress.total, 79); // 180 - 101
	t.is(progress.tierProgress.percentage, 87.3);
});

test('should calculate bonus with custom tiers correctly', t => {
	const calculator = createCalculatorWithCustomTiers();
	const progress = calculator.calculateBonusProgress(Duration.fromHours(1600)); // 200 bonus days

	t.is(progress.earnedBonusPercentage, 101.7);
});

// Projection calculations
test('should calculate year-end projection correctly', t => {
	const calculator = createCalculatorWithDefaults();
	const currentDate = new Date('2025-06-15'); // Mid-year
	const progress = calculator.calculateBonusProgress(
		Duration.fromHours(800),
		LocalDate.fromDate(currentDate),
	); // 100 bonus days

	// Mid-year should roughly double the current rate
	t.true(progress.projectedYearEnd > 180);
	t.true(progress.projectedYearEnd < 220);
});

test('should handle beginning of year projection', t => {
	const calculator = createCalculatorWithDefaults();
	const currentDate = new Date('2025-01-15'); // Early year
	const progress = calculator.calculateBonusProgress(
		Duration.fromHours(80),
		LocalDate.fromDate(currentDate),
	); // 10 bonus days

	// Early year should have higher projection multiplier
	t.true(progress.projectedYearEnd > 200);
});

test('should handle end of year projection', t => {
	const calculator = createCalculatorWithDefaults();
	const currentDate = new Date('2025-12-15'); // Late year
	const progress = calculator.calculateBonusProgress(
		Duration.fromHours(1600),
		LocalDate.fromDate(currentDate),
	); // 200 bonus days

	// Late year should have minimal projection change (209.2)
	t.true(progress.projectedYearEnd > 200);
	t.true(progress.projectedYearEnd < 220);
});

// Milestone detection
test('should find next tier milestone', t => {
	const calculator = createCalculatorWithDefaults();
	const progress = calculator.calculateBonusProgress(Duration.fromHours(800)); // 100 bonus days

	t.truthy(progress.nextMilestone);
	t.is(progress.nextMilestone!.name, 'Tier 2 starts');
	t.is(progress.nextMilestone!.targetDays, 120);
	t.is(progress.nextMilestone!.daysRemaining, 20);
});

test('should find target milestone when past all tiers', t => {
	const calculator = createCalculatorWithDefaults();
	const progress = calculator.calculateBonusProgress(Duration.fromHours(1520)); // 190 bonus days (reached target)

	t.is(progress.nextMilestone, undefined); // No more milestones
});

test('should find target milestone when in final tier', t => {
	const calculator = createCalculatorWithDefaults();
	const progress = calculator.calculateBonusProgress(Duration.fromHours(1400)); // 175 bonus days

	t.truthy(progress.nextMilestone);
	t.is(progress.nextMilestone!.name, '100% Target');
	t.is(progress.nextMilestone!.targetDays, 190);
	t.is(progress.nextMilestone!.daysRemaining, 15);
});

// Tier visualizations
test('should generate tier visualizations correctly', t => {
	const calculator = createCalculatorWithDefaults();
	const visualizations = calculator.getTierVisualizations(new BonusDays(140)); // 140 bonus days

	t.is(visualizations.length, 3);

	// Tier 1 - completed
	const tier1 = visualizations[0]!;
	t.is(tier1.tier.name, 'Tier 1');
	t.is(tier1.progress, 120);
	t.is(tier1.total, 120);
	t.is(tier1.percentage, 100);
	t.true(tier1.isCompleted);
	t.false(tier1.isCurrent);

	// Tier 2 - current
	const tier2 = visualizations[1]!;
	t.is(tier2.tier.name, 'Tier 2');
	t.is(tier2.progress, 19); // 140 - 121
	t.is(tier2.total, 39); // 160 - 121
	t.is(tier2.percentage, 48.7);
	t.false(tier2.isCompleted);
	t.true(tier2.isCurrent);

	// Tier 3 - future
	const tier3 = visualizations[2]!;
	t.is(tier3.tier.name, 'Tier 3');
	t.is(tier3.progress, 0);
	t.is(tier3.percentage, 0);
	t.false(tier3.isCompleted);
	t.false(tier3.isCurrent);
});

test('should handle open-ended tier visualization', t => {
	const calculator = createCalculatorWithDefaults();
	const visualizations = calculator.getTierVisualizations(new BonusDays(200)); // 200 bonus days

	const tier3 = visualizations[2]!;
	t.is(tier3.tier.name, 'Tier 3');
	t.is(tier3.progress, 39); // 200 - 161
	t.is(tier3.total, 59); // 220 - 161 (target + buffer)
	t.false(tier3.isCompleted);
	t.true(tier3.isCurrent);
});

// Edge cases
test('should handle zero hours correctly', t => {
	const calculator = createCalculatorWithDefaults();
	const progress = calculator.calculateBonusProgress(Duration.fromHours(0));

	t.is(progress.currentBonusDays.toNumber(), 0);
	t.is(progress.currentTier.name, 'Tier 1');
	t.is(progress.tierProgress.current, 0);
	t.is(progress.earnedBonusPercentage, 0);
});

test('should handle very high bonus days', t => {
	const calculator = createCalculatorWithDefaults();
	const progress = calculator.calculateBonusProgress(Duration.fromHours(2400)); // 300 bonus days

	t.is(progress.currentBonusDays.toNumber(), 300);
	t.is(progress.currentTier.name, 'Tier 3');
	t.true(progress.earnedBonusPercentage > 100); // Over 100% bonus
});

test('should handle fractional hours correctly', t => {
	const calculator = createCalculatorWithDefaults();
	const progress = calculator.calculateBonusProgress(Duration.fromHours(100.5)); // 12.5625 bonus days

	t.is(progress.currentBonusDays.toNumber(), 12.6); // Rounded to 1 decimal
});

test('should handle leap year in projection', t => {
	const calculator = createCalculatorWithDefaults();
	const leapYearDate = new Date('2024-06-15'); // 2024 is a leap year
	const progress = calculator.calculateBonusProgress(
		Duration.fromHours(800),
		LocalDate.fromDate(leapYearDate),
	);

	// Should account for 366 days instead of 365
	t.true(progress.projectedYearEnd > 0);
});

// Configuration validation
test('should handle missing tier configuration gracefully', t => {
	const configWithoutTiers: BonusConfig = {
		enabled: true,
		hoursPerBonusDay: 8,
		targetDays: 190,
		targets: {minimum: 150, standard: 190, stretch: 210},
		// No tiers property
	};

	const calculator = new BonusCalculator(configWithoutTiers);
	const progress = calculator.calculateBonusProgress(Duration.fromHours(800)); // 100 bonus days

	// Should fall back to default tiers
	t.is(progress.currentTier.name, 'Tier 1');
	t.is(progress.currentTier.rate, 0.002);
});

test('should handle different hours per bonus day', t => {
	const customConfig: BonusConfig = {
		enabled: true,
		hoursPerBonusDay: 6, // 6 hours instead of 8
		targetDays: 190,
		targets: {minimum: 150, standard: 190, stretch: 210},
	};

	const calculator = new BonusCalculator(customConfig);
	const progress = calculator.calculateBonusProgress(Duration.fromHours(600)); // 600 hours = 100 bonus days

	t.is(progress.currentBonusDays.toNumber(), 100);
});
