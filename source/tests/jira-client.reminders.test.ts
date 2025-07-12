import test from 'ava';
import type {ReminderConfig} from '../jira-client.js';

test('ReminderConfig interface validates correctly', t => {
	const validConfig: ReminderConfig = {
		enabled: true,
		times: ['11:30', '16:30'],
		weekdaysOnly: true,
	};

	t.is(validConfig.enabled, true);
	t.is(validConfig.times.length, 2);
	t.is(validConfig.times[0], '11:30');
	t.is(validConfig.times[1], '16:30');
	t.is(validConfig.weekdaysOnly, true);
});

test('ReminderConfig can be disabled', t => {
	const disabledConfig: ReminderConfig = {
		enabled: false,
		times: [],
		weekdaysOnly: false,
	};

	t.is(disabledConfig.enabled, false);
	t.is(disabledConfig.times.length, 0);
	t.is(disabledConfig.weekdaysOnly, false);
});

test('ReminderConfig supports multiple reminder times', t => {
	const multipleRemindersConfig: ReminderConfig = {
		enabled: true,
		times: ['09:00', '11:30', '14:00', '16:30', '18:00'],
		weekdaysOnly: true,
	};

	t.is(multipleRemindersConfig.times.length, 5);
	t.true(multipleRemindersConfig.times.includes('09:00'));
	t.true(multipleRemindersConfig.times.includes('18:00'));
});

test('ReminderConfig can work on all days', t => {
	const allDaysConfig: ReminderConfig = {
		enabled: true,
		times: ['12:00'],
		weekdaysOnly: false,
	};

	t.is(allDaysConfig.weekdaysOnly, false);
});
