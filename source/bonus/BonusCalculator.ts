import type {BonusConfig, BonusTier} from '../jira/types.js';
import {LocalDate} from '../domain/LocalDate.js';
import {type Duration} from '../domain/Duration.js';

/**
 * Rich domain object representing bonus days with validation and behavior
 */
export class BonusDays {
	static fromHours(totalHours: Duration, hoursPerBonusDay: number): BonusDays {
		return new BonusDays(totalHours.toHours() / hoursPerBonusDay);
	}

	constructor(private readonly value: number) {
		if (value < 0) {
			throw new Error(`Bonus days cannot be negative: ${value}`);
		}
	}

	toNumber(): number {
		return Math.round(this.value * 10) / 10;
	}

	isGreaterThan(other: number): boolean {
		return this.value > other;
	}

	isLessThan(other: number): boolean {
		return this.value < other;
	}

	subtract(other: number): number {
		return this.value - other;
	}
}

/**
 * Rich domain object for bonus progress with encapsulated calculations
 */
export class BonusProgress {
	/**
	 * Create BonusProgress with calculated values
	 */
	static create(data: {
		bonusDays: BonusDays;
		currentTier: BonusTier;
		tierProgress: {current: number; total: number; percentage: number};
		earnedBonusPercentage: number;
		projectedYearEnd: number;
		nextMilestone?: {name: string; daysRemaining: number; targetDays: number};
	}): BonusProgress {
		return new BonusProgress({
			currentBonusDays: data.bonusDays,
			currentTier: data.currentTier,
			tierProgress: data.tierProgress,
			earnedBonusPercentage: Math.round(data.earnedBonusPercentage * 100) / 100,
			projectedYearEnd: Math.round(data.projectedYearEnd * 10) / 10,
			nextMilestone: data.nextMilestone,
		});
	}

	public readonly currentBonusDays: BonusDays;
	public readonly currentTier: BonusTier;
	public readonly tierProgress: {
		current: number;
		total: number;
		percentage: number;
	};

	public readonly earnedBonusPercentage: number;

	public readonly projectedYearEnd: number;

	public readonly nextMilestone?: {
		name: string;
		daysRemaining: number;
		targetDays: number;
	};

	constructor(data: {
		currentBonusDays: BonusDays;
		currentTier: BonusTier;
		tierProgress: {
			current: number;
			total: number;
			percentage: number;
		};
		earnedBonusPercentage: number;
		projectedYearEnd: number;
		nextMilestone?: {
			name: string;
			daysRemaining: number;
			targetDays: number;
		};
	}) {
		this.currentBonusDays = data.currentBonusDays;
		this.currentTier = data.currentTier;
		this.tierProgress = data.tierProgress;
		this.earnedBonusPercentage = data.earnedBonusPercentage;
		this.projectedYearEnd = data.projectedYearEnd;
		this.nextMilestone = data.nextMilestone;
	}
}

/**
 * Rich domain object for tier visualization with behavior
 */
export class TierVisualization {
	/**
	 * Create TierVisualization with calculated values
	 */
	static create(
		tier: BonusTier,
		currentBonusDays: BonusDays,
		targetDays: number,
	): TierVisualization {
		const tierStart = tier.startDay;
		const tierEnd = tier.endDay ?? targetDays + 30;
		const tierSize = tierEnd - tierStart;

		const progress = Math.max(
			0,
			Math.min(currentBonusDays.toNumber() - tierStart, tierSize),
		);
		const percentage = tierSize > 0 ? (progress / tierSize) * 100 : 0;

		return new TierVisualization({
			tier,
			progress: Math.round(progress * 10) / 10,
			total: tierSize,
			percentage: Math.round(percentage * 10) / 10,
			isCompleted: currentBonusDays.toNumber() >= tierEnd,
			isCurrent:
				currentBonusDays.toNumber() >= tierStart &&
				currentBonusDays.toNumber() < tierEnd,
		});
	}

	public readonly tier: BonusTier;

	public readonly progress: number;

	public readonly total: number;

	public readonly percentage: number;

	public readonly isCompleted: boolean;

	public readonly isCurrent: boolean;

	constructor(data: {
		tier: BonusTier;
		progress: number;
		total: number;
		percentage: number;
		isCompleted: boolean;
		isCurrent: boolean;
	}) {
		this.tier = data.tier;
		this.progress = data.progress;
		this.total = data.total;
		this.percentage = data.percentage;
		this.isCompleted = data.isCompleted;
		this.isCurrent = data.isCurrent;
	}
}

