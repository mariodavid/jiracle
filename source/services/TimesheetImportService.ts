import type {LocalDate} from '../domain/LocalDate.js';
import {WorklogEntry} from '../domain/WorklogEntry.js';
import type {AttendanceCSVStorage} from '../attendance/AttendanceCSVStorage.js';
import type {Attendance} from '../attendance/types.js';
import type {JiraClient} from '../jira-client.js';
import type {TimesheetEntry, WorkItem} from './CSVTimesheetParser.js';

export type ImportOptions = {
	skipExisting?: boolean;
	updateExisting?: boolean;
	dryRun?: boolean;
};

export type ImportedWorklog = {
	issueKey: string;
	hours: number;
	description: string;
	date: string;
};

export type ImportStats = {
	totalRows: number;
	attendanceCreated: number;
	attendanceUpdated: number;
	attendanceSkipped: number;
	worklogsCreated: number;
	worklogsSkipped: number;
	totalHours: number;
	errors: string[];
};

export type ImportSummary = {
	stats: ImportStats;
	importedWorklogs: ImportedWorklog[];
	skippedDates: string[];
};

export class TimesheetImportService {
	constructor(
		private readonly jiraClient: JiraClient,
		private readonly attendanceStorage: AttendanceCSVStorage,
		private readonly currentUserEmail: string,
	) {}

	async importTimesheet(
		entries: TimesheetEntry[],
		options: ImportOptions = {},
	): Promise<ImportSummary> {
		const {
			skipExisting = true,
			updateExisting = false,
			dryRun = false,
		} = options;

		const stats: ImportStats = {
			totalRows: entries.length,
			attendanceCreated: 0,
			attendanceUpdated: 0,
			attendanceSkipped: 0,
			worklogsCreated: 0,
			worklogsSkipped: 0,
			totalHours: 0,
			errors: [],
		};

		const importedWorklogs: ImportedWorklog[] = [];
		const skippedDates: string[] = [];

		// Process entries sequentially to avoid file race conditions
		type ProcessResult =
			| Awaited<ReturnType<typeof this.processEntry>>
			| undefined;

		const processSequentially = async (): Promise<ProcessResult[]> => {
			const results: ProcessResult[] = [];
			for (const entry of entries) {
				try {
					/* eslint-disable-next-line no-await-in-loop */
					const result = await this.processEntry(entry, {
						skipExisting,
						updateExisting,
						dryRun,
					});
					results.push(result);
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					stats.errors.push(`${entry.date.toISOString()}: ${errorMessage}`);
					results.push(undefined);
				}
			}

			return results;
		};

		const results = await processSequentially();

		for (const [index, result] of results.entries()) {
			if (!result) {
				continue;
			}

			stats.attendanceCreated += result.attendanceCreated;
			stats.attendanceUpdated += result.attendanceUpdated;
			stats.attendanceSkipped += result.attendanceSkipped;
			stats.worklogsCreated += result.worklogsCreated;
			stats.worklogsSkipped += result.worklogsSkipped;
			stats.totalHours += result.totalHours;

			importedWorklogs.push(...result.importedWorklogs);

			if (result.skipped) {
				skippedDates.push(entries[index]!.date.toISOString());
			}
		}

		return {
			stats,
			importedWorklogs,
			skippedDates,
		};
	}

	private async processEntry(
		entry: TimesheetEntry,
		options: {
			skipExisting: boolean;
			updateExisting: boolean;
			dryRun: boolean;
		},
	) {
		const result = {
			attendanceCreated: 0,
			attendanceUpdated: 0,
			attendanceSkipped: 0,
			worklogsCreated: 0,
			worklogsSkipped: 0,
			totalHours: 0,
			importedWorklogs: [] as ImportedWorklog[],
			skipped: false,
		};

		// Check if attendance already exists
		const existingAttendance = await this.attendanceStorage.getByDate(
			entry.date,
		);

		if (existingAttendance && options.skipExisting && !options.updateExisting) {
			result.attendanceSkipped = 1;
			result.skipped = true;
			return result;
		}

		// Create or update attendance record
		const attendance = this.createAttendance(entry);

		if (!options.dryRun) {
			await this.attendanceStorage.upsert(attendance);
		}

		if (existingAttendance) {
			result.attendanceUpdated = 1;
		} else {
			result.attendanceCreated = 1;
		}

		// Process work items
		const worklogResults = await Promise.all(
			entry.workItems.map(async workItem => {
				try {
					if (!options.dryRun) {
						await this.createWorklog(workItem, entry.date);
					}

					return {
						success: true,
						workItem,
						error: null,
					};
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					throw new Error(
						`Failed to create worklog for ${workItem.issueKey}: ${errorMessage}`,
					);
				}
			}),
		);

		for (const worklogResult of worklogResults) {
			if (worklogResult.success) {
				result.worklogsCreated += 1;
				result.totalHours += worklogResult.workItem.duration.toHours();

				result.importedWorklogs.push({
					issueKey: worklogResult.workItem.issueKey,
					hours: worklogResult.workItem.duration.toHours(),
					description: worklogResult.workItem.description,
					date: entry.date.toISOString(),
				});
			}
		}

		return result;
	}

	private createAttendance(entry: TimesheetEntry): Attendance {
		return {
			date: entry.date.toISOString(),
			checkIn: entry.workingPeriod.getStartTime().toString(),
			checkOut: entry.workingPeriod.getEndTime().toString(),
			breakMinutes: entry.workingPeriod.getBreakDuration().toMinutes(),
			totalHours: entry.workingPeriod.getWorkingHours(),
		};
	}

	private async createWorklog(
		workItem: WorkItem,
		date: LocalDate,
	): Promise<void> {
		const durationSeconds = workItem.duration.toSeconds();

		const worklogEntry = WorklogEntry.create({
			issueKey: workItem.issueKey,
			duration: durationSeconds,
			comment: workItem.description,
			date,
			author: {
				displayName: 'CSV Import',
				emailAddress: this.currentUserEmail,
			},
		});

		const worklogData = worklogEntry.toApiRequest();
		await this.jiraClient.addWorklog(workItem.issueKey, worklogData);
	}
}
