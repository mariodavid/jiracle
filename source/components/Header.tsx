import React from 'react';
import {Box, Text} from 'ink';

const Header = () => {
	return (
		<Box
			flexDirection="column"
			alignItems="center"
			paddingY={1}
			borderStyle="round"
			borderColor="cyan"
		>
			<Box
				justifyContent="center"
				borderStyle="double"
				borderColor="cyan"
				paddingX={2}
				paddingY={1}
			>
				<Text bold color="cyan">
					JIRACLE
				</Text>
			</Box>
			<Box paddingTop={1}>
				<Text color="gray">Terminal Worklog Manager</Text>
			</Box>
		</Box>
	);
};

export default Header;
