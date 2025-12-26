import test from 'ava';
import {
	renderDurationInput,
	typeString,
	pressBackspace,
} from './duration-input-test-helpers.js';

test('DurationInput repro: accepts colon in format like 4:30h', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onChange,
		compact: true,
	});

	// Type "4:30" - colon should be accepted if fixed
	typeString(stdin, '4:30');

	// Current behavior: likely stops at '4', or '430' if colon ignored?
	// The validation logic seems strict about digits and units.
	// If colon is undefined in allowed chars, it's rejected.
	// So probably '430' or '4' depending on how it processes.
	// If the user says "cannot enter", then it's rejected.

	// We expect "4:30" to be present
	t.is(changedValue, '4:30', 'Should accept colon in time format');
});

test('DurationInput repro: backspace/delete behavior', t => {
	let changedValue = '';
	const onChange = (value: string) => {
		changedValue = value;
	};

	const {stdin} = renderDurationInput({
		value: '1h',
		onChange,
		compact: true,
	});

	// Type "123" -> value is "123"
	typeString(stdin, '123');
	t.is(changedValue, '123');

	// Press Backspace (\u007F)
	pressBackspace(stdin);
	// Should be "12"
	t.is(changedValue, '12', 'Backspace should remove last char');

	// Simulate DELETE key (usually \u001B[3~)
	// Ink maps this to key.delete = true, key.backspace = false
	// The bug `key.backspace ?? key.delete` evaluates to `false ?? true` -> `false`.
	stdin.write('\u001B[3~');

	// Should be "1" if working, but "12" if bug exists
	// We assert "1" to fail if bug exists
	t.is(changedValue, '1', 'Delete key should remove last char');
});
