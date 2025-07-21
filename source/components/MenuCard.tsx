import React from 'react';
import {Box, Text} from 'ink';

type MenuCardProps = {
	title: string;
	description: string;
	icon: string;
	selected: boolean;
	width?: number;
};

const MenuCard: React.FC<MenuCardProps> = ({
	title,
	description,
	icon,
	selected,
	width = 26,
}) => {
	return (
		<Box
			flexDirection="column"
			alignItems="center"
			paddingX={2}
			paddingY={1}
			width={width}
			height={6}
			borderStyle="round"
			borderColor={selected ? 'cyan' : 'gray'}
		>
			<Box justifyContent="center">
				<Text bold color={selected ? 'cyan' : 'white'}>
					{icon} {title}
				</Text>
			</Box>
			<Box paddingTop={1} justifyContent="center">
				<Text color={selected ? 'white' : 'gray'} dimColor={!selected}>
					{description}
				</Text>
			</Box>
		</Box>
	);
};

export default MenuCard;