export class BonusCalculator {
	private readonly defaultTiers: BonusTier[] = [
		{
			name: 'Tier 1',
			startDay: 0,
			endDay: 120,
			rate: 0.002,
		},
		{
			name: 'Tier 2',
			startDay: 121,
			endDay: 160,
			rate: 0.01,
		},
		{
			name: 'Tier 3',
			startDay: 161,
			endDay: undefined,
			rate: 0.012,
		},
	];

	constructor(private readonly config: BonusConfig) {}

	calculateBonusProgress(
		totalHours: Duration,
		currentDate?: LocalDate,
	): BonusProgress {
		const bonusDays = BonusDays.fromHours(
			totalHours,
			this.config.hoursPerBonusDay,
		);
		const tiers = this.config.tiers ?? this.defaultTiers;

		const currentTier = this.getCurrentTier(bonusDays, tiers);
		const tierProgress = this.calculateTierProgress(bonusDays, currentTier);
		const earnedBonusPercentage = this.calculateEarnedBonus(bonusDays, tiers);
		const projectedYearEnd = this.calculateProjection(
			bonusDays,
			currentDate ?? LocalDate.today(),
		);
		const nextMilestone = this.findNextMilestone(bonusDays, tiers);

		return BonusProgress.create({
			bonusDays,
			currentTier,
			tierProgress,
			earnedBonusPercentage,
			projectedYearEnd,
			nextMilestone,
		});
	}

	getTierVisualizations(currentBonusDays: BonusDays): TierVisualization[] {
		const tiers = this.config.tiers ?? this.defaultTiers;

		return tiers.map(tier =>
			TierVisualization.create(tier, currentBonusDays, this.config.targetDays),
		);
	}

	private getCurrentTier(bonusDays: BonusDays, tiers: BonusTier[]): BonusTier {
		// Find the tier where bonusDays falls within the range
		for (const tier of tiers) {
			if (
				bonusDays.toNumber() >= tier.startDay &&
				(tier.endDay === undefined || bonusDays.toNumber() <= tier.endDay)
			) {
				return tier;
			}
		}

		// Fallback to first tier if no match found
		return tiers[0]!;
	}

	private calculateTierProgress(
		bonusDays: BonusDays,
		currentTier: BonusTier,
	): {current: number; total: number; percentage: number} {
		const tierStart = currentTier.startDay;
		const tierEnd = currentTier.endDay ?? this.config.targetDays;
		const tierSize = tierEnd - tierStart;
		const current = Math.max(0, bonusDays.subtract(tierStart));
		const percentage = tierSize > 0 ? (current / tierSize) * 100 : 0;

		return {
			current: Math.round(current * 10) / 10,
			total: tierSize,
			percentage: Math.round(percentage * 10) / 10,
		};
	}

	private calculateEarnedBonus(
		bonusDays: BonusDays,
		tiers: BonusTier[],
	): number {
		let earnedBonus = 0;

		for (const tier of tiers) {
			const tierStart = tier.startDay;
			const tierEnd = tier.endDay ?? Number.POSITIVE_INFINITY;

			if (bonusDays.isGreaterThan(tierStart)) {
				const daysInTier = Math.min(bonusDays.toNumber(), tierEnd) - tierStart;
				earnedBonus += daysInTier * tier.rate;
			}
		}

		return earnedBonus * 100; // Convert to percentage
	}

	private calculateProjection(
		bonusDays: BonusDays,
		currentDate: LocalDate,
	): number {
		return currentDate.projectAnnualRate(bonusDays.toNumber());
	}

	private findNextMilestone(
		bonusDays: BonusDays,
		tiers: BonusTier[],
	): {name: string; daysRemaining: number; targetDays: number} | undefined {
		// Check for tier transitions first
		for (const tier of tiers) {
			if (tier.endDay && bonusDays.isLessThan(tier.endDay)) {
				const nextTierName = this.getNextTierName(tier, tiers);
				return {
					name: `${nextTierName} starts`,
					daysRemaining:
						Math.round((tier.endDay - bonusDays.toNumber()) * 10) / 10,
					targetDays: tier.endDay,
				};
			}
		}

		// Check for target milestone
		if (bonusDays.isLessThan(this.config.targetDays)) {
			return {
				name: '100% Target',
				daysRemaining:
					Math.round((this.config.targetDays - bonusDays.toNumber()) * 10) / 10,
				targetDays: this.config.targetDays,
			};
		}

		return undefined;
	}

	private getNextTierName(currentTier: BonusTier, tiers: BonusTier[]): string {
		const currentIndex = tiers.indexOf(currentTier);
		const nextTier = tiers[currentIndex + 1];
		return nextTier?.name ?? 'Final Tier';
	}
}
