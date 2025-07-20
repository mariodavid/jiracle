import React from 'react';
import {Box, Text} from 'ink';

type TitleBarProps = {
	title: string;
	color?: 'cyan' | 'red';
};

export function TitleBar({title, color = 'cyan'}: TitleBarProps) {
	return (
		<Box justifyContent="center" paddingY={1}>
			<Text color={color} bold>
				{title}
			</Text>
		</Box>
	);
}
