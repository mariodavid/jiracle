import test from 'ava';
import {
	mockIssue,
	defaultConfig,
	renderDurationInput,
	typeString,
	pressEnter,
	pressTab,
	pressUpArrow,
	pressDownArrow,
	pressBackspace,
	validHourFormats,
	validDecimalHourFormats,
	validMinuteFormats,
	validDayFormats,
	validNumberFormats,
	validCombinedFormats,
	testValidInputFormats,
} from './duration-input-test-helpers.js';

// === BASIC RENDERING TESTS ===

test('DurationInput renders with initial value', t => {
	const {lastFrame} = renderDurationInput({
		selectedIssue: mockIssue,
		value: '2h',
	});

	const output = lastFrame() || '';
	t.true(output.includes('TEST-123'));
	t.true(output.includes('Test Issue'));
	t.true(output.includes('2h'));
});

test('DurationInput renders in compact mode', t => {
	const {lastFrame} = renderDurationInput({
		value: '3h',
		compact: true,
	});

	const output = lastFrame() || '';
	t.true(output.includes('3h'));
	// Help text is no longer shown in compact mode
	// Should not include issue info in compact mode
	t.false(output.includes('TEST-123'));
});

test('DurationInput shows selection state initially', t => {
	const {lastFrame} = renderDurationInput({
		value: '4h',
		compact: true,
	});

	const output = lastFrame() || '';
	// In selected state, text should be highlighted (no cursor visible)
	t.true(output.includes('4h'));
	// Cursor (█) should not be visible when text is selected
	t.false(output.includes('█'));
});

test('DurationInput calls onChange when typing', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onChange,
		compact: true,
	});

	// Type "5" - should replace selected text
	stdin.write('5');

	t.is(changedValue, '5');
});

// === USER INPUT AND NAVIGATION TESTS ===

test('DurationInput handles arrow key navigation', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '2h',
		onChange,
		compact: true,
		incrementMinutes: 60, // 1 hour increments
	});

	// Press up arrow - should increment by 1 hour to 3h
	pressUpArrow(stdin);

	t.is(changedValue, '3h');
});

test('DurationInput handles down arrow navigation', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '3h',
		onChange,
		compact: true,
		incrementMinutes: 60, // 1 hour increments
	});

	// Press down arrow - should decrement by 1 hour to 2h
	pressDownArrow(stdin);

	t.is(changedValue, '2h');
});

test('DurationInput prevents going below minimum increment', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onChange,
		compact: true,
		incrementMinutes: 60, // 1 hour increments
	});

	// Press down arrow - should stay at minimum (1h with 60min increments)
	pressDownArrow(stdin);

	t.is(changedValue, '1h');
});

test('DurationInput prevents going above 24h', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '24h',
		onChange,
		compact: true,
	});

	// Press up arrow - should stay at 24h
	pressUpArrow(stdin);

	t.is(changedValue, '24h');
});

test('DurationInput handles backspace on selected text', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '5h',
		onChange,
		compact: true,
	});

	// Press backspace - should clear selected text
	pressBackspace(stdin);

	t.is(changedValue, '');
});

test('DurationInput calls onSubmit with auto-completion', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onSubmit,
		compact: true,
	});

	// Type "5" to replace selected text
	typeString(stdin, '5');

	// Press Enter - should auto-complete to "5h"
	pressEnter(stdin);

	t.is(submittedValue, '5h');
});

test('DurationInput handles existing complete values', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '2h',
		onSubmit,
		compact: true,
	});

	// Press Enter - should not modify already complete value
	pressEnter(stdin);

	t.is(submittedValue, '2h');
});

test('DurationInput parses different time formats', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '30m', // 30 minutes = 0.5 hours
		onChange,
		compact: true,
		incrementMinutes: 60, // 1 hour increments
	});

	// Press up arrow - should increment to next 60min mark (from 30m to 60m = 1h)
	pressUpArrow(stdin);

	t.is(changedValue, '1h'); // Next 60-minute increment from 30m is 60m = 1h
});

test('DurationInput handles day format', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1d', // 1 day = 8 hours = 480 minutes
		onChange,
		compact: true,
		incrementMinutes: 60, // 1 hour increments
	});

	// Press up arrow - should increment by 1 hour to 9h
	pressUpArrow(stdin);

	t.is(changedValue, '9h'); // 8 hours + 1 hour = 9 hours
});

