import {useState, useCallback} from 'react';
import {useInput, useFocus} from 'ink';

interface FormNavigationConfig<T extends string> {
	/** Array of focus areas in order they should be navigated */
	focusAreas: T[];
	/** Initial focus area (defaults to first area) */
	initialFocus?: T;
	/** Whether to auto-focus the form when component mounts */
	autoFocus?: boolean;
	/** Custom handlers for specific keys in specific focus areas */
	handlers?: Partial<{
		[K in T]: {
			onEnter?: () => void;
			onEscape?: () => void;
			onTab?: () => void;
			onShiftTab?: () => void;
		};
	}>;
	/** Global handlers that apply to all focus areas */
	globalHandlers?: {
		onEnter?: () => void;
		onEscape?: () => void;
		onCtrlEnter?: () => void;
	};
}

export function useFormNavigation<T extends string>(
	config: FormNavigationConfig<T>,
): {
	currentFocus: T;
	isFocused: boolean;
	navigateToNext: () => void;
	navigateToPrevious: () => void;
	navigateToArea: (area: T) => void;
	setFocus: (area: T) => void;
} {
	const {
		focusAreas,
		initialFocus,
		autoFocus = true,
		handlers = {},
		globalHandlers = {},
	} = config;

	const [currentFocus, setCurrentFocus] = useState<T>(
		initialFocus || focusAreas[0]!,
	);
	const {isFocused} = useFocus({autoFocus});

	const getNextFocus = useCallback(
		(direction: 'forward' | 'backward'): T => {
			const currentIndex = focusAreas.indexOf(currentFocus);
			let nextIndex: number;

			if (direction === 'forward') {
				nextIndex = (currentIndex + 1) % focusAreas.length;
			} else {
				nextIndex = (currentIndex - 1 + focusAreas.length) % focusAreas.length;
			}

			return focusAreas[nextIndex]!;
		},
		[currentFocus, focusAreas],
	);

	const navigateToNext = useCallback(() => {
		setCurrentFocus(getNextFocus('forward'));
	}, [getNextFocus]);

	const navigateToPrevious = useCallback(() => {
		setCurrentFocus(getNextFocus('backward'));
	}, [getNextFocus]);

	const navigateToArea = useCallback((area: T) => {
		setCurrentFocus(area);
	}, []);

	useInput(
		(_, key) => {
			if (!isFocused) return;

			const currentHandlers = (handlers as any)[currentFocus] || {};

			// Handle Escape key
			if (key.escape) {
				if (currentHandlers.onEscape) {
					currentHandlers.onEscape();
				} else if (globalHandlers.onEscape) {
					globalHandlers.onEscape();
				}
				return;
			}

			// Handle Ctrl+Enter key
			if (key.ctrl && key.return) {
				if (globalHandlers.onCtrlEnter) {
					globalHandlers.onCtrlEnter();
				}
				return;
			}

			// Handle Enter key
			if (key.return) {
				if (currentHandlers.onEnter) {
					currentHandlers.onEnter();
				} else if (globalHandlers.onEnter) {
					globalHandlers.onEnter();
				}
				return;
			}

			// Handle Tab navigation
			if (key.tab) {
				if (key.shift) {
					// Shift+Tab for reverse navigation
					if (currentHandlers.onShiftTab) {
						currentHandlers.onShiftTab();
					} else {
						navigateToPrevious();
					}
				} else {
					// Regular Tab for forward navigation
					if (currentHandlers.onTab) {
						currentHandlers.onTab();
					} else {
						navigateToNext();
					}
				}
				return;
			}
		},
		{isActive: isFocused},
	);

	return {
		currentFocus,
		isFocused,
		navigateToNext,
		navigateToPrevious,
		navigateToArea,
		setFocus: setCurrentFocus,
	};
}
