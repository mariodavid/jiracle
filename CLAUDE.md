# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `npm run build` - Compile TypeScript source files to JavaScript
- `npm run dev` - Watch mode for TypeScript compilation  
- `npm test` - Run all tests (includes build, Prettier check, XO linting, and AVA tests)
- `npx ava dist/**/*.test.js -m "*pattern*"` - Run tests matching a pattern
- `npx ava --watch` - Run tests in watch mode
- `node dist/cli.js` - Run the compiled CLI application
- `npm start` - Build and run the CLI in one command

### Code Quality

- `npm run test:prettier` - Check code formatting
- `npm run test:xo` - Run XO linting

## Architecture

This is a terminal-based Jira time tracking application built with:

- **Ink 6.0**: React for terminals - provides component-based UI for CLI apps
- **TypeScript**: All source code is in the `source/` directory, compiled to `dist/`
- **Meow**: CLI helper for parsing arguments and displaying help
- **AVA**: Test runner with ink-testing-library for component testing

### Software Development Principles

This project follows modern React and software engineering best practices:

#### **Modular Design**
- **Small, focused modules**: Break down large components into smaller, single-responsibility pieces
- **React Hooks**: Extract state logic into custom hooks for reusability and testability
- **Separation of concerns**: Keep UI rendering separate from business logic and state management

#### **State Management Philosophy**
- **Custom Hooks**: Use custom hooks (e.g., `useWorklogForm`, `useWeeklyWorklogSummary`) to encapsulate state logic
- **Hook-first approach**: Prefer extracting state into hooks rather than managing it directly in components
- **Incremental refactoring**: Break down massive components systematically, one state concern at a time

#### **Testing Strategy**
- **Hook testing**: Every custom hook must have comprehensive test coverage
- **Component testing**: UI components tested with ink-testing-library
- **Test-driven refactoring**: When extracting logic, write tests first to ensure functionality is preserved
- **Integration testing**: End-to-end workflows verified with complete user scenarios

### Application State Machine

The app follows a state machine pattern for navigation:

```
loading → weekly-timetable (default view)
         ↓
    issue-selection-mode → issue-selection
         ↓
    time-selection → comment-input → date-selection
         ↓
    submitting → success → weekly-timetable
```

### Key Architecture Decisions

1. **State Management**: 
   - Application flow managed in `app.tsx`
   - Feature-specific state extracted into custom hooks
   - State colocated with the components that use it most
2. **Component Structure**: 
   - Presentational components in `source/components/`
   - Business logic in `source/hooks/` and `source/use-cases/`
   - Shared types in `source/types/index.ts`
3. **Testing Strategy**:
   - Component tests use ink-testing-library for UI testing
   - Hook tests verify state management and business logic
   - Integration tests verify complete workflows
   - All tests must be compiled before running

### Core Components

- `WeeklyTimetableView`: Main grid view showing issues × days for the week
- `TimetableGrid`: The actual grid component with keyboard navigation
- `FocusableCell`: Individual cells in the grid that can be selected
- `InlineWorklogForm`: Form for quick time entry directly in cells
- `WorklogForm/*`: Multi-step form components for detailed time logging

### Development Flow

1. Write TypeScript code in `source/`
2. Build with `npm run build` to compile to `dist/`
3. Test with `npm test` (includes build, linting, and tests)
4. Run the CLI with `node dist/cli.js`

The project uses ES modules (`"type": "module"` in package.json) and requires Node.js 16+.

## Testing

The project uses AVA as the test runner with comprehensive test utilities for consistent and maintainable testing.

### Test Structure

Tests are written in TypeScript alongside source files and compiled to `dist/` before execution. The test suite covers:

- **CLI Commands**: Command-line functionality and validation
- **UI Components**: React/Ink component rendering and interaction
- **Data Persistence**: CSV storage, corruption handling, and recovery
- **Business Logic**: Calculations, time handling, and status management
- **Error Handling**: Validation, edge cases, and graceful failures

### Quick Commands

```bash
# Run all tests (includes build, linting, and test execution)
npm test

# Run specific test pattern
npx ava dist/**/*.test.js -m "*attendance*"

# Watch mode for development
npx ava --watch
```

### Testing Best Practices

**Always follow the established patterns** documented in [guidelines/tests.md](guidelines/tests.md):

- Use `TestPatterns.withTempFiles()` for automatic file cleanup
- Use `TestData.createAttendance()` and `ConfigFactory.createValidConfig()` factories
- Use `AssertionHelpers` for clear, descriptive error messages
- Use `InkTestHelpers` for consistent UI component testing
- Use `test.serial()` for CLI commands that modify files or shared resources

#### **Hook Testing Patterns**

When testing custom React hooks, follow these patterns:

- **Test Component Wrapper**: Create a test component that uses the hook and reports state changes
- **Force Re-renders**: Use `rerender()` from ink-testing-library to capture state updates after hook method calls
- **Comprehensive Coverage**: Test initial state, all handlers, error conditions, and edge cases
- **TypeScript Integration**: Ensure proper interface testing and type safety
- **Async State Updates**: Account for React's asynchronous state updates in test assertions

Example hook test structure:
```typescript
function TestHookComponent({ options, onStateChange }) {
  const hookResult = useCustomHook(options);
  
  React.useEffect(() => {
    if (onStateChange) onStateChange(hookResult);
  }); // No dependencies - runs on every render
  
  return <Box>/* test UI */</Box>;
}
```

#### **Refactoring Testing Strategy**

When refactoring components:

1. **Existing tests first**: Ensure all existing component tests pass before and after refactoring
2. **Hook tests**: Write comprehensive tests for extracted hooks
3. **Incremental approach**: Extract one state concern at a time, testing each step
4. **Behavior preservation**: Verify that user-facing behavior remains unchanged

These utilities ensure tests are consistent, maintainable, and provide clear feedback when they fail.

## Configuration

The app reads configuration from `~/.config/jiracle.json` for Jira credentials and preferences.

### Example Configuration

```json
{
  "jiraUrl": "https://jira.example.com/",
  "username": "user@example.com",
  "apiToken": "your-api-token",
  "defaultTime": "4h",
  "defaultComment": "Development work",
  "slidingWindowDays": {"past": 14, "future": 7},
  "projects": [
    {
      "key": "DEF",
      "defaultComment": "Work on DEF project",
      "defaultTime": "6h"
    },
    {
      "key": "ABC",
      "defaultTime": "7h"
    }
  ],
  "favorites": [
    {
      "key": "PROJECT-123",
      "defaultTime": "8h",
      "defaultComment": "Working on main feature"
    },
    {
      "key": "PROJECT-456",
      "defaultTime": "2h",
      "defaultComment": "Bug fixing"
    }
  ]
}
```

### Configuration Options

- `defaultTime`: Global default time that appears in time input fields (e.g., "4h", "2.5h", "30m")
- `defaultComment`: Global default comment for all worklogs
- `slidingWindowDays`: Number of days to look back from the current week to include recent issues
- `projects[].defaultTime`: Project-specific default time
- `projects[].defaultComment`: Project-specific default comment
- `favorites[].defaultTime`: Issue-specific default time (highest priority)
- `favorites[].defaultComment`: Issue-specific default comment (highest priority)

The priority order is: Issue-specific > Project-specific > Global > Built-in defaults (1h for time, empty for comment).

#### Project-Level Defaults

Project defaults apply to all issues within a project (e.g., all issues starting with "JTS-" will use JTS project defaults). This helps avoid repetition when you have multiple issues in the same project that share common time logging patterns.