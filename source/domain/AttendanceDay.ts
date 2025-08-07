import type {LocalDate} from './LocalDate.js';
import {Time} from './Time.js';
import {Duration} from './Duration.js';

/**
 * AttendanceDay value object for representing daily attendance with working time calculations
 * Tracks check-in/check-out times, breaks, and computes working duration
 */
export class AttendanceDay {
	/**
	 * Create AttendanceDay with optional check-in and check-out times
	 */
	static create(
		date: LocalDate,
		checkIn?: Time,
		checkOut?: Time,
	): AttendanceDay {
		return new AttendanceDay(date, checkIn, checkOut, Duration.fromMinutes(0));
	}

	/**
	 * Create AttendanceDay from a regular work day (8 hours)
	 */
	static createWorkDay(
		date: LocalDate,
		checkIn: Time = Time.fromString('09:00'),
		workingHours = 8,
	): AttendanceDay {
		const checkOut = checkIn.addMinutes(workingHours * 60);
		return new AttendanceDay(date, checkIn, checkOut, Duration.fromMinutes(0));
	}

	private constructor(
		private readonly date: LocalDate,
		private readonly checkIn?: Time,
		private readonly checkOut?: Time,
		private readonly totalBreakDuration: Duration = Duration.fromMinutes(0),
	) {
		if (checkIn && checkOut && checkOut.isBefore(checkIn)) {
			throw new Error('Check-out time cannot be before check-in time');
		}
	}

	/**
	 * Get the date of this attendance day
	 */
	getDate(): LocalDate {
		return this.date;
	}

	/**
	 * Get check-in time if available
	 */
	getCheckIn(): Time | undefined {
		return this.checkIn;
	}

	/**
	 * Get check-out time if available
	 */
	getCheckOut(): Time | undefined {
		return this.checkOut;
	}

	/**
	 * Check if both check-in and check-out times are recorded
	 */
	isComplete(): boolean {
		return Boolean(this.checkIn && this.checkOut);
	}

	/**
	 * Calculate total working duration (excluding breaks)
	 */
	getWorkingDuration(): Duration {
		if (!this.checkIn || !this.checkOut) {
			return Duration.fromMinutes(0);
		}

		const totalDuration = this.checkIn.durationUntil(this.checkOut);
		const workingMinutes = Math.max(
			0,
			totalDuration.toMinutes() - this.totalBreakDuration.toMinutes(),
		);

		return Duration.fromMinutes(workingMinutes);
	}

	/**
	 * Get total time spent at location (including breaks)
	 */
	getTotalDuration(): Duration {
		if (!this.checkIn || !this.checkOut) {
			return Duration.fromMinutes(0);
		}

		return this.checkIn.durationUntil(this.checkOut);
	}

	/**
	 * Get total break duration
	 */
	getBreakDuration(): Duration {
		return this.totalBreakDuration;
	}

	/**
	 * Add break duration to this attendance day
	 */
	addBreak(breakDuration: Duration): AttendanceDay {
		const newTotalBreakDuration = Duration.fromMinutes(
			this.totalBreakDuration.toMinutes() + breakDuration.toMinutes(),
		);

		return new AttendanceDay(
			this.date,
			this.checkIn,
			this.checkOut,
			newTotalBreakDuration,
		);
	}

	/**
	 * Update check-in time
	 */
	updateCheckIn(newCheckIn: Time): AttendanceDay {
		return new AttendanceDay(
			this.date,
			newCheckIn,
			this.checkOut,
			this.totalBreakDuration,
		);
	}

	/**
	 * Update check-out time
	 */
	updateCheckOut(newCheckOut: Time): AttendanceDay {
		return new AttendanceDay(
			this.date,
			this.checkIn,
			newCheckOut,
			this.totalBreakDuration,
		);
	}

	/**
	 * Check if this is a full working day (typically 8+ hours)
	 */
	isFullWorkingDay(minimumHours = 8): boolean {
		const workingDuration = this.getWorkingDuration();
		return workingDuration.toHours() >= minimumHours;
	}

	/**
	 * Check if overtime was worked (more than standard hours)
	 */
	hasOvertime(standardHours = 8): boolean {
		const workingDuration = this.getWorkingDuration();
		return workingDuration.toHours() > standardHours;
	}

	/**
	 * Calculate overtime duration
	 */
	getOvertimeDuration(standardHours = 8): Duration {
		const workingDuration = this.getWorkingDuration();
		const overtimeMinutes = Math.max(
			0,
			workingDuration.toMinutes() - standardHours * 60,
		);
		return Duration.fromMinutes(overtimeMinutes);
	}

	/**
	 * Check equality with another AttendanceDay
	 */
	equals(other: AttendanceDay): boolean {
		return (
			this.date.equals(other.date) &&
			this.checkIn?.equals(other.checkIn ?? this.checkIn) !== false &&
			this.checkOut?.equals(other.checkOut ?? this.checkOut) !== false &&
			this.totalBreakDuration.equals(other.totalBreakDuration)
		);
	}

	/**
	 * Format for display
	 */
	toString(): string {
		const dateString = this.date.toDisplayString();
		const checkInString = this.checkIn?.toString() ?? '--:--';
		const checkOutString = this.checkOut?.toString() ?? '--:--';
		const workingDurationString = this.getWorkingDuration().toString();

		return `${dateString}: ${checkInString} - ${checkOutString} (${workingDurationString})`;
	}

	/**
	 * Get working hours as decimal number for calculations
	 */
	getWorkingHours(): number {
		return this.getWorkingDuration().toHours();
	}
}
