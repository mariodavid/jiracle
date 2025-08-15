/**
 * Year value object with domain validation
 */
export class Year {
	/**
	 * Create Year from current date
	 */
	static current(): Year {
		return new Year(new Date().getFullYear());
	}

	/**
	 * Create Year from string (with validation)
	 */
	static fromString(yearString: string): Year {
		const value = Number.parseInt(yearString, 10);

		if (Number.isNaN(value)) {
			throw new TypeError(`Invalid year string: "${yearString}"`);
		}

		return new Year(value);
	}

	private readonly value: number;

	constructor(value: number) {
		if (!Number.isInteger(value)) {
			throw new TypeError('Year must be an integer');
		}

		if (value < 1900 || value > 2100) {
			throw new TypeError(
				`Invalid year: ${value}. Year must be between 1900 and 2100`,
			);
		}

		this.value = value;
	}

	/**
	 * Get the numeric value of the year
	 */
	getValue(): number {
		return this.value;
	}

	/**
	 * Convert to string representation
	 */
	toString(): string {
		return this.value.toString();
	}

	/**
	 * Check if this year equals another year
	 */
	equals(other: Year): boolean {
		return this.value === other.value;
	}
}
