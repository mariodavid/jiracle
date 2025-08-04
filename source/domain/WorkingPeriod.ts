import {Duration} from './Duration.js';
import {Time} from './Time.js';

/**
 * WorkingPeriod value object representing a work period with start time, end time, and break duration
 * Encapsulates calculation logic for working hours and validation of work periods
 */
export class WorkingPeriod {
	/**
	 * Create WorkingPeriod from time strings and break minutes
	 */
	static create(
		startTime: string,
		endTime: string,
		breakMinutes: number,
	): WorkingPeriod {
		const start = Time.fromString(startTime);
		const end = Time.fromString(endTime);
		const breakDuration = Duration.fromMinutes(breakMinutes);

		return new WorkingPeriod(start, end, breakDuration);
	}

	/**
	 * Create WorkingPeriod from Time objects and Duration
	 */
	static fromObjects(
		startTime: Time,
		endTime: Time,
		breakDuration: Duration,
	): WorkingPeriod {
		return new WorkingPeriod(startTime, endTime, breakDuration);
	}

	private readonly startTime: Time;
	private readonly endTime: Time;
	private readonly breakDuration: Duration;

	private constructor(startTime: Time, endTime: Time, breakDuration: Duration) {
		if (endTime.isBefore(startTime) || endTime.equals(startTime)) {
			throw new Error(
				`Invalid working period: end time ${endTime.toString()} must be after start time ${startTime.toString()}`,
			);
		}

		const totalPeriod = startTime.durationUntil(endTime);
		if (breakDuration.isGreaterThan(totalPeriod)) {
			throw new Error(
				`Invalid working period: break duration ${breakDuration.toString()} cannot be longer than total period ${totalPeriod.toString()}`,
			);
		}

		this.startTime = startTime;
		this.endTime = endTime;
		this.breakDuration = breakDuration;
	}

	/**
	 * Get start time
	 */
	getStartTime(): Time {
		return this.startTime;
	}

	/**
	 * Get end time
	 */
	getEndTime(): Time {
		return this.endTime;
	}

	/**
	 * Get break duration
	 */
	getBreakDuration(): Duration {
		return this.breakDuration;
	}

	/**
	 * Calculate total working duration (excluding breaks)
	 */
	getWorkingDuration(): Duration {
		const totalDuration = this.startTime.durationUntil(this.endTime);
		return totalDuration.subtract(this.breakDuration);
	}

	/**
	 * Get total period duration (including breaks)
	 */
	getTotalDuration(): Duration {
		return this.startTime.durationUntil(this.endTime);
	}

	/**
	 * Get working hours as decimal number
	 */
	getWorkingHours(): number {
		return this.getWorkingDuration().toHours();
	}

	/**
	 * Check if this is a full-time working period (typically 8+ hours)
	 */
	isFullTime(minimumHours = 8): boolean {
		return this.getWorkingHours() >= minimumHours;
	}

	/**
	 * Check if this is a part-time working period
	 */
	isPartTime(minimumHours = 8): boolean {
		return !this.isFullTime(minimumHours);
	}

	/**
	 * Check if working period overlaps with another period
	 */
	overlaps(other: WorkingPeriod): boolean {
		return (
			(this.startTime.isBefore(other.endTime) ||
				this.startTime.equals(other.endTime)) &&
			(this.endTime.isAfter(other.startTime) ||
				this.endTime.equals(other.startTime))
		);
	}

	/**
	 * Format as string representation
	 */
	toString(): string {
		return `${this.startTime.toString()}-${this.endTime.toString()} (${this.getWorkingDuration().toString()} work, ${this.breakDuration.toString()} break)`;
	}

	/**
	 * Format as simple time range
	 */
	toTimeRange(): string {
		return `${this.startTime.toString()}-${this.endTime.toString()}`;
	}

	/**
	 * Get summary information
	 */
	getSummary(): {
		startTime: string;
		endTime: string;
		totalHours: number;
		workingHours: number;
		breakMinutes: number;
	} {
		return {
			startTime: this.startTime.toString(),
			endTime: this.endTime.toString(),
			totalHours: this.getTotalDuration().toHours(),
			workingHours: this.getWorkingHours(),
			breakMinutes: this.breakDuration.toMinutes(),
		};
	}
}
