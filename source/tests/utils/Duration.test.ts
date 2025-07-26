import test from 'ava';
import {Duration} from '../../domain/Duration.js';

test('Duration - calculateWorkingDuration basic calculation', t => {
	const duration = Duration.calculateWorkingDuration('08:00', '17:00', 60);
	t.is(duration.toMinutes(), 480); // 8 hours = 480 minutes
	t.is(duration.toDecimalHours(), '8');
});

test('Duration - calculateWorkingDuration with 30 minute break', t => {
	const duration = Duration.calculateWorkingDuration('08:00', '17:00', 30);
	t.is(duration.toMinutes(), 510); // 8.5 hours = 510 minutes
	t.is(duration.toDecimalHours(), '8.5');
});

test('Duration - calculateWorkingDuration with 15 minute increments', t => {
	const duration = Duration.calculateWorkingDuration('08:00', '16:15', 60);
	t.is(duration.toMinutes(), 435); // 7.25 hours = 435 minutes
	t.is(duration.toDecimalHours(), '7.25');
});

test('Duration - calculateWorkingDuration no break', t => {
	const duration = Duration.calculateWorkingDuration('09:00', '17:00', 0);
	t.is(duration.toMinutes(), 480); // 8 hours = 480 minutes
	t.is(duration.toDecimalHours(), '8');
});

test('Duration - toDecimalHours formatting', t => {
	t.is(Duration.fromMinutes(480).toDecimalHours(), '8'); // Remove .00
	t.is(Duration.fromMinutes(510).toDecimalHours(), '8.5'); // Remove trailing 0
	t.is(Duration.fromMinutes(495).toDecimalHours(), '8.25'); // Keep meaningful decimals
	t.is(Duration.fromMinutes(465).toDecimalHours(), '7.75'); // Keep meaningful decimals
});

test('Duration - calculateWorkingDuration edge cases', t => {
	// Same time (no work)
	const duration1 = Duration.calculateWorkingDuration('08:00', '08:00', 0);
	t.is(duration1.toMinutes(), 0);
	t.is(duration1.toDecimalHours(), '0');

	// Break longer than work time (should return 0)
	const duration2 = Duration.calculateWorkingDuration('08:00', '09:00', 120);
	t.is(duration2.toMinutes(), 0);
	t.is(duration2.toDecimalHours(), '0');
});

test('Duration - calculateWorkingDuration time parsing', t => {
	// Test different time formats
	const duration1 = Duration.calculateWorkingDuration('08:30', '17:15', 45);
	t.is(duration1.toMinutes(), 480); // 8 hours = 480 minutes
	t.is(duration1.toDecimalHours(), '8');

	const duration2 = Duration.calculateWorkingDuration('06:30', '17:00', 90);
	t.is(duration2.toMinutes(), 540); // 9 hours = 540 minutes
	t.is(duration2.toDecimalHours(), '9');
});
