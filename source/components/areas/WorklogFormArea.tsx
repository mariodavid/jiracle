import React, {useState, useEffect} from 'react';
import {Box} from 'ink';
import {InlineWorklogForm} from '../InlineWorklogForm.js';
import type {LocalDate} from '../../domain/LocalDate.js';
import type {IssueKey} from '../../domain/IssueKey.js';
import type {WorklogFormData} from '../../hooks/useWorklogForm.js';
import type {JiraConfig, WorklogEntry, JiraClient} from '../../jira-client.js';
import type {Duration} from '../../domain/Duration.js';

export type WorklogFormAreaProps = {
	worklogForm: WorklogFormData;
	worklogSubmitting: boolean;
	worklogError: string | undefined;
	config: JiraConfig;
	jiraClient: JiraClient;
	onSubmit: (data: {
		issueKey: IssueKey;
		date: LocalDate;
		timeSpent: Duration;
		comment: string;
		worklogId?: string;
	}) => Promise<void>;
	onCancel: () => void;
};

export function WorklogFormArea({
	worklogForm,
	worklogSubmitting,
	worklogError,
	config,
	jiraClient,
	onSubmit,
	onCancel,
}: WorklogFormAreaProps) {
	const [recentWorklogs, setRecentWorklogs] = useState<WorklogEntry[]>([]);

	// Fetch recent worklogs for the issue to enable comment prefilling
	useEffect(() => {
		let isCancelled = false;

		async function fetchRecentWorklogs() {
			if (!worklogForm.issueKey || worklogForm.isEditMode) {
				return; // Skip for empty issue key or edit mode
			}

			try {
				const worklogResponse = await jiraClient.getIssueWorklogs(
					worklogForm.issueKey,
				);
				if (!isCancelled) {
					setRecentWorklogs(worklogResponse.worklogs);
				}
			} catch {
				// Silently ignore errors - comment prefill is not critical
				if (!isCancelled) {
					setRecentWorklogs([]);
				}
			}
		}

		void fetchRecentWorklogs();

		return () => {
			isCancelled = true;
		};
	}, [worklogForm.issueKey, worklogForm.isEditMode, jiraClient]);
	return (
		<Box justifyContent="center">
			<Box
				width={68}
				{...(!worklogSubmitting && {
					borderStyle: 'round',
					borderColor: 'cyan',
				})}
				paddingX={1}
				paddingY={1}
			>
				<InlineWorklogForm
					issueKey={worklogForm.issueKey}
					date={worklogForm.date}
					defaultTimeSpent={worklogForm.timeSpent}
					defaultComment={worklogForm.comment}
					isSubmitting={worklogSubmitting}
					error={worklogError}
					config={config}
					isFavorite={
						worklogForm.issueKey
							? config?.favorites?.some(fav =>
									fav.key.equals(worklogForm.issueKey!),
							  )
							: false
					}
					isIssueKeyEditable={worklogForm.isIssueKeyEditable}
					isEditMode={worklogForm.isEditMode}
					worklogId={worklogForm.worklogId}
					recentWorklogs={recentWorklogs}
					onSubmit={onSubmit}
					onCancel={onCancel}
				/>
			</Box>
		</Box>
	);
}
