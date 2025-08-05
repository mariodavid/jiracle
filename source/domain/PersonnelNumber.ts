export class PersonnelNumber {
	private static get VALID_FORMAT_REGEX() {
		return /^\d{4,8}$/;
	}

	static isValid(value: string): boolean {
		if (typeof value !== 'string') {
			return false;
		}

		const trimmed = value.trim();
		return PersonnelNumber.VALID_FORMAT_REGEX.test(trimmed);
	}

	static fromString(value: string): PersonnelNumber {
		const trimmed = value.trim();
		if (!PersonnelNumber.isValid(trimmed)) {
			throw new Error(`Invalid personnel number: ${value}. Must be 4-8 digits`);
		}

		return new PersonnelNumber(trimmed);
	}

	constructor(private readonly value: string) {
		if (!PersonnelNumber.isValid(value)) {
			throw new Error(`Invalid personnel number: ${value}. Must be 4-8 digits`);
		}
	}

	toString(): string {
		return this.value;
	}

	toDisplayString(): string {
		return `Personnel #${this.value}`;
	}

	getValue(): string {
		return this.value;
	}

	equals(other: PersonnelNumber): boolean {
		return this.value === other.value;
	}

	/**
	 * Returns the length of the personnel number
	 */
	getLength(): number {
		return this.value.length;
	}

	/**
	 * Checks if this is a valid SAP personnel number format
	 */
	isValidSAPFormat(): boolean {
		// SAP typically uses 6-8 digit personnel numbers
		return this.value.length >= 6 && this.value.length <= 8;
	}
}
