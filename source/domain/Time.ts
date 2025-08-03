import {Duration} from './Duration.js';

/**
 * Time value object for representing time of day in HH:MM format
 * Provides validation and comparison operations for clock times
 */
export class Time {
	/**
	 * Create Time from HH:MM string format
	 */
	static fromString(timeString: string): Time {
		const timePattern = /^([01]?\d|2[0-3]):([0-5]\d)$/;
		const trimmed = timeString.trim();

		if (!timePattern.test(trimmed)) {
			throw new Error(
				`Invalid time format "${trimmed}". Expected HH:MM (e.g., "08:30", "17:00")`,
			);
		}

		const [hoursString, minutesString] = trimmed.split(':');
		const hours = Number.parseInt(hoursString!, 10);
		const minutes = Number.parseInt(minutesString!, 10);

		return new Time(hours, minutes);
	}

	/**
	 * Create Time from total minutes since midnight
	 */
	static fromMinutes(totalMinutes: number): Time {
		if (totalMinutes < 0 || totalMinutes >= 24 * 60) {
			throw new Error(
				`Invalid minutes ${totalMinutes}. Must be between 0 and 1439 (24 hours)`,
			);
		}

		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;
		return new Time(hours, minutes);
	}

	/**
	 * Create Time from hours and minutes
	 */
	static create(hours: number, minutes: number): Time {
		return new Time(hours, minutes);
	}

	private readonly hours: number;
	private readonly minutes: number;

	private constructor(hours: number, minutes: number) {
		if (hours < 0 || hours > 23) {
			throw new Error(`Invalid hours ${hours}. Must be between 0 and 23`);
		}

		if (minutes < 0 || minutes > 59) {
			throw new Error(`Invalid minutes ${minutes}. Must be between 0 and 59`);
		}

		this.hours = hours;
		this.minutes = minutes;
	}

	/**
	 * Get hours component (0-23)
	 */
	getHours(): number {
		return this.hours;
	}

	/**
	 * Get minutes component (0-59)
	 */
	getMinutes(): number {
		return this.minutes;
	}

	/**
	 * Get total minutes since midnight
	 */
	toMinutes(): number {
		return this.hours * 60 + this.minutes;
	}

	/**
	 * Format as HH:MM string
	 */
	toString(): string {
		return `${this.hours.toString().padStart(2, '0')}:${this.minutes
			.toString()
			.padStart(2, '0')}`;
	}

	/**
	 * Format as 12-hour time with AM/PM
	 */
	to12HourFormat(): string {
		const displayHours =
			this.hours === 0 ? 12 : this.hours > 12 ? this.hours - 12 : this.hours;
		const amPm = this.hours < 12 ? 'AM' : 'PM';
		return `${displayHours}:${this.minutes
			.toString()
			.padStart(2, '0')} ${amPm}`;
	}

	/**
	 * Check if this time is before another time
	 */
	isBefore(other: Time): boolean {
		return this.toMinutes() < other.toMinutes();
	}

	/**
	 * Check if this time is after another time
	 */
	isAfter(other: Time): boolean {
		return this.toMinutes() > other.toMinutes();
	}

	/**
	 * Check if this time equals another time
	 */
	equals(other: Time): boolean {
		return this.hours === other.hours && this.minutes === other.minutes;
	}

	/**
	 * Calculate duration between this time and another time
	 * Assumes both times are on the same day
	 */
	durationUntil(other: Time): Duration {
		const thisMinutes = this.toMinutes();
		const otherMinutes = other.toMinutes();

		if (otherMinutes < thisMinutes) {
			throw new Error(
				`Cannot calculate duration from ${this.toString()} to ${other.toString()}. End time must be after start time.`,
			);
		}

		const durationMinutes = otherMinutes - thisMinutes;
		return Duration.fromMinutes(durationMinutes);
	}

	/**
	 * Add minutes to this time (wraps around midnight if necessary)
	 */
	addMinutes(minutes: number): Time {
		const totalMinutes = (this.toMinutes() + minutes) % (24 * 60);
		return Time.fromMinutes(
			totalMinutes < 0 ? totalMinutes + 24 * 60 : totalMinutes,
		);
	}

	/**
	 * Subtract minutes from this time (wraps around midnight if necessary)
	 */
	subtractMinutes(minutes: number): Time {
		return this.addMinutes(-minutes);
	}
}
