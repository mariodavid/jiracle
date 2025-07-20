import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {Text, Box} from 'ink';
import {
	useAttendanceManagement,
	type UseAttendanceManagementOptions,
} from '../../hooks/useAttendanceManagement.js';
import type {JiraConfig} from '../../jira-client.js';
import type {Attendance} from '../../attendance/types.js';

// Mock the AttendanceManager
const mockConfig: JiraConfig = {
	jiraUrl: 'https://test.atlassian.net',
	username: 'test@example.com',
	apiToken: 'test-token',
	defaultTime: '4h',
	defaultComment: 'Test work',
	attendance: {
		enabled: true,
		workingHours: 8,
		breakMinutes: 60,
		defaultBreakMinutes: 60,
		defaultCheckIn: '09:00',
		defaultCheckOut: '17:00',
	},
};

const mockConfigDisabled: JiraConfig = {
	...mockConfig,
	attendance: {
		enabled: false,
		workingHours: 8,
		breakMinutes: 60,
		defaultBreakMinutes: 60,
		defaultCheckIn: '09:00',
		defaultCheckOut: '17:00',
	},
};

// Test component that uses the hook
function TestAttendanceManagementComponent({
	options,
	onStateChange,
}: {
	options: UseAttendanceManagementOptions;
	onStateChange?: (state: any) => void;
}) {
	const attendanceManagement = useAttendanceManagement(options);

	// Always report the latest state
	React.useEffect(() => {
		if (onStateChange) {
			onStateChange(attendanceManagement);
		}
	}); // No dependencies - runs on every render

	return (
		<Box flexDirection="column">
			<Text>
				AttendanceManager:{' '}
				{attendanceManagement.attendanceManager ? 'present' : 'null'}
			</Text>
			<Text>
				AttendanceRefreshKey: {attendanceManagement.attendanceRefreshKey}
			</Text>
			<Text>
				AttendanceEdit:{' '}
				{attendanceManagement.attendanceEdit?.date.toISOString() || 'null'}
			</Text>
		</Box>
	);
}

