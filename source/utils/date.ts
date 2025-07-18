export function formatLocalDateKey(date: Date): string {
	// Use local date to avoid timezone issues with worklog timestamps
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function getStartOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
	d.setDate(diff);
	d.setUTCHours(0, 0, 0, 0); // Use UTC to avoid timezone issues
	return d;
}

export function getEndOfWeek(date: Date): Date {
	const start = getStartOfWeek(date);
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	end.setUTCHours(23, 59, 59, 999); // Use UTC to avoid timezone issues
	return end;
}
