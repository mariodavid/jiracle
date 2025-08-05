import type {BonusConfig, BonusTier, BonusTarget} from '../jira/types.js';
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
 * Rich domain object for financial projections
 */
export class FinancialProjection {
	static create(data: {
		currentAmount: number;
		projectedAmount: number;
		maximumPossible: number;
		currency: string;
	}): FinancialProjection {
		return new FinancialProjection({
			currentAmount: Math.round(data.currentAmount * 100) / 100,
			projectedAmount: Math.round(data.projectedAmount * 100) / 100,
			maximumPossible: Math.round(data.maximumPossible * 100) / 100,
			currency: data.currency,
		});
	}

	public readonly currentAmount: number;
	public readonly projectedAmount: number;
	public readonly maximumPossible: number;
	public readonly currency: string;

	constructor(data: {
		currentAmount: number;
		projectedAmount: number;
		maximumPossible: number;
		currency: string;
	}) {
		this.currentAmount = data.currentAmount;
		this.projectedAmount = data.projectedAmount;
		this.maximumPossible = data.maximumPossible;
		this.currency = data.currency;
	}
}

/**
 * Rich domain object for target progress tracking
 */
export class TargetProgress {
	static create(
		target: BonusTarget,
		currentBonusDays: BonusDays,
		targetAmount: number,
	): TargetProgress {
		const progress = Math.min(currentBonusDays.toNumber(), target.days);
		const percentage = (progress / target.days) * 100;
		const isAchieved = currentBonusDays.toNumber() >= target.days;
		const projectedAmount = (targetAmount * target.percentage) / 100;

		return new TargetProgress({
			target,
			progress: Math.round(progress * 10) / 10,
			percentage: Math.round(percentage * 10) / 10,
			isAchieved,
			projectedAmount: Math.round(projectedAmount * 100) / 100,
		});
	}

	public readonly target: BonusTarget;
	public readonly progress: number;
	public readonly percentage: number;
	public readonly isAchieved: boolean;
	public readonly projectedAmount: number;

	constructor(data: {
		target: BonusTarget;
		progress: number;
		percentage: number;
		isAchieved: boolean;
		projectedAmount: number;
	}) {
		this.target = data.target;
		this.progress = data.progress;
		this.percentage = data.percentage;
		this.isAchieved = data.isAchieved;
		this.projectedAmount = data.projectedAmount;
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
		financialProjection: FinancialProjection;
		targetProgresses: TargetProgress[];
	}): BonusProgress {
		return new BonusProgress({
			currentBonusDays: data.bonusDays,
			currentTier: data.currentTier,
			tierProgress: data.tierProgress,
			earnedBonusPercentage: Math.round(data.earnedBonusPercentage * 100) / 100,
			projectedYearEnd: Math.round(data.projectedYearEnd * 10) / 10,
			nextMilestone: data.nextMilestone,
			financialProjection: data.financialProjection,
			targetProgresses: data.targetProgresses,
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

	public readonly financialProjection: FinancialProjection;

	public readonly targetProgresses: TargetProgress[];

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
		financialProjection: FinancialProjection;
		targetProgresses: TargetProgress[];
	}) {
		this.currentBonusDays = data.currentBonusDays;
		this.currentTier = data.currentTier;
		this.tierProgress = data.tierProgress;
		this.earnedBonusPercentage = data.earnedBonusPercentage;
		this.projectedYearEnd = data.projectedYearEnd;
		this.nextMilestone = data.nextMilestone;
		this.financialProjection = data.financialProjection;
		this.targetProgresses = data.targetProgresses;
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

	private readonly defaultTargets: Record<string, BonusTarget> = {
		minimum: {days: 150, label: 'Minimum', percentage: 79},
		standard: {days: 190, label: 'Standard', percentage: 100},
		stretch: {days: 210, label: 'Stretch', percentage: 128},
		maximum: {days: 230, label: 'Maximum', percentage: 148},
	};

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
		const targets = this.getTargets();

		const currentTier = this.getCurrentTier(bonusDays, tiers);
		const tierProgress = this.calculateTierProgress(bonusDays, currentTier);
		const earnedBonusPercentage = this.calculateEarnedBonus(bonusDays, tiers);
		const projectedYearEnd = this.calculateProjection(
			bonusDays,
			currentDate ?? LocalDate.today(),
		);
		const nextMilestone = this.findNextMilestone(bonusDays, tiers, targets);

		const financialProjection = this.calculateFinancialProjection(
			bonusDays,
			projectedYearEnd,
			tiers,
		);

		const targetProgresses = this.calculateTargetProgresses(bonusDays, targets);

		return BonusProgress.create({
			bonusDays,
			currentTier,
			tierProgress,
			earnedBonusPercentage,
			projectedYearEnd,
			nextMilestone,
			financialProjection,
			targetProgresses,
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

	private getTargets(): Record<string, BonusTarget> {
		if (this.config.targets) {
			return {
				minimum: this.config.targets.minimum,
				standard: this.config.targets.standard,
				stretch: this.config.targets.stretch,
				maximum: this.config.targets.maximum,
			};
		}

		return this.defaultTargets;
	}

	private calculateFinancialProjection(
		bonusDays: BonusDays,
		projectedYearEnd: number,
		tiers: BonusTier[],
	): FinancialProjection {
		const targetAmount = this.config.targetAmount || 10_000;
		const currency = this.config.currency || 'EUR';

		const currentAmount = this.calculateBonusAmount(
			bonusDays.toNumber(),
			tiers,
			targetAmount,
		);
		const projectedAmount = this.calculateBonusAmount(
			projectedYearEnd,
			tiers,
			targetAmount,
		);
		const maximumPossible = this.calculateBonusAmount(250, tiers, targetAmount); // Cap at 250 days

		return FinancialProjection.create({
			currentAmount,
			projectedAmount,
			maximumPossible,
			currency,
		});
	}

	private calculateTargetProgresses(
		bonusDays: BonusDays,
		targets: Record<string, BonusTarget>,
	): TargetProgress[] {
		const targetAmount = this.config.targetAmount || 10_000;

		return Object.values(targets).map(target =>
			TargetProgress.create(target, bonusDays, targetAmount),
		);
	}

	private calculateBonusAmount(
		days: number,
		tiers: BonusTier[],
		targetAmount: number,
	): number {
		let amount = 0;

		for (const tier of tiers) {
			const tierStart = tier.startDay;
			const tierEnd = tier.endDay ?? Number.POSITIVE_INFINITY;

			if (days > tierStart) {
				const daysInTier = Math.min(days, tierEnd) - tierStart;
				amount += daysInTier * tier.rate * targetAmount;
			}
		}

		return amount;
	}

	private findNextMilestone(
		bonusDays: BonusDays,
		tiers: BonusTier[],
		targets: Record<string, BonusTarget>,
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

		// Check for target milestones
		const targetsList = Object.values(targets).sort((a, b) => a.days - b.days);
		for (const target of targetsList) {
			if (bonusDays.isLessThan(target.days)) {
				const targetAmount = this.config.targetAmount || 10_000;
				const projectedAmount = (targetAmount * target.percentage) / 100;

				return {
					name: `${target.label} (€${projectedAmount.toLocaleString()})`,
					daysRemaining:
						Math.round((target.days - bonusDays.toNumber()) * 10) / 10,
					targetDays: target.days,
				};
			}
		}

		return undefined;
	}

	private getNextTierName(currentTier: BonusTier, tiers: BonusTier[]): string {
		const currentIndex = tiers.indexOf(currentTier);
		const nextTier = tiers[currentIndex + 1];
		return nextTier?.name ?? 'Final Tier';
	}
}
