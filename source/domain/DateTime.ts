import {LocalDate} from './LocalDate.js';
import {Time} from './Time.js';

/**
 * DateTime domain object for representing precise moments in time
 * Combines LocalDate and Time with timezone awareness for Jira API integration
 */
export class DateTime {
	/**
	 * Create DateTime from LocalDate and Time components
	 */
	static fromLocalDateAndTime(date: LocalDate, time: Time): DateTime {
		const dateTime = new Date(date.toISOString() + 'T00:00:00.000Z');
		dateTime.setUTCHours(time.getHours(), time.getMinutes(), 0, 0);
		return new DateTime(dateTime);
	}

	/**
	 * Create DateTime from Jira API timestamp string
	 * Format: "2024-01-15T14:30:00+0000" or "2024-01-15T14:30:00.000+0000"
	 */
	static fromJiraApi(apiString: string): DateTime {
		// Handle both formats with and without milliseconds
		const normalizedString = apiString.replace(/\+0{4}$/, 'Z');
		const date = new Date(normalizedString);

		if (Number.isNaN(date.getTime())) {
			throw new TypeError(`Invalid Jira API timestamp: ${apiString}`);
		}

		return new DateTime(date);
	}

	/**
	 * Create DateTime for current moment
	 */
	static now(): DateTime {
		return new DateTime(new Date());
	}

	/**
	 * Create DateTime from standard JavaScript Date
	 */
	static fromDate(date: Date): DateTime {
		// Create a new Date in UTC to avoid timezone issues
		const utcDate = new Date(date.toISOString());
		return new DateTime(utcDate);
	}

	private readonly dateTime: Date;

	private constructor(dateTime: Date) {
		this.dateTime = new Date(dateTime);
	}

	/**
	 * Format as Jira API timestamp string
	 */
	toJiraApiFormat(): string {
		// Jira expects format like "2024-01-15T14:30:00.000+0000"
		return this.dateTime.toISOString().replace('Z', '+0000');
	}

	/**
	 * Get the date component
	 */
	getLocalDate(): LocalDate {
		return LocalDate.fromDate(this.dateTime);
	}

	/**
	 * Get the time component
	 */
	getTimeOfDay(): Time {
		const hours = this.dateTime.getUTCHours();
		const minutes = this.dateTime.getUTCMinutes();
		return Time.create(hours, minutes);
	}

	/**
	 * Get underlying JavaScript Date for compatibility
	 */
	toDate(): Date {
		return new Date(this.dateTime);
	}

	/**
	 * Format as ISO string
	 */
	toISOString(): string {
		return this.dateTime.toISOString();
	}

	/**
	 * Format for display
	 */
	toDisplayString(): string {
		const date = this.getLocalDate().toDisplayString();
		const time = this.getTimeOfDay().toString();
		return `${date} ${time}`;
	}

	/**
	 * Check equality with another DateTime
	 */
	equals(other: DateTime): boolean {
		return this.dateTime.getTime() === other.dateTime.getTime();
	}

	/**
	 * Check if this DateTime is before another
	 */
	isBefore(other: DateTime): boolean {
		return this.dateTime.getTime() < other.dateTime.getTime();
	}

	/**
	 * Check if this DateTime is after another
	 */
	isAfter(other: DateTime): boolean {
		return this.dateTime.getTime() > other.dateTime.getTime();
	}

	/**
	 * Add hours to this DateTime
	 */
	addHours(hours: number): DateTime {
		const newDateTime = new Date(this.dateTime);
		newDateTime.setUTCHours(newDateTime.getUTCHours() + hours);
		return new DateTime(newDateTime);
	}

	/**
	 * Add minutes to this DateTime
	 */
	addMinutes(minutes: number): DateTime {
		const newDateTime = new Date(this.dateTime);
		newDateTime.setUTCMinutes(newDateTime.getUTCMinutes() + minutes);
		return new DateTime(newDateTime);
	}

	/**
	 * Add days to this DateTime
	 */
	addDays(days: number): DateTime {
		const newDateTime = new Date(this.dateTime);
		newDateTime.setDate(newDateTime.getDate() + days);
		return new DateTime(newDateTime);
	}
}
