import {useState, useEffect, useCallback} from 'react';
import {AttendanceManager} from '../attendance/AttendanceManager.js';
import type {Attendance} from '../attendance/types.js';
import type {JiraConfig} from '../jira-client.js';
import {formatLocalDateKey} from '../utils/date.js';

export type AttendanceEditState = {
	date: Date;
	data?: Attendance;
};

export type UseAttendanceManagementOptions = {
	config: JiraConfig;
	onRefresh: () => void;
	onActiveAreaChange: (area: string) => void;
};

export type UseAttendanceManagementReturn = {
	// State
	attendanceManager: AttendanceManager | undefined;
	attendanceRefreshKey: number;
	attendanceEdit: AttendanceEditState | undefined;

	// Actions
	handleAttendanceEdit: (data: {date: Date}) => Promise<void>;
	handleAttendanceSubmit: (data: Attendance) => Promise<void>;
	handleAttendanceCancel: () => void;
	handleCheckinConfirm: (confirmed: boolean) => Promise<void>;
	handleCheckoutConfirm: (confirmed: boolean) => Promise<void>;
	refreshAttendance: () => void;
};

export function useAttendanceManagement(
	options: UseAttendanceManagementOptions,
): UseAttendanceManagementReturn {
	const {config, onRefresh, onActiveAreaChange} = options;

	const [attendanceManager, setAttendanceManager] = useState<
		AttendanceManager | undefined
	>(undefined);
	const [attendanceRefreshKey, setAttendanceRefreshKey] = useState(0);
	const [attendanceEdit, setAttendanceEdit] = useState<
		AttendanceEditState | undefined
	>(undefined);

	// Initialize attendance manager when config changes
	useEffect(() => {
		if (config.attendance?.enabled) {
			const manager = new AttendanceManager(config.attendance);
			setAttendanceManager(manager);
		} else {
			setAttendanceManager(undefined);
		}
	}, [config.attendance]);

	const handleAttendanceEdit = useCallback(
		async (data: {date: Date}) => {
			if (!attendanceManager) return;

			try {
				// Load existing attendance data for this date
				// Use local date format to avoid timezone issues
				const dateKey = formatLocalDateKey(data.date);
				// Load attendance data directly for this specific date using getAllAttendance
				const allAttendance = await attendanceManager.getAllAttendance();
				const existingData = allAttendance.find(a => a.date === dateKey);

				setAttendanceEdit({
					date: data.date,
					data: existingData || undefined,
				});
				onActiveAreaChange('attendance-edit');
			} catch (error: unknown) {
				console.error('Failed to load attendance data:', error);
				// Still allow editing with defaults
				setAttendanceEdit({
					date: data.date,
					data: undefined,
				});
				onActiveAreaChange('attendance-edit');
			}
		},
		[attendanceManager, onActiveAreaChange],
	);

	const handleAttendanceSubmit = useCallback(
		async (data: Attendance) => {
			if (!attendanceManager) return;

			try {
				await attendanceManager.updateAttendance(data);
				setAttendanceEdit(undefined);
				onActiveAreaChange('timetable');
				// Refresh the data to show the updated attendance
				onRefresh();
				// Force attendance data refresh in TimetableGrid
				setAttendanceRefreshKey(previous => previous + 1);
			} catch (error: unknown) {
				console.error('Failed to save attendance:', error);
			}
		},
		[attendanceManager, onRefresh, onActiveAreaChange],
	);

	const handleAttendanceCancel = useCallback(() => {
		setAttendanceEdit(undefined);
		onActiveAreaChange('timetable');
	}, [onActiveAreaChange]);

	const handleCheckinConfirm = useCallback(
		async (confirmed: boolean) => {
			if (!confirmed || !attendanceManager) {
				onActiveAreaChange('timetable');
				return;
			}

			try {
				await attendanceManager.checkIn();
				setAttendanceRefreshKey(previous => previous + 1); // Trigger refresh
				onActiveAreaChange('timetable');
			} catch (error: unknown) {
				console.error('Error checking in:', error);
				onActiveAreaChange('timetable');
			}
		},
		[attendanceManager, onActiveAreaChange],
	);

	const handleCheckoutConfirm = useCallback(
		async (confirmed: boolean) => {
			if (!confirmed || !attendanceManager) {
				onActiveAreaChange('timetable');
				return;
			}

			try {
				await attendanceManager.checkOut();
				setAttendanceRefreshKey(previous => previous + 1); // Trigger refresh
				onActiveAreaChange('timetable');
			} catch (error: unknown) {
				console.error('Error checking out:', error);
				onActiveAreaChange('timetable');
			}
		},
		[attendanceManager, onActiveAreaChange],
	);

	const refreshAttendance = useCallback(() => {
		setAttendanceRefreshKey(previous => previous + 1);
	}, []);

	return {
		// State
		attendanceManager,
		attendanceRefreshKey,
		attendanceEdit,

		// Actions
		handleAttendanceEdit,
		handleAttendanceSubmit,
		handleAttendanceCancel,
		handleCheckinConfirm,
		handleCheckoutConfirm,
		refreshAttendance,
	};
}