test('DurationInput allows typing decimal numbers', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onChange,
		compact: true,
	});

	// Type "2.5" - should replace selected text
	typeString(stdin, '2.5');

	t.is(changedValue, '2.5');
});

test('DurationInput allows typing time units', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onChange,
		compact: true,
	});

	// Type "30m" - should replace selected text
	typeString(stdin, '30m');

	t.is(changedValue, '30m');
});

test('DurationInput converts comma to dot on submit with Enter', t => {
	let changedValue = '';
	let submittedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onChange,
		onSubmit,
		compact: true,
	});

	// Type "1,5" and press Enter - should convert comma to dot and auto-complete to "1.5h"
	typeString(stdin, '1,5');
	pressEnter(stdin);

	t.is(submittedValue, '1.5h');
	t.is(changedValue, '1.5h'); // Should also update the displayed value
});

test('DurationInput converts comma to dot on submit with Tab', t => {
	let changedValue = '';
	let submittedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onChange,
		onSubmit,
		compact: true,
	});

	// Type "2,5" and press Tab - should convert comma to dot and auto-complete to "2.5h"
	typeString(stdin, '2,5');
	pressTab(stdin);

	t.is(submittedValue, '2.5h');
	t.is(changedValue, '2.5h'); // Should also update the displayed value
});

// === CONFIGURATION TESTS ===

test('DurationInput uses global default time from config', t => {
	const config = {
		...defaultConfig,
		defaultTime: '4h',
	};

	const {lastFrame} = renderDurationInput({
		value: '',
		config,
		compact: true,
	});

	const output = lastFrame() || '';
	t.true(output.includes('4h'));
});

test('DurationInput uses favorite-specific default time', t => {
	const config = {
		...defaultConfig,
		defaultTime: '4h',
		favorites: [{key: 'TEST-123', defaultTime: '8h'}],
	};

	const testIssue = {
		...mockIssue,
		key: 'TEST-123',
	};

	const {lastFrame} = renderDurationInput({
		value: '',
		selectedIssue: testIssue,
		config,
		issueSelectionMode: 'favorites',
		compact: true,
	});

	const output = lastFrame() || '';
	t.true(output.includes('8h'));
});

test('DurationInput favorite default time overrides global default', t => {
	const config = {
		...defaultConfig,
		defaultTime: '4h',
		favorites: [{key: 'TEST-123', defaultTime: '6h'}],
	};

	const testIssue = {
		...mockIssue,
		key: 'TEST-123',
	};

	const {lastFrame} = renderDurationInput({
		value: '',
		selectedIssue: testIssue,
		config,
		issueSelectionMode: 'favorites',
		compact: true,
	});

	const output = lastFrame() || '';
	t.true(output.includes('6h'));
	t.false(output.includes('4h'));
});

// === POSITIVE VALIDATION TESTS ===

test('DurationInput accepts valid hour formats', t => {
	testValidInputFormats(t, validHourFormats, 'valid hour format');
});

test('DurationInput accepts valid decimal hour formats', t => {
	testValidInputFormats(t, validDecimalHourFormats, 'valid decimal format');
});

test('DurationInput accepts valid minute formats', t => {
	testValidInputFormats(t, validMinuteFormats, 'valid minute format');
});

test('DurationInput accepts valid day formats', t => {
	testValidInputFormats(t, validDayFormats, 'valid day format');
});

test('DurationInput accepts numbers only (for auto-completion)', t => {
	testValidInputFormats(t, validNumberFormats, 'number format');
});

test('DurationInput accepts valid combined hour-minute formats', t => {
	testValidInputFormats(t, validCombinedFormats, 'valid combined format');
});

test('DurationInput allows and auto-completes h+digits pattern', t => {
	let changedValue = '';
	let submittedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onChange,
		onSubmit,
		compact: true,
	});

	// Type "2h5" - should be allowed as intermediate state
	typeString(stdin, '2h5');

	t.is(changedValue, '2h5');

	// Press Enter - should auto-complete to "2h5m"
	pressEnter(stdin);

	t.is(submittedValue, '2h5m');
});
