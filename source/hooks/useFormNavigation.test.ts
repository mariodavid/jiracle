import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {Text} from 'ink';
import {useFormNavigation} from './useFormNavigation.js';

// Test component that uses the hook
const TestFormComponent = ({
	config,
	onNavigate,
}: {
	config: any;
	onNavigate?: (area: string) => void;
}) => {
	const {currentFocus} = useFormNavigation(config);

	// Report navigation changes
	React.useEffect(() => {
		if (onNavigate) {
			onNavigate(currentFocus);
		}
	}, [currentFocus, onNavigate]);

	return React.createElement(Text, {}, `Current Focus: ${currentFocus}`);
};

test('useFormNavigation - initializes with first focus area by default', t => {
	const config = {
		focusAreas: ['area1', 'area2', 'area3'],
	};

	const {lastFrame} = render(React.createElement(TestFormComponent, {config}));

	const output = lastFrame() || '';
	t.true(output.includes('Current Focus: area1'));
});

test('useFormNavigation - initializes with custom initial focus', t => {
	const config = {
		focusAreas: ['area1', 'area2', 'area3'],
		initialFocus: 'area2',
	};

	const {lastFrame} = render(React.createElement(TestFormComponent, {config}));

	const output = lastFrame() || '';
	t.true(output.includes('Current Focus: area2'));
});

test('useFormNavigation - handles Tab navigation forward', t => {
	const config = {
		focusAreas: ['area1', 'area2', 'area3'],
	};

	const {stdin, lastFrame} = render(
		React.createElement(TestFormComponent, {config}),
	);

	// Press Tab to move forward
	stdin.write('\t');

	const output = lastFrame() || '';
	t.true(output.includes('Current Focus: area2'));
});

test('useFormNavigation - handles Tab navigation with wraparound', t => {
	const config = {
		focusAreas: ['area1', 'area2', 'area3'],
		initialFocus: 'area3',
	};

	const {stdin, lastFrame} = render(
		React.createElement(TestFormComponent, {config}),
	);

	// Press Tab to move forward from last area (should wrap to first)
	stdin.write('\t');

	const output = lastFrame() || '';
	t.true(output.includes('Current Focus: area1'));
});

test('useFormNavigation - handles Shift+Tab navigation backward', t => {
	const config = {
		focusAreas: ['area1', 'area2', 'area3'],
		initialFocus: 'area2',
	};

	const {stdin, lastFrame} = render(
		React.createElement(TestFormComponent, {config}),
	);

	// Press Shift+Tab to move backward
	stdin.write('\u001B[Z'); // Shift+Tab sequence

	const output = lastFrame() || '';
	t.true(output.includes('Current Focus: area1'));
});

test('useFormNavigation - handles Shift+Tab navigation with wraparound', t => {
	const config = {
		focusAreas: ['area1', 'area2', 'area3'],
		initialFocus: 'area1',
	};

	const {stdin, lastFrame} = render(
		React.createElement(TestFormComponent, {config}),
	);

	// Press Shift+Tab to move backward from first area (should wrap to last)
	stdin.write('\u001B[Z'); // Shift+Tab sequence

	const output = lastFrame() || '';
	t.true(output.includes('Current Focus: area3'));
});

test('useFormNavigation - calls custom Enter handler', t => {
	let handlerCalled = false;
	const config = {
		focusAreas: ['area1', 'area2'],
		handlers: {
			area1: {
				onEnter: () => {
					handlerCalled = true;
				},
			},
		},
	};

	const {stdin} = render(React.createElement(TestFormComponent, {config}));

	// Press Enter
	stdin.write('\r');

	t.true(handlerCalled);
});

test('useFormNavigation - calls global Escape handler', t => {
	let handlerCalled = false;
	const config = {
		focusAreas: ['area1', 'area2'],
		globalHandlers: {
			onEscape: () => {
				handlerCalled = true;
			},
		},
	};

	const {stdin} = render(React.createElement(TestFormComponent, {config}));

	// Press Escape
	stdin.write('\u001B'); // Escape key

	t.true(handlerCalled);
});

