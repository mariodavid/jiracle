import {useMemo} from 'react';
import {
	createInputValidator,
	type AllowedUnit,
} from '../utils/inputValidation.js';

export {type AllowedUnit} from '../utils/inputValidation.js';

export function useInputValidation(
	allowedUnits: AllowedUnit[] = ['h', 'm', 'd'],
) {
	const validator = useMemo(
		() => createInputValidator(allowedUnits),
		[allowedUnits],
	);

	return {
		isValidInputChar: validator.isValidInputChar.bind(validator),
	};
}
