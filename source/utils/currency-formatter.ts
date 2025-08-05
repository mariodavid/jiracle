export const CurrencyFormatter = {
	format(amount: number, currency = 'EUR', locale = 'de-DE'): string {
		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency,
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	},

	formatWithDecimals(
		amount: number,
		currency = 'EUR',
		locale = 'de-DE',
	): string {
		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency,
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount);
	},

	formatSimple(amount: number, currency = 'EUR'): string {
		const symbol = currency === 'EUR' ? '€' : currency;
		const formattedAmount = Math.round(amount).toLocaleString();
		return `${symbol}${formattedAmount}`;
	},
};
