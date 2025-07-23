import React from 'react';
import {Box, Text} from 'ink';
import {Spinner} from '@inkjs/ui';

type TimetableLoadingStatesProps = {
	isLoading: boolean;
	data: any;
	favoriteIssues: any[];
	minHeight: number;
};

export function TimetableLoadingStates({
	isLoading,
	data,
	favoriteIssues,
	minHeight,
}: TimetableLoadingStatesProps) {
	if (isLoading) {
		return (
			<Box
				flexDirection="column"
				paddingX={1}
				alignItems="center"
				minHeight={minHeight}
			>
				<Box
					flexDirection="column"
					alignItems="center"
					justifyContent="center"
					flexGrow={1}
				>
					<Spinner label="Loading worklogs..." />
				</Box>
			</Box>
		);
	}

	if (!data) {
		return (
			<Box
				flexDirection="column"
				paddingX={1}
				alignItems="center"
				minHeight={minHeight}
			>
				<Box
					flexDirection="column"
					alignItems="center"
					justifyContent="center"
					flexGrow={1}
				>
					<Text color="gray">No data available</Text>
				</Box>
			</Box>
		);
	}

	if (data.dailySummaries.length === 0 && favoriteIssues.length === 0) {
		return (
			<Box
				flexDirection="column"
				paddingX={1}
				alignItems="center"
				minHeight={minHeight}
			>
				<Box
					flexDirection="column"
					alignItems="center"
					justifyContent="center"
					flexGrow={1}
				>
					<Text color="yellow">No worklogs found for this week</Text>
				</Box>
			</Box>
		);
	}

	return null;
}
