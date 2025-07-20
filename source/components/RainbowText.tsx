import React from 'react';
import {Text} from 'ink';

export type RainbowTextProps = {
	children: string;
	bold?: boolean;
};

export function RainbowText({children, bold = false}: RainbowTextProps) {
	const colors = ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta'];

	return (
		<>
			{[...children].map((char, index) => (
				<Text
					key={`char-${index}`}
					color={colors[index % colors.length]}
					bold={bold}
				>
					{char}
				</Text>
			))}
		</>
	);
}
