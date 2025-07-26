import {LocalDate} from '../domain/LocalDate.js';

export function formatLocalDateKey(date: Date): string {
	// Use local date to avoid timezone issues with worklog timestamps
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function getStartOfWeek(date: Date): Date {
	const localDate = LocalDate.fromDate(date);
	const weekStart = localDate.getWeekStart();
	return new Date(weekStart.toISOString() + 'T00:00:00.000Z');
}

export function getEndOfWeek(date: Date): Date {
	const localDate = LocalDate.fromDate(date);
	const weekEnd = localDate.getWeekEnd();
	return new Date(weekEnd.toISOString() + 'T23:59:59.999Z');
}
