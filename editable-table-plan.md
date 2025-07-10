# Editable Table Plan - Phase 2: Direct Worklog Entry

## Goal

Implement direct worklog entry when pressing Enter on a focused cell in the timetable. The issue key and date should be automatically determined from the selected cell, and the user only needs to enter time and comment.

## Requirements

- Enter key on focused cell starts worklog flow
- Issue key and date are pre-filled from selected cell
- User only enters time and comment
- Smooth transition to worklog form
- Return to timetable after successful submission

## Current State Analysis

The timetable already has:

- ✅ Cell focus management with arrow key navigation
- ✅ Focus indicators with cyan background
- ✅ Worklog flow implementation in `useWorklogFlow.ts`
- ✅ Weekly timetable as main entry point

## Implementation Plan

### 1. TimetableGrid Enhancement

**File**: `source/components/TimetableGrid.tsx`

Add Enter key handler to existing `useInput` hook:

```typescript
useInput((input, key) => {
	// ... existing arrow key navigation ...

	if (key.return && onCellWorklog) {
		// Get current focus info
		const issueKey = issueKeys[currentFocus.row];
		const date = weekDates[currentFocus.col];

		// Only trigger on day cells (not total column)
		if (currentFocus.col < 7 && issueKey) {
			onCellWorklog({issueKey, date});
		}
	}
});
```

Add new prop:

```typescript
export interface TimetableGridProps {
	data: WeeklyWorklogSummary | null;
	isLoading: boolean;
	onWeekChange?: (direction: 'prev' | 'next') => void;
	onCellWorklog?: (data: {issueKey: string; date: Date}) => void;
}
```

### 2. WeeklyTimetableView Enhancement

**File**: `source/components/WeeklyTimetableView.tsx`

Add prop and pass through to TimetableGrid:

```typescript
export interface WeeklyTimetableViewProps {
	onBack: () => void;
	onLogWork?: () => void;
	onCellWorklog?: (data: {issueKey: string; date: Date}) => void;
	config: JiraConfig;
	preloadedData?: WeeklyWorklogSummary | null;
	userEmail?: string | null;
}
```

Update footer to show Enter shortcut:

```typescript
<Text color="gray">
	[↑↓←→] Navigate Cells [Enter] Log Work [Shift+←→] Week Navigation [L] Log Work
	[T] Today [R] Refresh [Q] Quit
</Text>
```

### 3. App.tsx Enhancement

**File**: `source/app.tsx`

Add handler for prefilled worklog:

```typescript
const handleCellWorklog = async (data: {issueKey: string; date: Date}) => {
	// Fetch issue details first
	const issue = await jiraClient.fetchIssue(data.issueKey);

	// Start worklog flow with prefilled data
	startWorklogWithPrefilledData(issue, data.date);
};
```

### 4. useWorklogFlow Enhancement

**File**: `source/hooks/useWorklogFlow.ts`

Add new function to start with prefilled data:

```typescript
const startWorklogWithPrefilledData = (issue: JiraIssue, date: Date) => {
	// Reset all state
	setSelectedIssue(issue);
	setSelectedTime('');
	setComment('');
	setSelectedDate(date.toISOString().split('T')[0]);
	setIssueSelectionMode(null);
	setManualIssueKey('');
	setInputError('');

	// Skip to time selection
	setStep('time-selection');
};
```

Return the new function:

```typescript
return {
	// ... existing returns ...
	startWorklogWithPrefilledData,
};
```

### 5. Updated User Flow

1. **Cell Selection**: User navigates to desired cell (Issue + Day)
2. **Enter Press**: User presses Enter
3. **Issue Lookup**: System fetches issue details from Jira
4. **Time Selection**: User selects/enters time duration
5. **Comment Entry**: User enters comment
6. **Submission**: Worklog is saved with prefilled issue and date
7. **Return**: User returns to timetable

## Technical Details

### Date Handling

- Extract date from `weekDates[currentFocus.col]`
- Format for API: `date.toISOString().split('T')[0]`
- Skip total column (col >= 7)

### Issue Key Extraction

- Get from `issueKeys[currentFocus.row]`
- Only valid for issue rows (not daily totals)

### Error Handling

- Handle issue fetch failures gracefully
- Show error message if issue not accessible
- Return to timetable on error

## Files to Modify

1. `source/components/TimetableGrid.tsx` - Add Enter handler + callback prop
2. `source/components/WeeklyTimetableView.tsx` - Pass through callback + update footer
3. `source/app.tsx` - Add cell worklog handler
4. `source/hooks/useWorklogFlow.ts` - Add prefill functionality

## User Experience Improvements

- **Faster workflow**: Skip issue selection step
- **Context awareness**: Date and issue pre-selected
- **Keyboard-first**: No mouse/trackpad needed
- **Visual feedback**: Clear focus indicators show selection

## Testing Considerations

- Test Enter key only works on day cells (not total column)
- Test issue fetch error handling
- Test date formatting for API
- Test return to timetable after submission
- Update existing tests for new keyboard shortcuts

## Future Enhancements

- **Edit existing entries**: If cell has hours, pre-fill time field
- **Bulk operations**: Select multiple cells for batch entry
- **Quick time shortcuts**: Number keys for common durations
- **Validation**: Warn about weekend entries or overtime
