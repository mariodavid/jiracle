import test from 'ava';
import {TimeParsingService} from './TimeParsingService.js';

// Tests for parseTimeToHours
test('parseTimeToHours - handles empty string', t => {
	t.is(TimeParsingService.parseTimeToHours(''), 1);
});

test('parseTimeToHours - handles combined format (hours + minutes)', t => {
	t.is(TimeParsingService.parseTimeToHours('2h30m'), 2.5);
	t.is(TimeParsingService.parseTimeToHours('1h15m'), 1.25);
	t.is(TimeParsingService.parseTimeToHours('0h45m'), 0.75);
	t.is(TimeParsingService.parseTimeToHours('3h0m'), 3);
});

test('parseTimeToHours - handles days (1d = 8h)', t => {
	t.is(TimeParsingService.parseTimeToHours('1d'), 8);
	t.is(TimeParsingService.parseTimeToHours('2d'), 16);
	t.is(TimeParsingService.parseTimeToHours('0.5d'), 4);
	t.is(TimeParsingService.parseTimeToHours('1,5d'), 12); // German decimal
});

test('parseTimeToHours - handles hours', t => {
	t.is(TimeParsingService.parseTimeToHours('1h'), 1);
	t.is(TimeParsingService.parseTimeToHours('2.5h'), 2.5);
	t.is(TimeParsingService.parseTimeToHours('3,5h'), 3.5); // German decimal
	t.is(TimeParsingService.parseTimeToHours('8'), 8); // No unit
});

test('parseTimeToHours - handles minutes', t => {
	t.is(TimeParsingService.parseTimeToHours('30m'), 0.5);
	t.is(TimeParsingService.parseTimeToHours('90m'), 1.5);
	t.is(TimeParsingService.parseTimeToHours('15m'), 0.25);
});

test('parseTimeToHours - handles unparseable strings', t => {
	t.is(TimeParsingService.parseTimeToHours('invalid'), 1);
	t.is(TimeParsingService.parseTimeToHours('abc'), 1);
	t.is(TimeParsingService.parseTimeToHours('123xyz'), 1);
});

// Tests for normalizeTimeString
test('normalizeTimeString - converts comma to dot', t => {
	t.is(TimeParsingService.normalizeTimeString('2,5h'), '2.5h');
	t.is(TimeParsingService.normalizeTimeString('1,25'), '1.25h');
});

test('normalizeTimeString - adds smart units for plain numbers', t => {
	// Numbers with decimals become hours
	t.is(TimeParsingService.normalizeTimeString('2.5'), '2.5h');
	t.is(TimeParsingService.normalizeTimeString('1,5'), '1.5h');

	// Numbers >= 10 become minutes
	t.is(TimeParsingService.normalizeTimeString('15'), '15m');
	t.is(TimeParsingService.normalizeTimeString('30'), '30m');
	t.is(TimeParsingService.normalizeTimeString('90'), '90m');

	// Numbers < 10 become hours
	t.is(TimeParsingService.normalizeTimeString('2'), '2h');
	t.is(TimeParsingService.normalizeTimeString('8'), '8h');
});

test('normalizeTimeString - completes h+digits format', t => {
	t.is(TimeParsingService.normalizeTimeString('2h5'), '2h5m');
	t.is(TimeParsingService.normalizeTimeString('1h30'), '1h30m');
	t.is(TimeParsingService.normalizeTimeString('8h15'), '8h15m');
});

test('normalizeTimeString - handles already normalized strings', t => {
	t.is(TimeParsingService.normalizeTimeString('2h'), '2h');
	t.is(TimeParsingService.normalizeTimeString('30m'), '30m');
	t.is(TimeParsingService.normalizeTimeString('1d'), '1d');
	t.is(TimeParsingService.normalizeTimeString('2h30m'), '2h30m');
});

// Tests for generateTimeMarks
test('generateTimeMarks - generates correct marks for 15 minute increments', t => {
	const marks = TimeParsingService.generateTimeMarks(15);
	t.is(marks[0], 0);
	t.is(marks[1], 15);
	t.is(marks[2], 30);
	t.is(marks[4], 60); // 1 hour
	t.true(marks.includes(480)); // 8 hours
	t.true(marks.includes(1440)); // 24 hours
});

test('generateTimeMarks - generates correct marks for 30 minute increments', t => {
	const marks = TimeParsingService.generateTimeMarks(30);
	t.is(marks[0], 0);
	t.is(marks[1], 30);
	t.is(marks[2], 60);
	t.false(marks.includes(15));
	t.false(marks.includes(45));
});

// Tests for adjustTime
test('adjustTime - adjusts up correctly', t => {
	// Test with 15 minute increments
	t.is(TimeParsingService.adjustTime('1h', 'up', 15), '1h15m');
	t.is(TimeParsingService.adjustTime('1h10m', 'up', 15), '1h15m');
	t.is(TimeParsingService.adjustTime('45m', 'up', 15), '1h');
	t.is(TimeParsingService.adjustTime('30m', 'up', 15), '45m');
});

test('adjustTime - adjusts down correctly', t => {
	// Test with 15 minute increments
	t.is(TimeParsingService.adjustTime('1h15m', 'down', 15), '1h');
	t.is(TimeParsingService.adjustTime('1h', 'down', 15), '45m');
	t.is(TimeParsingService.adjustTime('45m', 'down', 15), '30m');
	t.is(TimeParsingService.adjustTime('30m', 'down', 15), '15m');
});

test('adjustTime - respects minimum value', t => {
	// Should not go below incrementMinutes
	t.is(TimeParsingService.adjustTime('15m', 'down', 15), '15m');
	t.is(TimeParsingService.adjustTime('30m', 'down', 30), '30m');
});

test('adjustTime - handles different increments', t => {
	// Test with 30 minute increments
	t.is(TimeParsingService.adjustTime('1h', 'up', 30), '1h30m');
	t.is(TimeParsingService.adjustTime('1h20m', 'up', 30), '1h30m');
	t.is(TimeParsingService.adjustTime('1h30m', 'down', 30), '1h');
});

test('adjustTime - handles complex time formats', t => {
	// Test with combined formats
	t.is(TimeParsingService.adjustTime('2h30m', 'up', 15), '2h45m');
	t.is(TimeParsingService.adjustTime('2h30m', 'down', 15), '2h15m');

	// Test with days
	t.is(TimeParsingService.adjustTime('1d', 'up', 60), '9h'); // 8h + 1h
	t.is(TimeParsingService.adjustTime('1d', 'down', 60), '7h'); // 8h - 1h
});

test('adjustTime - handles edge cases', t => {
	// Test maximum value boundary
	const result = TimeParsingService.adjustTime('23h45m', 'up', 15);
	t.is(result, '24h'); // Should cap at 24h

	// Test with very small values
	t.is(TimeParsingService.adjustTime('5m', 'up', 15), '15m');
	t.is(TimeParsingService.adjustTime('10m', 'down', 15), '15m'); // Should respect minimum
});
