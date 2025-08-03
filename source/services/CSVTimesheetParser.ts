import {LocalDate} from '../domain/LocalDate.js';
import {WorkingPeriod} from '../domain/WorkingPeriod.js';
import {Duration} from '../domain/Duration.js';

export type WorkItem = {
	description: string;
	duration: Duration;
	issueKey: string;
};

export type TimesheetEntry = {
	date: LocalDate;
	workingPeriod: WorkingPeriod;
	workItems: WorkItem[];
};

export type ParsedTimesheet = {
	entries: TimesheetEntry[];
	errors: string[];
};

const EXPECTED_COLUMNS = 16;
const EXPECTED_HEADERS = [
	'Date',
	'Start',
	'End',
	'Break',
	'Work Item 1',
	'Hours 1',
	'Issue 1',
	'Work Item 2',
	'Hours 2',
	'Issue 2',
	'Work Item 3',
	'Hours 3',
	'Issue 3',
	'Work Item 4',
	'Hours 4',
	'Issue 4',
];

export function parseCSVTimesheet(csvContent: string): ParsedTimesheet {
	const errors: string[] = [];
	const entries: TimesheetEntry[] = [];

	const lines = csvContent.trim().split('\n');

	if (lines.length === 0) {
		return {entries: [], errors: ['CSV file is empty']};
	}

	// Validate header
	const headerLine = lines[0];
	if (!headerLine) {
		return {entries: [], errors: ['CSV file has no header line']};
	}

	const headers = headerLine.split(',');
	const headerValidation = validateHeaders(headers);
	if (headerValidation) {
		errors.push(headerValidation);
	}

	// Parse data lines
	const dataLines = lines.slice(1);

	for (const [lineIndex, line] of dataLines.entries()) {
		const actualLineNumber = lineIndex + 2; // +1 for header, +1 for 1-based indexing

		if (!line?.trim()) {
			continue; // Skip empty lines
		}

		try {
			const entry = parseLine(line, actualLineNumber);
			entries.push(entry);
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			errors.push(`Line ${actualLineNumber}: ${errorMessage}`);
		}
	}

	return {entries, errors};
}

function validateHeaders(headers: string[]): string | undefined {
	if (headers.length !== EXPECTED_COLUMNS) {
		return `Expected ${EXPECTED_COLUMNS} columns, but found ${
			headers.length
		}. Required columns: ${EXPECTED_HEADERS.join(', ')}`;
	}

	// Normalize headers for comparison (trim whitespace, case insensitive)
	const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
	const normalizedExpected = EXPECTED_HEADERS.map(h => h.toLowerCase());

	for (const [i, element] of normalizedExpected.entries()) {
		if (normalizedHeaders[i] !== element) {
			return `Invalid header at column ${i + 1}. Expected "${
				EXPECTED_HEADERS[i] ?? ''
			}", but found "${headers[i]?.trim() ?? ''}"`;
		}
	}

	return undefined;
}

function parseLine(line: string, _lineNumber: number): TimesheetEntry {
	const columns = line.split(',');

	if (columns.length !== EXPECTED_COLUMNS) {
		throw new Error(
			`Expected ${EXPECTED_COLUMNS} columns, but found ${columns.length}`,
		);
	}

	const [dateString, startTime, endTime, breakString] = columns;
	validateRequiredFields(dateString, startTime, endTime, breakString);

	const date = parseDate(dateString!);
	const {trimmedStartTime, trimmedEndTime} = validateTimes(
		startTime!,
		endTime!,
	);
	const breakMinutes = parseBreakDuration(breakString!);
	const workItems = parseWorkItems(columns);

	const workingPeriod = WorkingPeriod.create(
		trimmedStartTime,
		trimmedEndTime,
		breakMinutes,
	);

	return {
		date,
		workingPeriod,
		workItems,
	};
}

function validateRequiredFields(
	dateString: string | undefined,
	startTime: string | undefined,
	endTime: string | undefined,
	breakString: string | undefined,
): void {
	if (!dateString?.trim()) {
		throw new Error('Date is required');
	}

	if (!startTime?.trim()) {
		throw new Error('Start time is required');
	}

	if (!endTime?.trim()) {
		throw new Error('End time is required');
	}

	if (!breakString?.trim()) {
		throw new Error('Break duration is required');
	}
}

function parseDate(dateString: string): LocalDate {
	try {
		return LocalDate.fromString(dateString.trim());
	} catch {
		throw new Error(
			`Invalid date format "${dateString.trim()}". Expected YYYY-MM-DD`,
		);
	}
}

function validateTimes(
	startTime: string,
	endTime: string,
): {
	trimmedStartTime: string;
	trimmedEndTime: string;
} {
	const timePattern = /^([01]?\d|2[0-3]):([0-5]\d)$/;
	const trimmedStartTime = startTime.trim();
	const trimmedEndTime = endTime.trim();

	if (!timePattern.test(trimmedStartTime)) {
		throw new Error(
			`Invalid start time format "${trimmedStartTime}". Expected HH:MM`,
		);
	}

	if (!timePattern.test(trimmedEndTime)) {
		throw new Error(
			`Invalid end time format "${trimmedEndTime}". Expected HH:MM`,
		);
	}

	return {trimmedStartTime, trimmedEndTime};
}

function parseBreakDuration(breakString: string): number {
	const timePattern = /^([01]?\d|2[0-3]):([0-5]\d)$/;
	const trimmedBreak = breakString.trim();

	if (timePattern.test(trimmedBreak)) {
		// Break is in HH:MM format
		const [hours, minutes] = trimmedBreak.split(':').map(Number);
		return (hours ?? 0) * 60 + (minutes ?? 0);
	}

	// Break is in decimal format (assume minutes)
	const breakMinutes = Number(trimmedBreak);
	if (Number.isNaN(breakMinutes) || breakMinutes < 0) {
		throw new Error(
			`Invalid break duration "${trimmedBreak}". Expected HH:MM or positive number`,
		);
	}

	return breakMinutes;
}

function parseWorkItems(columns: string[]): WorkItem[] {
	const workItems: WorkItem[] = [];

	for (let i = 0; i < 4; i++) {
		const descriptionIndex = 4 + i * 3;
		const hoursIndex = descriptionIndex + 1;
		const issueIndex = descriptionIndex + 2;

		const description = columns[descriptionIndex]?.trim() ?? '';
		const hoursString = columns[hoursIndex]?.trim() ?? '';
		const issueKey = columns[issueIndex]?.trim() ?? '';

		if (!description) {
			continue;
		}

		if (!hoursString) {
			throw new Error(
				`Work Item ${i + 1}: Hours are required when description is provided`,
			);
		}

		const hours = Number(hoursString);
		if (Number.isNaN(hours) || hours <= 0) {
			throw new Error(
				`Work Item ${
					i + 1
				}: Invalid hours "${hoursString}". Expected positive number`,
			);
		}

		if (!issueKey) {
			throw new Error(
				`Work Item ${
					i + 1
				}: Issue key is required when description is provided`,
			);
		}

		workItems.push({
			description,
			duration: Duration.fromHours(hours),
			issueKey,
		});
	}

	return workItems;
}
