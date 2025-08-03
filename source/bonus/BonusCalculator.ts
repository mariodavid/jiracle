import type {BonusConfig, BonusTier} from '../jira/types.js';

export type BonusProgress = {
	currentBonusDays: number;
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
};

export type TierVisualization = {
	tier: BonusTier;
	progress: number;
	total: number;
	percentage: number;
	isCompleted: boolean;
	isCurrent: boolean;
};

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
		totalHours: number,
		currentDate?: Date,
	): BonusProgress {
		const bonusDays = totalHours / this.config.hoursPerBonusDay;
		const tiers = this.config.tiers ?? this.defaultTiers;

		const currentTier = this.getCurrentTier(bonusDays, tiers);
		const tierProgress = this.calculateTierProgress(bonusDays, currentTier);
		const earnedBonusPercentage = this.calculateEarnedBonus(bonusDays, tiers);
		const projectedYearEnd = this.calculateProjection(
			bonusDays,
			currentDate ?? new Date(),
		);
		const nextMilestone = this.findNextMilestone(bonusDays, tiers);

		return {
			currentBonusDays: Math.round(bonusDays * 10) / 10,
			currentTier,
			tierProgress,
			earnedBonusPercentage: Math.round(earnedBonusPercentage * 100) / 100,
			projectedYearEnd: Math.round(projectedYearEnd * 10) / 10,
			nextMilestone,
		};
	}

	getTierVisualizations(currentBonusDays: number): TierVisualization[] {
		const tiers = this.config.tiers ?? this.defaultTiers;

		return tiers.map(tier => {
			const tierStart = tier.startDay;
			const tierEnd = tier.endDay ?? this.config.targetDays + 30; // Add buffer for open-ended tier
			const tierSize = tierEnd - tierStart;

			const progress = Math.max(
				0,
				Math.min(currentBonusDays - tierStart, tierSize),
			);
			const percentage = tierSize > 0 ? (progress / tierSize) * 100 : 0;

			return {
				tier,
				progress: Math.round(progress * 10) / 10,
				total: tierSize,
				percentage: Math.round(percentage * 10) / 10,
				isCompleted: currentBonusDays >= tierEnd,
				isCurrent: currentBonusDays >= tierStart && currentBonusDays < tierEnd,
			};
		});
	}

	private getCurrentTier(bonusDays: number, tiers: BonusTier[]): BonusTier {
		// Find the tier where bonusDays falls within the range
		for (const tier of tiers) {
			if (
				bonusDays >= tier.startDay &&
				(tier.endDay === undefined || bonusDays <= tier.endDay)
			) {
				return tier;
			}
		}

		// Fallback to first tier if no match found
		return tiers[0]!;
	}

	private calculateTierProgress(
		bonusDays: number,
		currentTier: BonusTier,
	): {current: number; total: number; percentage: number} {
		const tierStart = currentTier.startDay;
		const tierEnd = currentTier.endDay ?? this.config.targetDays;
		const tierSize = tierEnd - tierStart;
		const current = Math.max(0, bonusDays - tierStart);
		const percentage = tierSize > 0 ? (current / tierSize) * 100 : 0;

		return {
			current: Math.round(current * 10) / 10,
			total: tierSize,
			percentage: Math.round(percentage * 10) / 10,
		};
	}

	private calculateEarnedBonus(bonusDays: number, tiers: BonusTier[]): number {
		let earnedBonus = 0;

		for (const tier of tiers) {
			const tierStart = tier.startDay;
			const tierEnd = tier.endDay ?? Number.POSITIVE_INFINITY;

			if (bonusDays > tierStart) {
				const daysInTier = Math.min(bonusDays, tierEnd) - tierStart;
				earnedBonus += daysInTier * tier.rate;
			}
		}

		return earnedBonus * 100; // Convert to percentage
	}

	private calculateProjection(bonusDays: number, currentDate: Date): number {
		const dayOfYear = this.getDayOfYear(currentDate);
		const daysInYear = this.isLeapYear(currentDate.getFullYear()) ? 366 : 365;

		if (dayOfYear === 0) {
			return bonusDays;
		}

		const dailyRate = bonusDays / dayOfYear;
		return dailyRate * daysInYear;
	}

	private findNextMilestone(
		bonusDays: number,
		tiers: BonusTier[],
	): {name: string; daysRemaining: number; targetDays: number} | undefined {
		// Check for tier transitions first
		for (const tier of tiers) {
			if (tier.endDay && bonusDays < tier.endDay) {
				const nextTierName = this.getNextTierName(tier, tiers);
				return {
					name: `${nextTierName} starts`,
					daysRemaining: Math.round((tier.endDay - bonusDays) * 10) / 10,
					targetDays: tier.endDay,
				};
			}
		}

		// Check for target milestone
		if (bonusDays < this.config.targetDays) {
			return {
				name: '100% Target',
				daysRemaining:
					Math.round((this.config.targetDays - bonusDays) * 10) / 10,
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

	private getDayOfYear(date: Date): number {
		const start = new Date(date.getFullYear(), 0, 0);
		const diff = date.getTime() - start.getTime();
		return Math.floor(diff / (1000 * 60 * 60 * 24));
	}

	private isLeapYear(year: number): boolean {
		return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
	}
}
