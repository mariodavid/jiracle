import React, {useState} from 'react';
import {Box} from 'ink';
import {useInput} from 'ink';
import {useStdout} from 'ink';
import Header from './Header.js';
import MenuCard from './MenuCard.js';
import Navigation from './Navigation.js';

type MainMenuProps = {
	onSelect: (value: string) => void;
};

const menuItems = [
	{
		key: 'log-work',
		title: 'LOG WORK',
		description: 'Quick time entry for Jira tickets',
		icon: '📝',
	},
	{
		key: 'week-overview',
		title: 'WEEKLY TIMETABLE',
		description: 'View weekly worklog summary table',
		icon: '📊',
	},
	{
		key: 'settings',
		title: 'SETTINGS',
		description: 'Configuration and preferences',
		icon: '⚙️',
	},
];

export default function MainMenu({onSelect}: MainMenuProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const {stdout} = useStdout();

	// Calculate width based on terminal width, with minimum and maximum constraints
	const terminalWidth = stdout?.columns || 80;
	const containerWidth = Math.min(Math.max(terminalWidth - 4, 60), 120);

	// Calculate card width based on container width (3 cards + padding + borders)
	const cardWidth = Math.floor((containerWidth - 12) / 3);

	useInput((_input, key) => {
		if (key.leftArrow) {
			setSelectedIndex(current => (current > 0 ? current - 1 : current));
		} else if (key.rightArrow) {
			setSelectedIndex(current =>
				current < menuItems.length - 1 ? current + 1 : current,
			);
		} else if (key.return) {
			const selectedItem = menuItems[selectedIndex];
			if (selectedItem) {
				try {
					onSelect(selectedItem.key);
				} catch (error) {
					// Ignore callback errors to prevent crashes
				}
			}
		}
	});

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="cyan"
			paddingX={2}
			paddingY={1}
			width={containerWidth}
		>
			<Header />
			<Box paddingY={1}>
				<Box justifyContent="space-around" width="100%">
					{menuItems.map((item, index) => (
						<MenuCard
							key={item.key}
							title={item.title}
							description={item.description}
							icon={item.icon}
							selected={index === selectedIndex}
							width={cardWidth}
						/>
					))}
				</Box>
			</Box>
			<Navigation />
		</Box>
	);
}
