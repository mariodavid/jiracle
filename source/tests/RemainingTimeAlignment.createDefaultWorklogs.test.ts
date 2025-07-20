import test from 'ava';
import {RemainingTimeAlignment} from '../services/RemainingTimeAlignment.js';
import type {JiraConfig, DefaultStory} from '../jira-client.js';
import type {Attendance} from '../attendance/types.js';

const createValidConfig = (): JiraConfig => ({
	jiraUrl: 'https://test.com',
	username: 'test',
	apiToken: 'test',
	defaultTime: '1h',
	defaultComment: 'Default work',
	projects: [
		{
			key: 'PROJ',
			groupId: 'proj-group',
		},
	],
	favorites: [
		{
			key: 'PROJ-123',
			defaultTime: '3h',
			defaultComment: 'Favorite work',
		},
	],
	groups: [
		{
			id: 'proj-group',
			name: 'Project Group',
			defaultTime: '2h',
			defaultComment: 'Project work',
		},
	],
});

const createAttendance = (totalHours: number): Attendance => ({
	date: '2024-01-15',
	checkIn: '09:00',
	checkOut: '17:00',
	totalHours,
	breakMinutes: 30,
});

test('createDefaultWorklogs - successfully creates worklogs with percentage distribution', t => {
	const attendance = createAttendance(8);
	const defaultStories: DefaultStory[] = [
		{issueKey: 'PROJ-123', percentage: 60},
		{issueKey: 'PROJ-456', percentage: 40},
	];
	const config = createValidConfig();

	const result = RemainingTimeAlignment.createDefaultWorklogs(
		attendance,
		defaultStories,
		config,
	);

	t.true('createdWorklogs' in result);
	if ('createdWorklogs' in result) {
		t.is(result.createdWorklogs.length, 2);

		// Check first worklog (60% of 8h = 4.8h)
		const worklog1 = result.createdWorklogs[0]!;
		t.is(worklog1.issueKey, 'PROJ-123');
		t.is(worklog1.hours, 4.8);
		t.is(worklog1.percentage, 60);
		t.is(worklog1.comment, 'Favorite work'); // From favorites config

		// Check second worklog (40% of 8h = 3.2h)
		const worklog2 = result.createdWorklogs[1]!;
		t.is(worklog2.issueKey, 'PROJ-456');
		t.is(worklog2.hours, 3.2);
		t.is(worklog2.percentage, 40);
		t.is(worklog2.comment, 'Project work'); // From groups config

		// Check total
		t.is(result.totalDistributed, 8);
	}
});

test('createDefaultWorklogs - uses correct comment resolution hierarchy', t => {
	const attendance = createAttendance(6);
	const defaultStories: DefaultStory[] = [
		{issueKey: 'PROJ-123', percentage: 50}, // Should use favorites comment
		{issueKey: 'PROJ-789', percentage: 30}, // Should use groups comment
		{issueKey: 'OTHER-456', percentage: 20}, // Should use global comment
	];
	const config = createValidConfig();

	const result = RemainingTimeAlignment.createDefaultWorklogs(
		attendance,
		defaultStories,
		config,
	);

	t.true('createdWorklogs' in result);
	if ('createdWorklogs' in result) {
		t.is(result.createdWorklogs[0]!.comment, 'Favorite work'); // Favorites priority
		t.is(result.createdWorklogs[1]!.comment, 'Project work'); // Groups priority
		t.is(result.createdWorklogs[2]!.comment, 'Default work'); // Global fallback
	}
});

test('createDefaultWorklogs - handles empty comment gracefully', t => {
	const attendance = createAttendance(4);
	const defaultStories: DefaultStory[] = [
		{issueKey: 'UNKNOWN-123', percentage: 100},
	];
	const config: JiraConfig = {
		jiraUrl: 'https://test.com',
		username: 'test',
		apiToken: 'test',
		// No defaultComment specified
	};

	const result = RemainingTimeAlignment.createDefaultWorklogs(
		attendance,
		defaultStories,
		config,
	);

	t.true('createdWorklogs' in result);
	if ('createdWorklogs' in result) {
		t.is(result.createdWorklogs[0]!.comment, ''); // Empty when no defaults found
	}
});

