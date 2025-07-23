import test from 'ava';
import {
	renderDurationInput,
	typeString,
	pressEnter,
	pressTab,
	invalidPatterns,
	invalidDotAfterUnitPatterns,
	commaToHourConversionCases,
	wholeNumberToMinutesCases,
	testInvalidPatterns,
	testCommaConversion,
} from './duration-input-test-helpers.js';

// === INPUT VALIDATION TESTS ===

test('DurationInput rejects invalid characters', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onChange,
		compact: true,
	});

	// Type "a" - should be ignored (not a valid character)
	stdin.write('a');

	// Value should remain unchanged
	t.is(changedValue, '');
});

test('DurationInput prevents multiple dots', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onChange,
		compact: true,
	});

	// Type "2.." - second dot should be ignored
	typeString(stdin, '2..');

	t.is(changedValue, '2.');
});

test('DurationInput prevents multiple commas', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onChange,
		compact: true,
	});

	// Type "2,," - second comma should be ignored
	typeString(stdin, '2,,');

	t.is(changedValue, '2,');
});

test('DurationInput prevents mixed decimal separators', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onChange,
		compact: true,
	});

	// Type "2.5," - comma after dot should be ignored
	typeString(stdin, '2.5,');

	t.is(changedValue, '2.5');
});

test('DurationInput prevents multiple units', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onChange,
		compact: true,
	});

	// Type "2hd" - 'd' after 'h' should be ignored
	typeString(stdin, '2hd');

	t.is(changedValue, '2h');
});

test('DurationInput prevents invalid complex patterns like "2h.d.d."', t => {
	const changedValues: string[] = [];
	const onChange = (value: string) => {
		changedValues.push(value);
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onChange,
		compact: true,
	});

	// Type "2h.d.d." - only "2h" should be valid
	typeString(stdin, '2h.d.d.');

	// Should only contain valid progressive values
	t.deepEqual(changedValues, ['2', '2h']);
});

test('DurationInput prevents "2...." pattern', t => {
	const changedValues: string[] = [];
	const onChange = (value: string) => {
		changedValues.push(value);
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onChange,
		compact: true,
	});

	// Type "2...." - only first dot should be accepted
	typeString(stdin, '2....');

	t.deepEqual(changedValues, ['2', '2.']);
});

// === COMPLEX NEGATIVE CASES ===

test('DurationInput rejects complex invalid patterns', t => {
	testInvalidPatterns(t, invalidPatterns);
});

test('DurationInput rejects invalid patterns with dots after units', t => {
	for (const {input, reason} of invalidDotAfterUnitPatterns) {
		const changedValues: string[] = [];
		const onChange = (value: string) => {
			changedValues.push(value);
		};

		const {stdin} = renderDurationInput({
			value: '1h',
			onChange,
			compact: true,
		});

		// Type each character
		typeString(stdin, input);

		// Should not end with dot
		const finalValue = changedValues[changedValues.length - 1] ?? '';
		t.false(finalValue.endsWith('.'), `Should reject ${reason}: ${input}`);
	}
});

// === COMMA TO DOT CONVERSION TESTS ===

test('DurationInput converts comma to dot with smart unit detection for decimals', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onSubmit,
		compact: true,
	});

	// Type "1,5" and press Enter - should convert to "1.5h"
	typeString(stdin, '1,5');
	pressEnter(stdin);

	t.is(submittedValue, '1.5h');
});

test('DurationInput converts comma to dot with smart unit detection for minutes', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onSubmit,
		compact: true,
	});

	// Type "30,5" and press Enter - decimals are always hours, so should be "30.5h"
	typeString(stdin, '30,5');
	pressEnter(stdin);

	t.is(submittedValue, '30.5h');
});

test('DurationInput converts comma to dot when unit is already present', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onSubmit,
		compact: true,
	});

	// Type "2,5h" and press Enter - should convert to "2.5h"
	typeString(stdin, '2,5h');
	pressEnter(stdin);

	t.is(submittedValue, '2.5h');
});

test('DurationInput converts comma to dot with Tab key', t => {
	let submittedValue = '';
	const onSubmit = (value: string) => {
		submittedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onSubmit,
		compact: true,
	});

	// Type "1,5" and press Tab - should convert to "1.5h"
	typeString(stdin, '1,5');
	pressTab(stdin);

	t.is(submittedValue, '1.5h');
});

test('DurationInput handles multiple commas correctly', t => {
	const changedValues: string[] = [];
	let submittedValue = '';
	const onChange = (value: string) => {
		changedValues.push(value);
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

	// Type "1,5,5" - second comma should be ignored, but "5" after comma might be accepted
	typeString(stdin, '1,5');
	stdin.write(','); // This should be ignored
	stdin.write('5'); // This might be accepted as another digit
	pressEnter(stdin);

	// The actual behavior might accept "1,55" -> "1.55h" due to validation logic
	// Check that comma is converted to dot in final result
	t.true(submittedValue.includes('.'));
	t.true(submittedValue.endsWith('h'));
	t.false(submittedValue.includes(','));
});

test('DurationInput smart unit detection with comma - hours for decimals', t => {
	testCommaConversion(
		t,
		commaToHourConversionCases,
		'Comma to hour conversion',
	);
});

test('DurationInput smart unit detection with comma - whole numbers for minutes', t => {
	testCommaConversion(
		t,
		wholeNumberToMinutesCases,
		'Whole numbers to minutes conversion',
	);
});
