import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import ManualIssueInput from '../../components/ManualIssueInput.js';
import {delays} from '../utils/testUtils.js';

test('should render input field with instructions', async t => {
	const onChange = (_value: string) => {
		// Test callback
	};
	const onSubmit = (_value: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(ManualIssueInput, {
			value: '',
			onChange,
			onSubmit,
		}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	t.true(output?.includes('Enter issue key or URL:') ?? false);

	unmount();
});

test('should display example text', async t => {
	const onChange = (_value: string) => {
		// Test callback
	};
	const onSubmit = (_value: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(ManualIssueInput, {
			value: '',
			onChange,
			onSubmit,
		}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	t.true(
		output?.includes(
			'Examples: JTS-1234 or https://jira.example.com/browse/JTS-1234',
		) ?? false,
	);

	unmount();
});

test('should display ESC hint for going back to issue selection mode', async t => {
	const onChange = (_value: string) => {
		// Test callback
	};
	const onSubmit = (_value: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(ManualIssueInput, {
			value: '',
			onChange,
			onSubmit,
		}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	t.true(
		output?.includes('Press ESC to go back to issue selection mode') ?? false,
	);

	unmount();
});

test('should render input field with default value', async t => {
	const defaultValue = 'TEST-123';
	const onChange = (_value: string) => {
		// Test callback
	};
	const onSubmit = (_value: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(ManualIssueInput, {
			value: defaultValue,
			onChange,
			onSubmit,
		}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	// Input field should be rendered (can't easily test exact value in terminal)
	t.true(output !== null);
	t.true(output !== '');

	unmount();
});

test('should call onChange when typing', async t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};
	const onSubmit = (_value: string) => {
		// Test callback
	};

	const {stdin, unmount} = render(
		React.createElement(ManualIssueInput, {
			value: '',
			onChange,
			onSubmit,
		}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	// Type some text
	stdin.write('TEST-123');
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	// onChange should have been called with the typed value
	t.is(changedValue, 'TEST-123');

	unmount();
});

test('should call onSubmit when Enter is pressed', async t => {
	let submittedValue = '';
	const onChange = (_value: string) => {
		// Test callback
	};
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin, unmount} = render(
		React.createElement(ManualIssueInput, {
			value: 'TEST-456',
			onChange,
			onSubmit,
		}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	// Press Enter
	stdin.write('\r');
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	// onSubmit should have been called with the current value
	t.is(submittedValue, 'TEST-456');

	unmount();
});

test('should display error message when error is provided', async t => {
	const errorMessage = 'Invalid issue key format';
	const onChange = (_value: string) => {
		// Test callback
	};
	const onSubmit = (_value: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(ManualIssueInput, {
			value: '',
			error: errorMessage,
			onChange,
			onSubmit,
		}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	t.true(output?.includes(errorMessage) ?? false);

	unmount();
});

test('should hide error message when no error is provided', async t => {
	const onChange = (_value: string) => {
		// Test callback
	};
	const onSubmit = (_value: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(ManualIssueInput, {
			value: '',
			onChange,
			onSubmit,
		}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	// Should not contain error indicators
	t.false(output?.includes('Invalid') ?? true);
	t.false(output?.includes('Error') ?? true);

	unmount();
});

test('should handle empty error string', async t => {
	const onChange = (_value: string) => {
		// Test callback
	};
	const onSubmit = (_value: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(ManualIssueInput, {
			value: '',
			error: '',
			onChange,
			onSubmit,
		}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	// Should render without crashing
	t.true(output !== null);
	t.true(output !== '');

	unmount();
});

test('should handle long error messages', async t => {
	const longError =
		'This is a very long error message that should still be displayed correctly without breaking the layout or causing any rendering issues in the terminal interface';
	const onChange = (_value: string) => {
		// Test callback
	};
	const onSubmit = (_value: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(ManualIssueInput, {
			value: '',
			error: longError,
			onChange,
			onSubmit,
		}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();
	// Should render the error message (at least part of it)
	t.true(output?.includes('This is a very long error message') ?? false);

	unmount();
});

test('should render with proper layout structure', async t => {
	const onChange = (_value: string) => {
		// Test callback
	};
	const onSubmit = (_value: string) => {
		// Test callback
	};

	const {lastFrame, unmount} = render(
		React.createElement(ManualIssueInput, {
			value: '',
			onChange,
			onSubmit,
		}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	const output = lastFrame();

	// Should render something substantial
	t.true(output !== null);
	t.true(output !== '');
	t.true(output!.length > 50); // Should have substantial content

	unmount();
});

test('should handle onChange callback errors gracefully', async t => {
	const onChange = (_value: string) => {
		throw new Error('Test error');
	};
	const onSubmit = (_value: string) => {
		// Test callback
	};

	const {stdin, unmount} = render(
		React.createElement(ManualIssueInput, {
			value: '',
			onChange,
			onSubmit,
		}),
	);

	// Wait for component to render
	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	// This should not crash the test
	t.notThrows(() => {
		stdin.write('x');
	});

	await new Promise(resolve => setTimeout(resolve, delays.SHORT));

	unmount();
});
