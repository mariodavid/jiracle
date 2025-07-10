import React from 'react';
import {Text} from 'ink';

export interface RainbowTextProps {
	children: string;
	bold?: boolean;
}

export function RainbowText({children, bold = false}: RainbowTextProps) {
	const colors = ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta'];

	return (
		<>
			{children.split('').map((char, index) => (
				<Text key={index} color={colors[index % colors.length]} bold={bold}>
					{char}
				</Text>
			))}
		</>
	);
}
