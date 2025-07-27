import React from 'react';
import {Box} from 'ink';
import {AttendanceEditForm} from '../AttendanceEditForm.js';
import type {AttendanceEditState} from '../../hooks/useAttendanceManagement.js';
import type {Attendance} from '../../attendance/types.js';
import type {JiraConfig} from '../../jira-client.js';

export type AttendanceEditFormAreaProps = {
	attendanceEdit: AttendanceEditState;
	config: JiraConfig;
	onSubmit: (data: Attendance) => void;
	onCancel: () => void;
};

export function AttendanceEditFormArea({
	attendanceEdit,
	config,
	onSubmit,
	onCancel,
}: AttendanceEditFormAreaProps) {
	return (
		<Box justifyContent="center">
			<Box
				width={50}
				borderStyle="round"
				borderColor="cyan"
				paddingX={1}
				paddingY={1}
			>
				<AttendanceEditForm
					date={attendanceEdit.date}
					initialData={attendanceEdit.data}
					config={config}
					onSubmit={onSubmit}
					onCancel={onCancel}
				/>
			</Box>
		</Box>
	);
}
