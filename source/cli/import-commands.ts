import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import winston from 'winston';
import {parseCSVTimesheet} from '../services/CSVTimesheetParser.js';
import {TimesheetImportService} from '../services/TimesheetImportService.js';
import {AttendanceCSVStorage} from '../attendance/AttendanceCSVStorage.js';
import {JiraClient} from '../jira-client.js';
import {loadJiraConfig} from '../utils/config-loader.js';

export type ImportParameters = {
	file: string;
	skipExisting?: boolean;
	updateExisting?: boolean;
};

export type ImportResult = {
	success: boolean;
	message: string;
};

function createSilentLogger(): winston.Logger {
	return winston.createLogger({
		level: 'error',
		format: winston.format.simple(),
		transports: [
			new winston.transports.Console({
				silent: true,
			}),
		],
	});
}

export async function executeImport(
	parameters: ImportParameters,
): Promise<ImportResult> {
	const {file, skipExisting = true, updateExisting = false} = parameters;

	try {
		// Validate file exists
		if (!existsSync(file)) {
			return {
				success: false,
				message: `CSV file not found: ${file}\n\nPlease check the file path and ensure the file exists.`,
			};
		}

		// Validate file extension
		if (!file.toLowerCase().endsWith('.csv')) {
			return {
				success: false,
				message: `Invalid file format: ${file}\n\nOnly CSV files are supported. Please ensure your file has a .csv extension.`,
			};
		}

		// Read and parse CSV
		let csvContent: string;
		try {
			csvContent = await readFile(file, 'utf8');
		} catch (readError: unknown) {
			const errorMessage =
				readError instanceof Error ? readError.message : String(readError);
			return {
				success: false,
				message: `Failed to read CSV file: ${errorMessage}\n\nPlease check file permissions and ensure the file is not open in another application.`,
			};
		}

		// Check for empty file
		if (!csvContent.trim()) {
			return {
				success: false,
				message:
					'CSV file is empty. Please provide a file with timesheet data.',
			};
		}

		const parseResult = parseCSVTimesheet(csvContent);

		if (parseResult.errors.length > 0) {
			return {
				success: false,
				message: `CSV parsing errors:\n${parseResult.errors.join(
					'\n',
				)}\n\nPlease fix these issues and try again.`,
			};
		}

		if (parseResult.entries.length === 0) {
			return {
				success: false,
				message:
					'No valid entries found in CSV file.\n\nPlease ensure your CSV contains valid timesheet data with the correct format.',
			};
		}

		// Load configuration and create services
		const config = loadJiraConfig(undefined, true);
		const jiraClient = new JiraClient(config, createSilentLogger());
		const attendanceStorage = new AttendanceCSVStorage();
		const importService = new TimesheetImportService(
			jiraClient,
			attendanceStorage,
			config.username,
		);

		// Import timesheet
		const importResult = await importService.importTimesheet(
			parseResult.entries,
			{
				skipExisting,
				updateExisting,
			},
		);

		// Format result message
		const resultMessage = formatImportResult(importResult);

		return {
			success: importResult.stats.errors.length === 0,
			message: resultMessage,
		};
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return {
			success: false,
			message: `Import failed: ${errorMessage}`,
		};
	}
}

function formatImportResult(
	result: Awaited<ReturnType<TimesheetImportService['importTimesheet']>>,
): string {
	const {stats} = result;
	const lines: string[] = [];

	lines.push(
		'✅ Import completed successfully!',
		`- Processed ${stats.totalRows} entries`,
		`- Created ${stats.attendanceCreated} new attendance records`,
		`- Updated ${stats.attendanceUpdated} existing attendance records`,
		`- Skipped ${stats.attendanceSkipped} existing entries`,
		`- Created ${stats.worklogsCreated} worklog entries`,
		`- Total hours logged: ${stats.totalHours}`,
	);

	// Errors
	if (stats.errors.length > 0) {
		lines.push('', '❌ Errors encountered:');
		for (const error of stats.errors) {
			lines.push(`  ${error}`);
		}
	}

	return lines.join('\n');
}