test('createDefaultWorklogs - handles floating point precision correctly', t => {
	const attendance = createAttendance(8);
	const defaultStories: DefaultStory[] = [
		{issueKey: 'PROJ-123', percentage: 33.33},
		{issueKey: 'PROJ-456', percentage: 33.33},
		{issueKey: 'PROJ-789', percentage: 33.34},
	];
	const config = createValidConfig();

	const result = RemainingTimeAlignment.createDefaultWorklogs(
		attendance,
		defaultStories,
		config,
	);

	t.true('createdWorklogs' in result);
	if ('createdWorklogs' in result) {
		// Check calculated hours with floating point tolerance
		t.true(Math.abs(result.createdWorklogs[0]!.hours - 2.6664) < 0.0001);
		t.true(Math.abs(result.createdWorklogs[1]!.hours - 2.6664) < 0.0001);
		t.true(Math.abs(result.createdWorklogs[2]!.hours - 2.6672) < 0.0001);

		// Total should equal attendance hours
		const total = result.createdWorklogs.reduce((sum, wl) => sum + wl.hours, 0);
		t.is(total, 8);
		t.is(result.totalDistributed, 8);
	}
});

test('createDefaultWorklogs - returns error when no attendance data', t => {
	const defaultStories: DefaultStory[] = [
		{issueKey: 'PROJ-123', percentage: 100},
	];
	const config = createValidConfig();

	const result = RemainingTimeAlignment.createDefaultWorklogs(
		null,
		defaultStories,
		config,
	);

	t.true('type' in result);
	if ('type' in result) {
		t.is(result.type, 'no-attendance');
		t.true(result.message.includes('No attendance data'));
	}
});

test('createDefaultWorklogs - returns error when no default stories', t => {
	const attendance = createAttendance(8);
	const defaultStories: DefaultStory[] = [];
	const config = createValidConfig();

	const result = RemainingTimeAlignment.createDefaultWorklogs(
		attendance,
		defaultStories,
		config,
	);

	t.true('type' in result);
	if ('type' in result) {
		t.is(result.type, 'invalid-config');
		t.true(result.message.includes('No default stories configured'));
	}
});

test('createDefaultWorklogs - returns error when percentages do not sum to 100', t => {
	const attendance = createAttendance(8);
	const defaultStories: DefaultStory[] = [
		{issueKey: 'PROJ-123', percentage: 60},
		{issueKey: 'PROJ-456', percentage: 30},
		// Missing 10% to reach 100%
	];
	const config = createValidConfig();

	const result = RemainingTimeAlignment.createDefaultWorklogs(
		attendance,
		defaultStories,
		config,
	);

	t.true('type' in result);
	if ('type' in result) {
		t.is(result.type, 'invalid-config');
		t.true(result.message.includes('must sum to 100%'));
	}
});

test('createDefaultWorklogs - returns error for zero attendance hours', t => {
	const attendance = createAttendance(0);
	const defaultStories: DefaultStory[] = [
		{issueKey: 'PROJ-123', percentage: 100},
	];
	const config = createValidConfig();

	const result = RemainingTimeAlignment.createDefaultWorklogs(
		attendance,
		defaultStories,
		config,
	);

	t.true('type' in result);
	if ('type' in result) {
		t.is(result.type, 'no-attendance');
		t.true(result.message.includes('No attendance data'));
	}
});

test('createDefaultWorklogs - handles single story with 100%', t => {
	const attendance = createAttendance(7.5);
	const defaultStories: DefaultStory[] = [
		{issueKey: 'PROJ-123', percentage: 100},
	];
	const config = createValidConfig();

	const result = RemainingTimeAlignment.createDefaultWorklogs(
		attendance,
		defaultStories,
		config,
	);

	t.true('createdWorklogs' in result);
	if ('createdWorklogs' in result) {
		t.is(result.createdWorklogs.length, 1);
		t.is(result.createdWorklogs[0]!.hours, 7.5);
		t.is(result.createdWorklogs[0]!.percentage, 100);
		t.is(result.totalDistributed, 7.5);
	}
});
