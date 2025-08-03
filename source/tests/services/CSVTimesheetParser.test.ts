import test from 'ava';
import {parseCSVTimesheet} from '../../services/CSVTimesheetParser.js';
import {LocalDate} from '../../domain/LocalDate.js';
import {WorkingPeriod} from '../../domain/WorkingPeriod.js';
import {Duration} from '../../domain/Duration.js';

// Test Data - Define expected inputs and outputs
const VALID_CSV_HEADER =
	'Date,Start,End,Break,Work Item 1,Hours 1,Issue 1,Work Item 2,Hours 2,Issue 2,Work Item 3,Hours 3,Issue 3,Work Item 4,Hours 4,Issue 4';

const VALID_CSV_SINGLE_ENTRY = `${VALID_CSV_HEADER}
2025-06-02,08:00,18:00,00:30,Backend Development,9.5,PROJ-1234,,,,,,,,,`;

const VALID_CSV_MULTIPLE_WORK_ITEMS = `${VALID_CSV_HEADER}
2025-06-10,07:30,18:15,00:30,Frontend Updates,4,PROJ-1234,Backend Work,6,FEAT-5678,,,,,,`;

const INVALID_CSV_WRONG_COLUMNS = 'Date,Start,End,Break,Invalid,Headers';

const INVALID_CSV_MISSING_REQUIRED = `${VALID_CSV_HEADER}
2025-06-02,,18:00,00:30,Backend Development,9.5,PROJ-1234,,,,,,,,,`;

const INVALID_CSV_BAD_DATE = `${VALID_CSV_HEADER}
invalid-date,08:00,18:00,00:30,Backend Development,9.5,PROJ-1234,,,,,,,,,`;

const EXPECTED_SINGLE_ENTRY_RESULT = {
	date: LocalDate.fromString('2025-06-02'),
	workingPeriod: WorkingPeriod.create('08:00', '18:00', 30),
	workItems: [
		{
			description: 'Backend Development',
			duration: Duration.fromHours(9.5),
			issueKey: 'PROJ-1234',
		},
	],
};

const EXPECTED_MULTIPLE_WORK_ITEMS_RESULT = {
	date: LocalDate.fromString('2025-06-10'),
	workingPeriod: WorkingPeriod.create('07:30', '18:15', 30),
	workItems: [
		{
			description: 'Frontend Updates',
			duration: Duration.fromHours(4),
			issueKey: 'PROJ-1234',
		},
		{
			description: 'Backend Work',
			duration: Duration.fromHours(6),
			issueKey: 'FEAT-5678',
		},
	],
};

// Tests - Verify exact expected results
test('parseCSVTimesheet - parses valid CSV with single work item', t => {
	const result = parseCSVTimesheet(VALID_CSV_SINGLE_ENTRY);

	t.is(result.errors.length, 0);
	t.is(result.entries.length, 1);

	const entry = result.entries[0]!;
	t.true(entry.date.equals(EXPECTED_SINGLE_ENTRY_RESULT.date));
	t.is(entry.workingPeriod.getStartTime().toString(), '08:00');
	t.is(entry.workingPeriod.getEndTime().toString(), '18:00');
	t.is(entry.workingPeriod.getBreakDuration().toMinutes(), 30);
	t.is(entry.workItems.length, 1);
	t.is(entry.workItems[0]!.description, 'Backend Development');
	t.is(entry.workItems[0]!.duration.toHours(), 9.5);
	t.is(entry.workItems[0]!.issueKey, 'PROJ-1234');
});

test('parseCSVTimesheet - parses valid CSV with multiple work items', t => {
	const result = parseCSVTimesheet(VALID_CSV_MULTIPLE_WORK_ITEMS);

	t.is(result.errors.length, 0);
	t.is(result.entries.length, 1);

	const entry = result.entries[0]!;
	t.true(entry.date.equals(EXPECTED_MULTIPLE_WORK_ITEMS_RESULT.date));
	t.is(entry.workingPeriod.getStartTime().toString(), '07:30');
	t.is(entry.workingPeriod.getEndTime().toString(), '18:15');
	t.is(entry.workingPeriod.getBreakDuration().toMinutes(), 30);
	t.is(entry.workItems.length, 2);
	t.is(entry.workItems[0]!.description, 'Frontend Updates');
	t.is(entry.workItems[0]!.duration.toHours(), 4);
	t.is(entry.workItems[0]!.issueKey, 'PROJ-1234');
	t.is(entry.workItems[1]!.description, 'Backend Work');
	t.is(entry.workItems[1]!.duration.toHours(), 6);
	t.is(entry.workItems[1]!.issueKey, 'FEAT-5678');
});

