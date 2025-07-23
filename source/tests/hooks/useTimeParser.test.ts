import test from 'ava';
import {useTimeParser} from '../../hooks/useTimeParser.js';

test('useTimeParser - hook provides all expected functions', t => {
	const {parseTimeToHours, normalizeTimeString, generateTimeMarks, adjustTime} =
		useTimeParser();

	t.is(typeof parseTimeToHours, 'function');
	t.is(typeof normalizeTimeString, 'function');
	t.is(typeof generateTimeMarks, 'function');
	t.is(typeof adjustTime, 'function');
});

test('useTimeParser - parseTimeToHours works correctly', t => {
	const {parseTimeToHours} = useTimeParser();

	t.is(parseTimeToHours('2h'), 2);
	t.is(parseTimeToHours('30m'), 0.5);
	t.is(parseTimeToHours('1h30m'), 1.5);
	t.is(parseTimeToHours('1d'), 8);
});

test('useTimeParser - normalizeTimeString works correctly', t => {
	const {normalizeTimeString} = useTimeParser();

	t.is(normalizeTimeString('2'), '2h');
	t.is(normalizeTimeString('30'), '30m');
	t.is(normalizeTimeString('2,5'), '2.5h');
	t.is(normalizeTimeString('2h5'), '2h5m');
});

test('useTimeParser - adjustTime works correctly', t => {
	const {adjustTime} = useTimeParser();

	const upResult = adjustTime('1h', 'up', 15);
	t.is(upResult, '1h15m');

	const downResult = adjustTime('1h15m', 'down', 15);
	t.is(downResult, '1h');
});

test('useTimeParser - generateTimeMarks works correctly', t => {
	const {generateTimeMarks} = useTimeParser();

	const marks = generateTimeMarks(30);
	t.true(Array.isArray(marks));
	t.true(marks.length > 0);
	t.is(marks[0], 0);
	t.is(marks[1], 30);
});
