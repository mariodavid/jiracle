import {loadJiraConfig} from '../utils/config-loader.js';
import {JiraClient} from '../jira/client.js';
import {WorklogTransferService} from '../services/WorklogTransferService.js';
import {IssueKey} from '../domain/IssueKey.js';
import {LocalDate} from '../domain/LocalDate.js';

export type TransferWorklogsParameters = {
	sourceIssue: string;
	targetIssue: string;
	dryRun?: boolean;
	currentUserOnly?: boolean;
	fromDate?: string;
	toDate?: string;
};

export type TransferWorklogsResult = {
	success: boolean;
	message: string;
	summary?: {
		sourceWorklogsFound: number;
		worklogsTransferred: number;
		worklogsDeleted: number;
		errors: string[];
	};
};

export async function executeTransferWorklogs(
	parameters: TransferWorklogsParameters,
	configPath?: string,
): Promise<TransferWorklogsResult> {
	const {
		sourceIssue,
		targetIssue,
		dryRun = false,
		currentUserOnly = true,
		fromDate,
		toDate,
	} = parameters;

	try {
		// Validate issue keys
		const sourceKey = IssueKey.fromString(sourceIssue);
		const targetKey = IssueKey.fromString(targetIssue);

		if (sourceKey.equals(targetKey)) {
			return {
				success: false,
				message: 'Source and target issues cannot be the same',
			};
		}

		// Load configuration
		const config = loadJiraConfig(configPath);
		const jiraClient = new JiraClient(config);

		// Get current user
		const currentUser = await jiraClient.getCurrentUser();
		const transferService = new WorklogTransferService(
			jiraClient,
			currentUser.emailAddress,
		);

		// Execute transfer
		const transferResult = await transferService.transferWorklogs(
			sourceIssue,
			targetIssue,
			{
				dryRun,
				currentUserOnly,
				fromDate: fromDate ? LocalDate.fromString(fromDate) : undefined,
				toDate: toDate ? LocalDate.fromString(toDate) : undefined,
			},
		);

		const {stats, transferredWorklogs} = transferResult;

		// Build result message
		let message = dryRun
			? `🔍 DRY RUN: Transfer preview for ${sourceIssue} → ${targetIssue}\n`
			: `✅ Transfer completed: ${sourceIssue} → ${targetIssue}\n`;

		// Add summary section
		message += `\n📊 Summary:\n`;
		message += `  • Source worklogs found: ${stats.sourceWorklogsFound}\n`;
		message += `  • Worklogs to transfer: ${stats.worklogsToTransfer}\n`;

		if (!dryRun) {
			message += `  • Successfully transferred: ${stats.worklogsTransferred}\n`;
			message += `  • Successfully deleted: ${stats.worklogsDeleted}\n`;
		}

		if (stats.errors.length > 0) {
			message += `  • Errors: ${stats.errors.length}\n`;
		}

		// Add details section
		if (transferredWorklogs.length > 0) {
			message += `\n📝 Details:\n`;
			for (const worklog of transferredWorklogs) {
				const statusIcon =
					{
						transferred: '✅',
						deleted: '🗑️',
						skipped: '⏭️',
						error: '❌',
					}[worklog.action] || '❓';
				const truncatedComment =
					worklog.comment.length > 50
						? worklog.comment.slice(0, 50) + '...'
						: worklog.comment;

				message += `  ${statusIcon} ${worklog.date.toISOString()} - ${worklog.duration.toString()} - ${truncatedComment}\n`;

				if (worklog.reason) {
					message += `     Reason: ${worklog.reason}\n`;
				}
			}
		}

		// Add errors section
		if (stats.errors.length > 0) {
			message += `\n❌ Errors:\n`;
			for (const error of stats.errors) {
				message += `  • ${error}\n`;
			}
		}

		// Show next steps
		if (dryRun && stats.worklogsToTransfer > 0) {
			message += `\n💡 To execute the transfer, run the command again without --dry-run\n`;
		} else if (
			!dryRun &&
			stats.worklogsTransferred > 0 &&
			stats.errors.length === 0
		) {
			message += `\n🎉 All worklogs successfully transferred and deleted from source!\n`;
		}

		return {
			success: stats.errors.length === 0,
			message,
			summary: {
				sourceWorklogsFound: stats.sourceWorklogsFound,
				worklogsTransferred: stats.worklogsTransferred,
				worklogsDeleted: stats.worklogsDeleted,
				errors: stats.errors,
			},
		};
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			success: false,
			message: `❌ Transfer failed: ${message}`,
		};
	}
}