test('parseCSVTimesheet - handles empty CSV', t => {
	const result = parseCSVTimesheet('');

	t.is(result.entries.length, 0);
	t.is(result.errors.length, 1);
	t.is(result.errors[0], 'CSV file has no header line');
});

test('parseCSVTimesheet - validates header columns', t => {
	const result = parseCSVTimesheet(INVALID_CSV_WRONG_COLUMNS);

	t.is(result.entries.length, 0);
	t.is(result.errors.length, 1);
	t.true(result.errors[0]!.includes('Expected 16 columns, but found 6'));
});

test('parseCSVTimesheet - validates required fields', t => {
	const result = parseCSVTimesheet(INVALID_CSV_MISSING_REQUIRED);

	t.is(result.entries.length, 0);
	t.is(result.errors.length, 1);
	t.true(result.errors[0]!.includes('Start time is required'));
});

test('parseCSVTimesheet - validates date format', t => {
	const result = parseCSVTimesheet(INVALID_CSV_BAD_DATE);

	t.is(result.entries.length, 0);
	t.is(result.errors.length, 1);
	t.true(result.errors[0]!.includes('Invalid date format'));
});

test('parseCSVTimesheet - validates time format', t => {
	const invalidTimeCSV = `${VALID_CSV_HEADER}
2025-06-02,25:00,18:00,00:30,Backend Development,9.5,PROJ-1234,,,,,,,,,`;

	const result = parseCSVTimesheet(invalidTimeCSV);

	t.is(result.entries.length, 0);
	t.is(result.errors.length, 1);
	t.true(result.errors[0]!.includes('Invalid start time format'));
});

test('parseCSVTimesheet - validates work item hours', t => {
	const invalidHoursCSV = `${VALID_CSV_HEADER}
2025-06-02,08:00,18:00,00:30,Backend Development,invalid,PROJ-1234,,,,,,,,,`;

	const result = parseCSVTimesheet(invalidHoursCSV);

	t.is(result.entries.length, 0);
	t.is(result.errors.length, 1);
	t.true(result.errors[0]!.includes('Invalid hours'));
});

test('parseCSVTimesheet - requires issue key when work item provided', t => {
	const missingIssueCSV = `${VALID_CSV_HEADER}
2025-06-02,08:00,18:00,00:30,Backend Development,9.5,,,,,,,,,,`;

	const result = parseCSVTimesheet(missingIssueCSV);

	t.is(result.entries.length, 0);
	t.is(result.errors.length, 1);
	t.true(result.errors[0]!.includes('Issue key is required'));
});

test('parseCSVTimesheet - parses break duration in HH:MM format', t => {
	const breakHHMMCSV = `${VALID_CSV_HEADER}
2025-06-02,08:00,18:00,01:15,Backend Development,9.5,PROJ-1234,,,,,,,,,`;

	const result = parseCSVTimesheet(breakHHMMCSV);

	t.is(result.errors.length, 0);
	t.is(result.entries.length, 1);
	t.is(result.entries[0]!.workingPeriod.getBreakDuration().toMinutes(), 75); // 1 hour 15 minutes = 75 minutes
});

test('parseCSVTimesheet - skips empty work items', t => {
	const emptyWorkItemCSV = `${VALID_CSV_HEADER}
2025-06-02,08:00,18:00,00:30,Backend Development,9.5,PROJ-1234,,,,,,,,,`;

	const result = parseCSVTimesheet(emptyWorkItemCSV);

	t.is(result.errors.length, 0);
	t.is(result.entries.length, 1);
	t.is(result.entries[0]!.workItems.length, 1);
	t.is(result.entries[0]!.workItems[0]!.description, 'Backend Development');
});

test('parseCSVTimesheet - processes multiple CSV lines', t => {
	const multipleEntriesCSV = `${VALID_CSV_HEADER}
2025-06-02,08:00,18:00,00:30,Backend Development,9.5,PROJ-1234,,,,,,,,,
2025-06-03,07:30,17:00,01:00,Frontend Work,8.0,FEAT-5678,,,,,,,,,`;

	const result = parseCSVTimesheet(multipleEntriesCSV);

	t.is(result.errors.length, 0);
	t.is(result.entries.length, 2);
	t.is(result.entries[0]!.workItems[0]!.description, 'Backend Development');
	t.is(result.entries[1]!.workItems[0]!.description, 'Frontend Work');
});
