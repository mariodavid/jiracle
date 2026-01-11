import type {JiraClient} from '../jira/client.js';
import {WorklogEntry} from '../domain/WorklogEntry.js';
import {IssueKey} from '../domain/IssueKey.js';
import type {LocalDate} from '../domain/LocalDate.js';

export type TransferOptions = {
	/**
	 * If true, only show what would be transferred without making changes
	 */
	dryRun?: boolean;

	/**
	 * If true, only transfer worklogs created by the current user
	 */
	currentUserOnly?: boolean;

	/**
	 * If provided, only transfer worklogs from this date onwards
	 */
	fromDate?: LocalDate;

	/**
	 * If provided, only transfer worklogs up to this date
	 */
	toDate?: LocalDate;
};

export type TransferredWorklog = {
	originalId: string;
	issueKey: string;
	date: string;
	duration: string;
	comment: string;
	action: 'transferred' | 'deleted' | 'skipped' | 'error';
	reason?: string;
};

export type TransferStats = {
	sourceWorklogsFound: number;
	worklogsToTransfer: number;
	worklogsTransferred: number;
	worklogsDeleted: number;
	errors: string[];
};

export type TransferSummary = {
	stats: TransferStats;
	transferredWorklogs: TransferredWorklog[];
};

type ProcessTransferParameters = {
	worklog: WorklogEntry;
	sourceIssueKey: string;
	targetIssueKey: string;
	options: TransferOptions;
	stats: TransferStats;
};

export class WorklogTransferService {
	constructor(
		private readonly jiraClient: JiraClient,
		private readonly currentUserEmail: string,
	) {}

	async transferWorklogs(
		sourceIssueKey: string,
		targetIssueKey: string,
		options: TransferOptions = {},
	): Promise<TransferSummary> {
		const stats: TransferStats = {
			sourceWorklogsFound: 0,
			worklogsToTransfer: 0,
			worklogsTransferred: 0,
			worklogsDeleted: 0,
			errors: [],
		};
		const transferredWorklogs: TransferredWorklog[] = [];

		try {
			// Validate issue keys
			const sourceKey = IssueKey.fromString(sourceIssueKey);
			const targetKey = IssueKey.fromString(targetIssueKey);

			// Verify both issues exist
			await this.verifyIssueExists(sourceKey.toString(), 'Source');
			await this.verifyIssueExists(targetKey.toString(), 'Target');

			// Fetch source worklogs
			const sourceWorklogs = await this.fetchSourceWorklogs(
				sourceKey.toString(),
			);
			stats.sourceWorklogsFound = sourceWorklogs.length;

			// Filter worklogs to transfer
			const worklogsToTransfer = this.filterWorklogsForTransfer(
				sourceWorklogs,
				options,
			);
			stats.worklogsToTransfer = worklogsToTransfer.length;

			if (worklogsToTransfer.length === 0) {
				return {stats, transferredWorklogs};
			}

			// Process each worklog sequentially
			const transferredResults = await this.processWorklogsSequentially(
				{
					worklogs: worklogsToTransfer,
					sourceIssueKey: sourceKey.toString(),
					targetIssueKey: targetKey.toString(),
					options,
				},
				stats,
			);

			transferredWorklogs.push(...transferredResults);

			return {stats, transferredWorklogs};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			stats.errors.push(`Transfer failed: ${errorMessage}`);
			return {stats, transferredWorklogs};
		}
	}

	private async verifyIssueExists(
		issueKey: string,
		type: string,
	): Promise<void> {
		try {
			await this.jiraClient.fetchIssue(IssueKey.fromString(issueKey));
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(
				`${type} issue ${issueKey} not found or not accessible: ${message}`,
			);
		}
	}

	private async fetchSourceWorklogs(
		sourceIssueKey: string,
	): Promise<WorklogEntry[]> {
		try {
			const worklogResponse = await this.jiraClient.getIssueWorklogs(
				sourceIssueKey,
			);
			return worklogResponse.worklogs.map(apiWorklog =>
				WorklogEntry.fromApiResponse(apiWorklog, sourceIssueKey),
			);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(
				`Failed to fetch worklogs from ${sourceIssueKey}: ${message}`,
			);
		}
	}