test('useAttendanceManagement returns initial state with enabled attendance', async t => {
	let capturedState: any;

	const mockOptions: UseAttendanceManagementOptions = {
		config: mockConfig,
		onRefresh() {},
		onActiveAreaChange() {},
	};

	const {rerender} = render(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Wait for manager to be initialized
	await new Promise(resolve => setTimeout(resolve, 100));
	rerender(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Check initial state
	t.truthy(capturedState.attendanceManager);
	t.is(capturedState.attendanceRefreshKey, 0);
	t.is(capturedState.attendanceEdit, null);
});

test('useAttendanceManagement returns null manager when attendance disabled', t => {
	let capturedState: any;

	const mockOptions: UseAttendanceManagementOptions = {
		config: mockConfigDisabled,
		onRefresh() {},
		onActiveAreaChange() {},
	};

	render(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Check that manager is null when disabled
	t.is(capturedState.attendanceManager, null);
	t.is(capturedState.attendanceRefreshKey, 0);
	t.is(capturedState.attendanceEdit, null);
});

test('useAttendanceManagement handleAttendanceEdit sets edit state', async t => {
	let capturedState: any;
	let activeAreaChanged = '';

	const mockOptions: UseAttendanceManagementOptions = {
		config: mockConfig,
		onRefresh() {},
		onActiveAreaChange(area: string) {
			activeAreaChanged = area;
		},
	};

	const {rerender} = render(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Wait for manager to be initialized
	await new Promise(resolve => setTimeout(resolve, 100));
	rerender(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Mock the storage method if manager exists
	if (capturedState.attendanceManager) {
		capturedState.attendanceManager.storage = {
			async getByDate(_dateKey: string) {
				return {
					date: '2024-01-15',
					checkIn: '09:00',
					checkOut: '17:00',
					breakMinutes: 60,
				};
			},
		};
	}

	// Call handleAttendanceEdit
	const testDate = new Date('2024-01-15');
	await capturedState.handleAttendanceEdit({date: testDate});
	rerender(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.truthy(capturedState.attendanceEdit);
	t.deepEqual(capturedState.attendanceEdit.date, testDate);
	t.is(activeAreaChanged, 'attendance-edit');
});

test('useAttendanceManagement handleAttendanceEdit without manager does nothing', async t => {
	let capturedState: any;
	let activeAreaChanged = '';

	const mockOptions: UseAttendanceManagementOptions = {
		config: mockConfigDisabled,
		onRefresh() {},
		onActiveAreaChange(area: string) {
			activeAreaChanged = area;
		},
	};

	const {rerender} = render(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Call handleAttendanceEdit without manager
	const testDate = new Date('2024-01-15');
	await capturedState.handleAttendanceEdit({date: testDate});
	rerender(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.is(capturedState.attendanceEdit, null);
	t.is(activeAreaChanged, '');
});

test('useAttendanceManagement handleAttendanceSubmit saves data and refreshes', async t => {
	let capturedState: any;
	let activeAreaChanged = '';
	let refreshCalled = false;

	const mockOptions: UseAttendanceManagementOptions = {
		config: mockConfig,
		onRefresh() {
			refreshCalled = true;
		},
		onActiveAreaChange(area: string) {
			activeAreaChanged = area;
		},
	};

	const {rerender} = render(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Wait for manager to be initialized
	await new Promise(resolve => setTimeout(resolve, 100));
	rerender(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Mock the manager methods if it exists
	if (capturedState.attendanceManager) {
		capturedState.attendanceManager.updateAttendance = async (
			_data: Attendance,
		) => {
			// Empty function for test
		};
	}

	const initialRefreshKey = capturedState.attendanceRefreshKey;

	// Submit attendance data
	const testAttendance: Attendance = {
		date: '2024-01-15',
		checkIn: '09:30',
		checkOut: '17:30',
		breakMinutes: 45,
	};

	await capturedState.handleAttendanceSubmit(testAttendance);
	rerender(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.is(capturedState.attendanceEdit, null);
	t.is(activeAreaChanged, 'timetable');
	t.true(refreshCalled);
	t.true(capturedState.attendanceRefreshKey > initialRefreshKey);
});

test('useAttendanceManagement handleAttendanceCancel clears edit state', t => {
	let capturedState: any;
	let activeAreaChanged = '';

	const mockOptions: UseAttendanceManagementOptions = {
		config: mockConfig,
		onRefresh() {},
		onActiveAreaChange(area: string) {
			activeAreaChanged = area;
		},
	};

	const {rerender} = render(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Call handleAttendanceCancel
	capturedState.handleAttendanceCancel();
	rerender(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.is(capturedState.attendanceEdit, null);
	t.is(activeAreaChanged, 'timetable');
});

test('useAttendanceManagement handleCheckinConfirm performs check-in', async t => {
	let capturedState: any;
	let activeAreaChanged = '';

	const mockOptions: UseAttendanceManagementOptions = {
		config: mockConfig,
		onRefresh() {},
		onActiveAreaChange(area: string) {
			activeAreaChanged = area;
		},
	};

	const {rerender} = render(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Wait for manager to be initialized and mock its methods
	await new Promise(resolve => setTimeout(resolve, 100));
	rerender(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	if (capturedState.attendanceManager) {
		capturedState.attendanceManager.checkIn = async () => {};
	}

	const initialRefreshKey = capturedState.attendanceRefreshKey;

	// Call handleCheckinConfirm with confirmed = true
	await capturedState.handleCheckinConfirm(true);
	rerender(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.is(activeAreaChanged, 'timetable');
	t.true(capturedState.attendanceRefreshKey > initialRefreshKey);
});

test('useAttendanceManagement handleCheckinConfirm cancels when not confirmed', async t => {
	let capturedState: any;
	let activeAreaChanged = '';

	const mockOptions: UseAttendanceManagementOptions = {
		config: mockConfig,
		onRefresh() {},
		onActiveAreaChange(area: string) {
			activeAreaChanged = area;
		},
	};

	const {rerender} = render(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	const initialRefreshKey = capturedState.attendanceRefreshKey;

	// Call handleCheckinConfirm with confirmed = false
	await capturedState.handleCheckinConfirm(false);
	rerender(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.is(activeAreaChanged, 'timetable');
	t.is(capturedState.attendanceRefreshKey, initialRefreshKey);
});

test('useAttendanceManagement handleCheckoutConfirm performs check-out', async t => {
	let capturedState: any;
	let activeAreaChanged = '';

	const mockOptions: UseAttendanceManagementOptions = {
		config: mockConfig,
		onRefresh() {},
		onActiveAreaChange(area: string) {
			activeAreaChanged = area;
		},
	};

	const {rerender} = render(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Wait for manager to be initialized and mock its methods
	await new Promise(resolve => setTimeout(resolve, 100));
	rerender(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	if (capturedState.attendanceManager) {
		capturedState.attendanceManager.checkOut = async () => {};
	}

	const initialRefreshKey = capturedState.attendanceRefreshKey;

	// Call handleCheckoutConfirm with confirmed = true
	await capturedState.handleCheckoutConfirm(true);
	rerender(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.is(activeAreaChanged, 'timetable');
	t.true(capturedState.attendanceRefreshKey > initialRefreshKey);
});

test('useAttendanceManagement refreshAttendance increments refresh key', t => {
	let capturedState: any;

	const mockOptions: UseAttendanceManagementOptions = {
		config: mockConfig,
		onRefresh() {},
		onActiveAreaChange() {},
	};

	const {rerender} = render(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	const initialRefreshKey = capturedState.attendanceRefreshKey;

	// Call refreshAttendance
	capturedState.refreshAttendance();
	rerender(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	t.true(capturedState.attendanceRefreshKey > initialRefreshKey);
});

test('useAttendanceManagement hook structure is correct', t => {
	let capturedState: any;

	const mockOptions: UseAttendanceManagementOptions = {
		config: mockConfig,
		onRefresh() {},
		onActiveAreaChange() {},
	};

	render(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
			onStateChange(state: any) {
				capturedState = state;
			},
		}),
	);

	// Check all expected properties exist
	t.truthy(capturedState);

	// State properties
	t.true('attendanceManager' in capturedState);
	t.true('attendanceRefreshKey' in capturedState);
	t.true('attendanceEdit' in capturedState);

	// Action properties
	t.true('handleAttendanceEdit' in capturedState);
	t.true('handleAttendanceSubmit' in capturedState);
	t.true('handleAttendanceCancel' in capturedState);
	t.true('handleCheckinConfirm' in capturedState);
	t.true('handleCheckoutConfirm' in capturedState);
	t.true('refreshAttendance' in capturedState);

	// Check function types
	t.is(typeof capturedState.handleAttendanceEdit, 'function');
	t.is(typeof capturedState.handleAttendanceSubmit, 'function');
	t.is(typeof capturedState.handleAttendanceCancel, 'function');
	t.is(typeof capturedState.handleCheckinConfirm, 'function');
	t.is(typeof capturedState.handleCheckoutConfirm, 'function');
	t.is(typeof capturedState.refreshAttendance, 'function');
});

test('useAttendanceManagement displays state correctly in component', async t => {
	const mockOptions: UseAttendanceManagementOptions = {
		config: mockConfig,
		onRefresh() {},
		onActiveAreaChange() {},
	};

	const {lastFrame, rerender} = render(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
		}),
	);

	// Wait for manager to be initialized
	await new Promise(resolve => setTimeout(resolve, 100));
	rerender(
		React.createElement(TestAttendanceManagementComponent, {
			options: mockOptions,
		}),
	);

	const output = lastFrame() || '';

	// Check initial values are displayed
	t.true(output.includes('AttendanceManager: present'));
	t.true(output.includes('AttendanceRefreshKey: 0'));
	t.true(output.includes('AttendanceEdit: null'));
});