test('useFormNavigation - calls global Ctrl+Enter handler', t => {
	let handlerCalled = false;
	const config = {
		focusAreas: ['area1', 'area2'],
		globalHandlers: {
			onCtrlEnter: () => {
				handlerCalled = true;
			},
		},
	};

	const {stdin} = render(React.createElement(TestFormComponent, {config}));

	// Press Ctrl+Enter
	stdin.write('\n'); // Ctrl+Enter sequence

	t.true(handlerCalled);
});

test('useFormNavigation - custom Tab handler overrides default navigation', t => {
	let customHandlerCalled = false;
	const config = {
		focusAreas: ['area1', 'area2', 'area3'],
		handlers: {
			area1: {
				onTab: () => {
					customHandlerCalled = true;
				},
			},
		},
	};

	const {stdin, lastFrame} = render(
		React.createElement(TestFormComponent, {config}),
	);

	// Press Tab
	stdin.write('\t');

	t.true(customHandlerCalled);
	// Should not have moved to area2 because custom handler was called
	const output = lastFrame() || '';
	t.true(output.includes('Current Focus: area1'));
});

test('useFormNavigation - custom Shift+Tab handler overrides default navigation', t => {
	let customHandlerCalled = false;
	const config = {
		focusAreas: ['area1', 'area2', 'area3'],
		initialFocus: 'area2',
		handlers: {
			area2: {
				onShiftTab: () => {
					customHandlerCalled = true;
				},
			},
		},
	};

	const {stdin, lastFrame} = render(
		React.createElement(TestFormComponent, {config}),
	);

	// Press Shift+Tab
	stdin.write('\u001B[Z'); // Shift+Tab sequence

	t.true(customHandlerCalled);
	// Should not have moved to area1 because custom handler was called
	const output = lastFrame() || '';
	t.true(output.includes('Current Focus: area2'));
});

test('useFormNavigation - area-specific Escape handler overrides global', t => {
	let globalHandlerCalled = false;
	let localHandlerCalled = false;
	const config = {
		focusAreas: ['area1', 'area2'],
		globalHandlers: {
			onEscape: () => {
				globalHandlerCalled = true;
			},
		},
		handlers: {
			area1: {
				onEscape: () => {
					localHandlerCalled = true;
				},
			},
		},
	};

	const {stdin} = render(React.createElement(TestFormComponent, {config}));

	// Press Escape
	stdin.write('\u001B'); // Escape key

	t.true(localHandlerCalled);
	t.false(globalHandlerCalled);
});

test('useFormNavigation - area-specific Enter handler overrides global', t => {
	let globalHandlerCalled = false;
	let localHandlerCalled = false;
	const config = {
		focusAreas: ['area1', 'area2'],
		globalHandlers: {
			onEnter: () => {
				globalHandlerCalled = true;
			},
		},
		handlers: {
			area1: {
				onEnter: () => {
					localHandlerCalled = true;
				},
			},
		},
	};

	const {stdin} = render(React.createElement(TestFormComponent, {config}));

	// Press Enter
	stdin.write('\r');

	t.true(localHandlerCalled);
	t.false(globalHandlerCalled);
});

test('useFormNavigation - falls back to global handler when no area-specific handler exists', t => {
	let globalHandlerCalled = false;
	const config = {
		focusAreas: ['area1', 'area2'],
		initialFocus: 'area2', // No handler defined for area2
		globalHandlers: {
			onEnter: () => {
				globalHandlerCalled = true;
			},
		},
		handlers: {
			area1: {
				onEnter: () => {
					// This should not be called since we're on area2
				},
			},
		},
	};

	const {stdin} = render(React.createElement(TestFormComponent, {config}));

	// Press Enter
	stdin.write('\r');

	t.true(globalHandlerCalled);
});

test('useFormNavigation - navigateToArea function works', t => {
	const config = {
		focusAreas: ['area1', 'area2', 'area3'],
	};

	let navigationCallback: ((area: string) => void) | undefined;
	const {lastFrame} = render(
		React.createElement(TestFormComponent, {
			config,
			onNavigate: (area: string) => {
				if (navigationCallback) {
					navigationCallback(area);
				}
			},
		}),
	);

	// Initially should be area1
	let output = lastFrame() || '';
	t.true(output.includes('Current Focus: area1'));

	// TODO: Test navigateToArea - this would require a more complex test setup
	// since we need to call the navigateToArea function from the hook
});
