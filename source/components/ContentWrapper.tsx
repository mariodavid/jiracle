import React from 'react';
import {Box} from 'ink';

export type ContentWrapperProps = {
	children: React.ReactNode;
};

export function ContentWrapper({children}: ContentWrapperProps) {
	return (
		<Box
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
			width="100%"
			paddingY={2}
		>
			<Box flexDirection="column" width={60} minWidth={50}>
				{children}
			</Box>
		</Box>
	);
}
