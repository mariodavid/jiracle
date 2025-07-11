import type {SelectOption} from '../types/index.js';

export const mainMenuItems: SelectOption[] = [
	{label: 'Log Work', value: 'log-work'},
	{label: 'Week Overview', value: 'week-overview'},
	{label: 'Settings', value: 'settings'},
];

export const issueSelectionModeItems: SelectOption[] = [
	{label: 'Favorites', value: 'favorites'},
	{label: 'Assigned Issues', value: 'assigned'},
	{label: 'Other (Enter Issue Key)', value: 'other'},
];

export const timeItems: SelectOption[] = [
	{label: '1h', value: '1h'},
	{label: '2h', value: '2h'},
	{label: '4h', value: '4h'},
	{label: '6h', value: '6h'},
	{label: '8h', value: '8h'},
	{label: 'Custom time...', value: 'custom'},
];

export const getDateItems = (): SelectOption[] => {
	const today = new Date().toISOString().split('T')[0];
	return [
		{label: `Today (${today})`, value: new Date().toISOString()},
		{
			label: 'Yesterday',
			value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
		},
		{
			label: 'Day before yesterday',
			value: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
		},
	];
};
