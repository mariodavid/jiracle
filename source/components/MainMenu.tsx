import React from 'react';
import {Text, Box} from 'ink';
import {Select} from '@inkjs/ui';
import {mainMenuItems} from '../constants/index.js';

type MainMenuProps = {
	onSelect: (value: string) => void;
};

export default function MainMenu({onSelect}: MainMenuProps) {
	return (
		<Box flexDirection="column">
			<Text color="cyan">What would you like to do?</Text>
			<Text> </Text>
			<Select options={mainMenuItems} onChange={onSelect} />
			<Text> </Text>
			<Text color="redBright" wrap="wrap">
				{' '}
			</Text>
		</Box>
	);
}
