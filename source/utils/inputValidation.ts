export type AllowedUnit = 'h' | 'm' | 'd';

export class InputValidation {
	private allowedUnits: AllowedUnit[];

	constructor(allowedUnits: AllowedUnit[] = ['h', 'm', 'd']) {
		this.allowedUnits = allowedUnits;
	}

	isValidInputChar(char: string, currentValue: string): boolean {
		// Create regex pattern based on allowed units
		const unitsPattern = this.allowedUnits.join('');
		const unitRegex = new RegExp(`[0-9.,${unitsPattern}]`);
		if (!unitRegex.test(char)) return false;

		const newValue = currentValue + char;

		// Don't allow starting with dot or comma
		if (/^[.,]/.test(newValue)) return false;

		// Check for invalid patterns
		if (newValue.includes('..')) return false; // Multiple dots
		if (newValue.includes(',,')) return false; // Multiple commas
		if (newValue.includes('.,') || newValue.includes(',.')) return false; // Mixed separators
		if (/\d+[.,]\d+[.,]/.test(newValue)) return false; // Multiple decimal separators

		// Don't allow units at the beginning
		if (/^[hdm]/.test(newValue)) return false;

		// Handle units based on current state
		if (/[hdm]/.test(newValue)) {
			// If we have 'h' in the string
			if (/h/.test(newValue)) {
				// Don't allow dots/commas after h
				if (/h[.,]/.test(newValue)) return false;
				// Don't allow multiple h units
				if (/h.*h/.test(newValue)) return false;
				// Don't allow digits after h if there was a decimal before h (e.g., reject "2.5h2")
				if (/\d+[.,]\d+h\d/.test(newValue)) return false;
				// Don't allow m after h if there was a decimal before h (e.g., reject "2.5hm")
				if (/\d+[.,]\d+hm/.test(newValue)) return false;
				// After h, only allow digits followed by m (e.g., 2h30m)
				if (/h\d/.test(newValue)) {
					// If we have h followed by digits and another character that's not a digit or m
					if (/h\d+[^0-9m]/.test(newValue)) return false;
					// Don't allow other units after h+digits except m
					if (/h\d+[hd]/.test(newValue)) return false;
				}
				// Don't allow d after h
				if (/h.*d/.test(newValue)) return false;
			}

			// If we have 'd' in the string
			if (/d/.test(newValue)) {
				// Don't allow anything after d
				if (/d./.test(newValue)) return false;
			}

			// If we have 'm' in the string
			if (/m/.test(newValue)) {
				// Don't allow anything after m
				if (/m./.test(newValue)) return false;
			}
		}

		return true;
	}
}

export function createInputValidator(
	allowedUnits: AllowedUnit[] = ['h', 'm', 'd'],
) {
	return new InputValidation(allowedUnits);
}
