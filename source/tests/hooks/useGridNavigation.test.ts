import test from 'ava';
import {
	findInitialFocusItem,
	navigateInDirection,
	navigateToNextItem,
} from '../../services/GridNavigationService.js';
import {IssueKey} from '../../domain/IssueKey.js';

test('GridNavigationService - functions work correctly via hook pattern', t => {
	t.is(typeof findInitialFocusItem, 'function');
	t.is(typeof navigateInDirection, 'function');
	t.is(typeof navigateToNextItem, 'function');
});

test('GridNavigationService - findInitialFocusItem works correctly', t => {
	const focusableItems = [
		{
			focusId: 'item-1',
			issueKey: 'TEST-1',
			columnIndex: 0,
			isAttendance: false,
		},
		{
			focusId: 'item-2',
			issueKey: 'TEST-2',
			columnIndex: 1,
			isAttendance: false,
		},
	];

	const result = findInitialFocusItem(focusableItems);
	t.truthy(result);
	t.is(result?.focusId, 'item-1');
});

test('GridNavigationService - findInitialFocusItem with preferred column', t => {
	const focusableItems = [
		{
			focusId: 'item-1',
			issueKey: 'TEST-1',
			columnIndex: 0,
			isAttendance: false,
		},
		{
			focusId: 'item-2',
			issueKey: 'TEST-2',
			columnIndex: 1,
			isAttendance: false,
		},
	];

	const result = findInitialFocusItem(focusableItems, 1);
	t.truthy(result);
	t.is(result?.focusId, 'item-2');
});

test('GridNavigationService - navigateInDirection function works', t => {
	const context = {
		focusedCell: {issueKey: IssueKey.fromString('TEST-1'), columnIndex: 0},
		focusableItems: [
			{
				focusId: 'item-1',
				issueKey: 'TEST-1',
				columnIndex: 0,
				isAttendance: false,
			},
			{
				focusId: 'item-2',
				issueKey: 'TEST-1',
				columnIndex: 1,
				isAttendance: false,
			},
		],
	};

	const result = navigateInDirection('right', context);
	t.true(typeof result === 'object');
	t.true('success' in result);
});

test('GridNavigationService - navigateToNextItem function works', t => {
	const context = {
		focusedCell: {issueKey: IssueKey.fromString('TEST-1'), columnIndex: 0},
		focusableItems: [
			{
				focusId: 'item-1',
				issueKey: 'TEST-1',
				columnIndex: 0,
				isAttendance: false,
			},
			{
				focusId: 'item-2',
				issueKey: 'TEST-2',
				columnIndex: 0,
				isAttendance: false,
			},
		],
	};

	const result = navigateToNextItem(context);
	t.true(typeof result === 'object');
	t.true('success' in result);
});
