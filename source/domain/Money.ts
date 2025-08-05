export class Money {
	static zero(currency: string): Money {
		return new Money(0, currency);
	}

	static fromEuros(amount: number): Money {
		return new Money(amount, 'EUR');
	}

	constructor(
		private readonly amount: number,
		private readonly currency: string,
	) {
		if (amount < 0) {
			throw new Error('Money amount cannot be negative');
		}

		if (!currency || currency.trim().length === 0) {
			throw new Error('Currency code is required');
		}
	}

	getAmount(): number {
		return this.amount;
	}

	getCurrency(): string {
		return this.currency;
	}

	add(other: Money): Money {
		if (this.currency !== other.currency) {
			throw new Error(
				`Cannot add different currencies: ${this.currency} and ${other.currency}`,
			);
		}

		return new Money(this.amount + other.amount, this.currency);
	}

	subtract(other: Money): Money {
		if (this.currency !== other.currency) {
			throw new Error(
				`Cannot subtract different currencies: ${this.currency} and ${other.currency}`,
			);
		}

		const result = this.amount - other.amount;

		if (result < 0) {
			throw new Error('Result would be negative');
		}

		return new Money(result, this.currency);
	}

	multiply(factor: number): Money {
		if (factor < 0) {
			throw new Error('Cannot multiply by negative factor');
		}

		return new Money(this.amount * factor, this.currency);
	}

	format(locale = 'de-DE'): string {
		if (this.currency === 'EUR') {
			return new Intl.NumberFormat(locale, {
				style: 'currency',
				currency: 'EUR',
			}).format(this.amount);
		}

		const formattedAmount = Math.round(this.amount).toLocaleString(locale);

		return `${this.currency} ${formattedAmount}`;
	}

	formatSimple(): string {
		if (this.currency === 'EUR') {
			return `€${Math.round(this.amount).toLocaleString()}`;
		}

		return `${this.currency}${Math.round(this.amount).toLocaleString()}`;
	}

	equals(other: Money): boolean {
		return this.amount === other.amount && this.currency === other.currency;
	}

	isGreaterThan(other: Money): boolean {
		if (this.currency !== other.currency) {
			throw new Error(
				`Cannot compare different currencies: ${this.currency} and ${other.currency}`,
			);
		}

		return this.amount > other.amount;
	}

	isLessThan(other: Money): boolean {
		if (this.currency !== other.currency) {
			throw new Error(
				`Cannot compare different currencies: ${this.currency} and ${other.currency}`,
			);
		}

		return this.amount < other.amount;
	}

	toNumber(): number {
		return this.amount;
	}

	toString(): string {
		return this.formatSimple();
	}
}
