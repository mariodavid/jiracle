import React from 'react';
import {Box, Text} from 'ink';
import type {ResolvedActiveArea} from '../hooks/useActiveAreaResolver.js';
import {isBrowserOpenSupported} from '../utils/browser.js';
import type {JiraConfig} from '../jira-client.js';

export type HelpTextProps = {
	activeArea: ResolvedActiveArea;
	config: JiraConfig;
	showBonusTab?: boolean;
};

export function HelpText({
	activeArea,
	config,
	showBonusTab = false,
}: HelpTextProps) {
	const renderHelpContent = () => {
		switch (activeArea) {
			case 'worklog-form': {
				return (
					<Text color="gray">
						[↑↓] Select Time [Tab] Switch Areas [Enter] Submit [Esc] Cancel
					</Text>
				);
			}

			case 'statistics': {
				return (
					<Text color="gray">
						{showBonusTab
							? '[Tab/←→] Switch Tabs [1] Monthly [2] Bonus [Q] Back'
							: '[Q] Back'}
					</Text>
				);
			}

			case 'delete-confirmation':
			case 'delete-attendance-confirmation':
			case 'checkin-confirmation':
			case 'checkout-confirmation':
			case 'align-time-confirmation':
			case 'attendance-edit': {
				return <Text color="gray">[Enter] Confirm [Esc] Cancel</Text>;
			}

			default: {
				// Default timetable help
				return (
					<>
						<Text color="gray">
							[↑↓←→] Navigate Cells [Enter] Log Work [A] Add Worklog [Shift+←→]
							Week Navigation
						</Text>
						<Text color="gray">
							[D] Delete Worklogs [I] Check In [O] Check Out
							{isBrowserOpenSupported() && config.jiraUrl
								? ' [Shift+O] Open in Browser'
								: ''}
						</Text>
						<Text color="gray">
							[T] Today [R] Refresh [S] Statistics [Q] Quit
						</Text>
					</>
				);
			}
		}
	};

	return (
		<Box
			height={7}
			justifyContent="center"
			flexDirection="column"
			alignItems="center"
		>
			{renderHelpContent()}
		</Box>
	);
}