	private filterWorklogsForTransfer(
		worklogs: WorklogEntry[],
		options: TransferOptions,
	): WorklogEntry[] {
		let filteredWorklogs = worklogs;

		// Filter by current user if requested
		if (options.currentUserOnly) {
			filteredWorklogs = filteredWorklogs.filter(worklog =>
				worklog.isEditableBy(this.currentUserEmail),
			);
		}

		// Only transfer worklogs that can be deleted by current user
		filteredWorklogs = filteredWorklogs.filter(worklog =>
			worklog.canBeDeletedBy(this.currentUserEmail),
		);

		// Filter by date range if provided
		if (options.fromDate ?? options.toDate) {
			filteredWorklogs = filteredWorklogs.filter(worklog => {
				const worklogDate = worklog.date;

				// Check from date
				if (options.fromDate && worklogDate.isBefore(options.fromDate)) {
					return false;
				}

				// Check to date
				if (options.toDate && worklogDate.isAfter(options.toDate)) {
					return false;
				}

				return true;
			});
		}

		return filteredWorklogs;
	}

	private async processWorklogsSequentially(
		parameters: {
			worklogs: WorklogEntry[];
			sourceIssueKey: string;
			targetIssueKey: string;
			options: TransferOptions;
		},
		stats: TransferStats,
	): Promise<TransferredWorklog[]> {
		const {worklogs, sourceIssueKey, targetIssueKey, options} = parameters;
		const results: TransferredWorklog[] = [];

		// Process worklogs sequentially to avoid rate limiting
		/* eslint-disable no-await-in-loop */
		for (const worklog of worklogs) {
			const result = await this.processWorklogTransfer({
				worklog,
				sourceIssueKey,
				targetIssueKey,
				options,
				stats,
			});
			results.push(result);
		}
		/* eslint-enable no-await-in-loop */

		return results;
	}

	private async processWorklogTransfer(
		parameters: ProcessTransferParameters,
	): Promise<TransferredWorklog> {
		const {worklog, sourceIssueKey, targetIssueKey, options, stats} =
			parameters;

		const transferredWorklog: TransferredWorklog = {
			originalId: worklog.id,
			issueKey: targetIssueKey,
			date: worklog.date.toISOString(),
			duration: this.formatDuration(worklog.duration),
			comment: worklog.comment,
			action: 'error',
		};

		try {
			if (options.dryRun) {
				transferredWorklog.action = 'skipped';
				transferredWorklog.reason = 'Dry run mode';
				return transferredWorklog;
			}

			// Step 1: Create worklog on target issue
			await this.createWorklogOnTarget(worklog, targetIssueKey);
			transferredWorklog.action = 'transferred';
			stats.worklogsTransferred++;

			// Step 2: Delete worklog from source issue
			await this.deleteWorklogFromSource(worklog, sourceIssueKey);
			stats.worklogsDeleted++;
			transferredWorklog.action = 'deleted';
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			transferredWorklog.action = 'error';
			transferredWorklog.reason = errorMessage;
			stats.errors.push(
				`Failed to transfer worklog ${worklog.id} (${this.formatDuration(
					worklog.duration,
				)} on ${worklog.date.toISOString()}): ${errorMessage}`,
			);
		}

		return transferredWorklog;
	}

	private async createWorklogOnTarget(
		worklog: WorklogEntry,
		targetIssueKey: string,
	): Promise<void> {
		try {
			const worklogRequest = worklog.toApiRequest();
			await this.jiraClient.addWorklog(targetIssueKey, worklogRequest);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to create worklog on target issue: ${message}`);
		}
	}

	private async deleteWorklogFromSource(
		worklog: WorklogEntry,
		sourceIssueKey: string,
	): Promise<void> {
		try {
			await this.jiraClient.deleteWorklog(sourceIssueKey, worklog.id);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to delete worklog from source issue: ${message}`);
		}
	}

	private formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours > 0 && minutes > 0) {
			return `${hours}h${minutes}m`;
		}

		if (hours > 0) {
			return `${hours}h`;
		}

		if (minutes > 0) {
			return `${minutes}m`;
		}

		return '1m'; // Minimum display
	}
}
