import {
	findInitialFocusItem,
	navigateInDirection,
	navigateToNextItem,
	type NavigationDirection,
	type NavigationContext,
	type NavigationResult,
} from '../services/GridNavigationService.js';
import type {FocusableItem} from '../utils/FocusableItemCalculator.js';

/**
 * Hook that provides grid navigation functionality
 * Wraps GridNavigationService functions for use in React components
 */
export function useGridNavigation() {
	const findInitialFocus = (
		focusableItems: FocusableItem[],
		preferredColumnIndex?: number,
	): FocusableItem | undefined => {
		return findInitialFocusItem(focusableItems, preferredColumnIndex);
	};

	const navigate = (
		direction: NavigationDirection,
		context: NavigationContext,
	): NavigationResult => {
		return navigateInDirection(direction, context);
	};

	const navigateToNext = (
		context: NavigationContext,
		direction: 'next' | 'previous' = 'next',
	): NavigationResult => {
		return navigateToNextItem(context, direction);
	};

	return {
		findInitialFocus,
		navigate,
		navigateToNext,
	};
}
