import React from 'react';
import {Box, Text} from 'ink';

type TitleBarProps = {
	title: string;
	color?: 'cyan' | 'red';
};

export function TitleBar({title, color = 'cyan'}: TitleBarProps) {
	return (
		<Box flexDirection="column">
			<Box justifyContent="center" paddingY={1}>
				<Text bold color={color}>
					{title}
				</Text>
			</Box>
			{/* Extra spacing after title */}
			<Box>
				<Text> </Text>
			</Box>
			<Box>
				<Text> </Text>
			</Box>
		</Box>
	);
}
