export type AllowedUnit = 'h' | 'm' | 'd';

export class InputValidation {
	private readonly allowedUnits: AllowedUnit[];

	constructor(allowedUnits: AllowedUnit[] = ['h', 'm', 'd']) {
		this.allowedUnits = allowedUnits;
	}

	isValidInputChar(char: string, currentValue: string): boolean {
		if (!this.validateBasicCharacter(char)) return false;

		const newValue = currentValue + char;

		if (!this.validateBasicFormat(newValue)) return false;

		// Handle units based on current state
		if (/[hdm]/.test(newValue)) {
			if (!this.validateHourUnit(newValue)) return false;
			if (!this.validateDayUnit(newValue)) return false;
			if (!this.validateMinuteUnit(newValue)) return false;
		}

		return true;
	}

	private validateBasicCharacter(char: string): boolean {
		const unitsPattern = this.allowedUnits.join('');
		const unitRegex = new RegExp(`[\\d.,${unitsPattern}]`);
		return unitRegex.test(char);
	}

	private validateBasicFormat(newValue: string): boolean {
		// Don't allow starting with dot or comma
		if (/^[.,]/.test(newValue)) return false;

		// Check for invalid patterns
		if (newValue.includes('..')) return false; // Multiple dots
		if (newValue.includes(',,')) return false; // Multiple commas
		if (newValue.includes('.,') ?? newValue.includes(',.')) return false; // Mixed separators
		if (/(?:\d+[.,]){2}/.test(newValue)) return false; // Multiple decimal separators

		// Don't allow units at the beginning
		if (/^[hdm]/.test(newValue)) return false;

		return true;
	}

	private validateHourUnit(newValue: string): boolean {
		if (!newValue.includes('h')) return true;

		// Don't allow dots/commas after h
		if (/h[.,]/.test(newValue)) return false;
		// Don't allow multiple h units
		if (/h.*h/.test(newValue)) return false;
		// Don't allow digits after h if there was a decimal before h
		if (/\d+[.,]\d+h\d/.test(newValue)) return false;
		// Don't allow m after h if there was a decimal before h
		if (/\d+[.,]\d+hm/.test(newValue)) return false;
		// After h, validate digits followed by m
		if (/h\d/.test(newValue)) {
			if (/h\d+[^\dm]/.test(newValue)) return false;
			if (/h\d+[hd]/.test(newValue)) return false;
		}

		// Don't allow d after h
		if (/h.*d/.test(newValue)) return false;

		return true;
	}

	private validateDayUnit(newValue: string): boolean {
		// Don't allow anything after d
		return !(newValue.includes('d') && /d./.test(newValue));
	}

	private validateMinuteUnit(newValue: string): boolean {
		// Don't allow anything after m
		return !(newValue.includes('m') && /m./.test(newValue));
	}
}

export function createInputValidator(
	allowedUnits: AllowedUnit[] = ['h', 'm', 'd'],
) {
	return new InputValidation(allowedUnits);
}
