import test from 'ava';
import {useGridNavigation} from '../../hooks/useGridNavigation.js';

test('useGridNavigation - hook provides navigation functions', t => {
	const {findInitialFocus, navigate, navigateToNext} = useGridNavigation();

	t.is(typeof findInitialFocus, 'function');
	t.is(typeof navigate, 'function');
	t.is(typeof navigateToNext, 'function');
});

test('useGridNavigation - findInitialFocus works correctly', t => {
	const {findInitialFocus} = useGridNavigation();

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

	const result = findInitialFocus(focusableItems);
	t.truthy(result);
	t.is(result?.focusId, 'item-1');
});

test('useGridNavigation - findInitialFocus with preferred column', t => {
	const {findInitialFocus} = useGridNavigation();

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

	const result = findInitialFocus(focusableItems, 1);
	t.truthy(result);
	t.is(result?.focusId, 'item-2');
});

test('useGridNavigation - navigate function works', t => {
	const {navigate} = useGridNavigation();

	const context = {
		focusedCell: {issueKey: 'TEST-1', columnIndex: 0},
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

	const result = navigate('right', context);
	t.true(typeof result === 'object');
	t.true('success' in result);
});

test('useGridNavigation - navigateToNext function works', t => {
	const {navigateToNext} = useGridNavigation();

	const context = {
		focusedCell: {issueKey: 'TEST-1', columnIndex: 0},
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

	const result = navigateToNext(context);
	t.true(typeof result === 'object');
	t.true('success' in result);
});
