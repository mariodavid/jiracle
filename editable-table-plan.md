# Editable Table Plan - Phase 1: Cell Selection

## Goal

Implement table cell selection with Tab navigation and visual focus indicators for the timetable grid. Focus starts on current day by default.

## Requirements

- Tab navigation between cells (left to right, top to bottom)
- Visual indication of selected/focused cell
- Default focus on current day column
- Skip non-editable cells (header, issue key column, separators)

## Architecture

### 1. Focus Management

- Use Ink's `useFocus` hook for each selectable cell
- Each day column cell (Mon-Sun + Total) becomes focusable
- Issue rows have 8 focusable cells each (7 days + total)
- Daily total row has 8 focusable cells

### 2. Cell Types

- **Focusable cells**: Day columns for each issue row + daily totals row
- **Non-focusable**: Issue key column, separators, headers

### 3. Visual Design

- Focused cell: Different background color or border style
- Unfocused cells: Normal appearance
- Use `useFocus().isFocused` to determine visual state

### 4. Default Focus

- Calculate current day of week (Monday = 0, Sunday = 6)
- Focus first issue's current day cell by default
- If no issues, focus daily total's current day cell

## Implementation Plan

### Step 1: Create Focusable Cell Component

```typescript
interface FocusableCellProps {
	value: string;
	focusId: string;
	isDefault?: boolean;
}

function FocusableCell({value, focusId, isDefault}: FocusableCellProps) {
	const {isFocused} = useFocus({id: focusId, isActive: true});

	return (
		<Box
			width={8}
			justifyContent="flex-end"
			backgroundColor={isFocused ? 'blue' : undefined}
		>
			<Text color={isFocused ? 'white' : undefined}>{value}</Text>
		</Box>
	);
}
```

### Step 2: Modify TimetableGrid Component

- Replace static day cells with FocusableCell components
- Generate unique focusId for each cell (e.g., `issue-${issueKey}-${dayIndex}`)
- Add focus IDs for daily totals row
- Calculate current day and set default focus

### Step 3: Focus Calculation Logic

```typescript
function getCurrentDayIndex(): number {
	const today = new Date();
	const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
	return dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0
}

function getDefaultFocusId(issueMap: Record<string, IssueData>): string {
	const currentDayIndex = getCurrentDayIndex();
	const firstIssueKey = Object.keys(issueMap)[0];

	if (firstIssueKey) {
		return `issue-${firstIssueKey}-${currentDayIndex}`;
	}

	return `daily-total-${currentDayIndex}`;
}
```

### Step 4: Focus Manager Integration

- Use `useFocusManager` to set default focus on component mount
- Add effect to focus default cell when data loads

## Files to Modify

- `source/components/TimetableGrid.tsx`: Main implementation
- Create new component: `source/components/FocusableCell.tsx`

## Testing

- Tab navigation works correctly between cells
- Visual focus indicator is visible
- Default focus on current day works
- Skip non-editable areas correctly

## Future Phases

- Phase 2: Edit mode when pressing Enter on focused cell
- Phase 3: Input validation and data persistence
- Phase 4: Keyboard shortcuts (Escape to cancel, etc.)
