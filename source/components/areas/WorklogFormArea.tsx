import React from 'react';
import {Box} from 'ink';
import {InlineWorklogForm} from '../InlineWorklogForm.js';
import type {WorklogFormData} from '../../hooks/useWorklogForm.js';
import type {JiraConfig} from '../../jira-client.js';

export type WorklogFormAreaProps = {
	worklogForm: WorklogFormData;
	worklogSubmitting: boolean;
	worklogError: string | null;
	config: JiraConfig;
	onSubmit: (data: {
		issueKey: string;
		date: Date;
		timeSpent: string;
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
	onSubmit,
	onCancel,
}: WorklogFormAreaProps) {
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
					onSubmit={onSubmit}
					onCancel={onCancel}
					isSubmitting={worklogSubmitting}
					error={worklogError}
					config={config}
					isFavorite={config?.favorites?.some(
						fav => fav.key === worklogForm.issueKey,
					)}
					isIssueKeyEditable={worklogForm.isIssueKeyEditable}
					isEditMode={worklogForm.isEditMode}
					worklogId={worklogForm.worklogId}
				/>
			</Box>
		</Box>
	);
}
