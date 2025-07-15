# Test Guidelines

This document describes the testing patterns, utilities, and best practices for writing maintainable and consistent tests in this project.

## Test Utilities

### Core Test Helpers (`source/tests/utils/test-helpers.ts`)

#### TestData Factory

Create consistent test data objects:

```typescript
import {TestData} from '../utils/test-helpers.js';

// Standard attendance record
const attendance = TestData.createAttendance({
	date: '2025-07-11',
	checkIn: '08:00',
});

// Full day with calculated hours
const fullDay = TestData.createFullDayAttendance('2025-07-11');

// Partial record (only check-in)
const partial = TestData.createPartialAttendance('2025-07-11');

// Invalid data for error testing
const invalid = TestData.createInvalidAttendance();
```

#### ConfigFactory

Standardized configuration creation:

```typescript
import {ConfigFactory} from '../utils/test-helpers.js';

// Valid config with attendance enabled
const config = ConfigFactory.createValidConfig();

// Disabled attendance config
const disabled = ConfigFactory.createDisabledConfig();

// Custom invalid config for validation testing
const invalid = ConfigFactory.createInvalidAttendanceConfig({
	workingHours: -1,
	breakMinutes: 600,
});
```

#### TempFileManager

Automatic file management with cleanup:

```typescript
import {TestPatterns} from '../utils/test-helpers.js';

test('should handle file operations', async t => {
	await TestPatterns.withTempFiles(async manager => {
		// Create config file
		const configPath = manager.writeConfig(ConfigFactory.createValidConfig());

		// Create CSV file
		const csvPath = manager.createTempCSVPath();

		// Files are automatically cleaned up after test
		const result = await someOperation(configPath, csvPath);
		t.true(result.success);
	});
});
```

#### AssertionHelpers

DSL-style assertions with descriptive error messages:

```typescript
import {AssertionHelpers} from '../utils/test-helpers.js';

// Success/failure with clear messages
AssertionHelpers.assertSuccess(result, t);
AssertionHelpers.assertFailure(result, t, 'Expected error text');

// Time format validation
AssertionHelpers.assertTimeFormat(result, '08:30', t);

// Multiple message validation
AssertionHelpers.assertMessageContains(message, ['text1', 'text2'], t);

// Error message validation
AssertionHelpers.assertErrorContains(
	result,
	['JSON', 'parse', 'Unexpected'],
	t,
);
```

#### TestPatterns

Reusable test patterns for common scenarios:

```typescript
import {TestPatterns} from '../utils/test-helpers.js';

// Time validation across multiple invalid formats
const invalidTimes = ['8:30', '25:00', '12:60', 'invalid'];
await TestPatterns.testTimeValidation(executeCheckIn, invalidTimes, t);

// Date validation pattern
const invalidDates = ['2025-7-11', 'invalid', '2025/07/11'];
await TestPatterns.testDateValidation(executeCheckIn, invalidDates, t);
```

#### CSVHelpers

Pre-built CSV content for corruption testing:

```typescript
import {CSVHelpers} from '../utils/test-helpers.js';

// Invalid headers
const csvPath = manager.writeCSV(CSVHelpers.createInvalidHeaderCSV());

// Missing columns
const csvPath = manager.writeCSV(CSVHelpers.createMissingColumnsCSV());

// Special characters
const csvPath = manager.writeCSV(CSVHelpers.createSpecialCharactersCSV());
```

### UI Component Helpers (`source/tests/utils/ink-test-helpers.ts`)

#### Component Testing

Standardized component testing patterns:

```typescript
import {InkTestHelpers} from '../utils/ink-test-helpers.js';

// Test component structure with expected elements
InkTestHelpers.testComponentStructure(
	AttendanceEditForm,
	['Anwesenheit bearbeiten', 'Fr, 11. Jul', '08:00'],
	t,
);

// Test with specific data
const testData = InkTestHelpers.createTestAttendanceData();
InkTestHelpers.testComponentWithData(
	AttendanceEditForm,
	testData.withInitialData,
	['09:00', '18:00', '45m'],
	t,
);

// Test with config
const configs = InkTestHelpers.createTestConfigs();
InkTestHelpers.testComponentWithConfig(
	AttendanceEditForm,
	configs.withCustomDefaults,
	['07:30', '16:30'],
	t,
);
```

#### UI Interaction Helpers

Common UI interactions and validations:

```typescript
// Tab navigation simulation
const {lastFrame, stdin} = InkTestHelpers.renderAttendanceEditForm(Component);
InkTestHelpers.simulateTabNavigation(stdin, 3);

// Callback validation
InkTestHelpers.assertCallbackSetup(onSubmit, t);

// UI element assertions
InkTestHelpers.assertNavigationButtonsVisible(output, t);
InkTestHelpers.assertTimeInputsVisible(output, t);
InkTestHelpers.assertNavigationHelpVisible(output, t);

// German date format validation
InkTestHelpers.assertGermanDateFormat(output, 'Fr, 11. Jul', t);
```

## Testing Patterns

### CLI Command Testing

Use for testing command-line operations:

```typescript
test.serial('should execute command successfully', async t => {
	await TestPatterns.withTempFiles(async manager => {
		const configPath = manager.writeConfig(ConfigFactory.createValidConfig());
		const csvPath = manager.createTempCSVPath();

		const params = {date: '2025-07-11', time: '08:30'};
		const result = await executeCheckIn(params, configPath, csvPath);

		AssertionHelpers.assertTimeFormat(result, '08:30', t);
	});
});
```

### Component Testing

For React/Ink component testing:

```typescript
test('component renders with correct data', t => {
	const testData = InkTestHelpers.createTestAttendanceData();
	const output = InkTestHelpers.testComponentWithData(
		MyComponent,
		testData.valid,
		['08:00', '17:00', '30m'],
		t,
	);

	// Additional specific assertions
	t.true(output.includes('Expected text'));
});
```

### Error Handling Testing

For testing graceful error handling:

```typescript
test('handles corrupted data gracefully', async t => {
	await TestPatterns.withTempFiles(async manager => {
		const csvPath = manager.writeCSV(CSVHelpers.createInvalidHeaderCSV());
		const storage = new AttendanceCSVStorage(csvPath);

		const result = await storage.readAll();
		t.true(Array.isArray(result)); // Should not crash
	});
});
```

### Configuration Validation Testing

For testing config validation:

```typescript
test('validates invalid config correctly', async t => {
	await TestPatterns.withTempFiles(async manager => {
		const config = ConfigFactory.createInvalidAttendanceConfig({
			workingHours: -1,
		});
		const configPath = manager.writeConfig(config);

		const result = await executeWithConfig(configPath);

		// Document expected behavior for edge cases
		t.true(result.success || result.message.includes('working hours'));
	});
});
```

## Best Practices

### 1. Always Use Factories

```typescript
// ✅ Good - Use factories
const attendance = TestData.createAttendance({date: '2025-07-11'});
const config = ConfigFactory.createValidConfig();

// ❌ Avoid - Inline objects
const attendance = {date: '2025-07-11', checkIn: '08:00', ...};
```

### 2. Automatic Resource Management

```typescript
// ✅ Good - Automatic cleanup
await TestPatterns.withTempFiles(async manager => {
	const configPath = manager.writeConfig(config);
	// Automatic cleanup
});

// ❌ Avoid - Manual file management
const configPath = '/tmp/test-config.json';
writeFileSync(configPath, JSON.stringify(config));
// Manual cleanup required
```

### 3. Use Descriptive Assertions

```typescript
// ✅ Good - Clear error messages
AssertionHelpers.assertFailure(result, t, 'Time must be in HH:MM format');

// ❌ Avoid - Generic assertions
t.false(result.success);
t.true(result.message.includes('format'));
```

### 4. Component Testing Structure

```typescript
// ✅ Good - Use helpers for consistency
InkTestHelpers.testComponentStructure(Component, expectedElements, t);

// ❌ Avoid - Manual render setup
const {lastFrame} = render(React.createElement(Component, props));
const output = lastFrame() || '';
// Manual assertions
```

### 5. Test Organization

```typescript
// ✅ Good - Descriptive test names
test.serial('should reject future dates for check-in', async t => {
	// Test implementation
});

// ✅ Good - Group related tests
test.serial('should handle invalid working hours - negative', async t => {});
test.serial('should handle invalid working hours - zero', async t => {});
test.serial('should handle invalid working hours - over 24', async t => {});
```

## When to Use Serial Tests

Use `test.serial()` for:

- CLI commands that modify files
- Tests that create/modify shared resources
- Tests that depend on specific timing

Use regular `test()` for:

- Pure component rendering
- Calculation functions
- Isolated unit tests

## Common Patterns

### Time/Date Validation

```typescript
// Use pattern for multiple invalid formats
const invalidTimes = ['8:30', '08:3', '25:00', '12:60'];
await TestPatterns.testTimeValidation(executeFunction, invalidTimes, t);
```

### Error Message Testing

```typescript
// Test multiple possible error messages
AssertionHelpers.assertErrorContains(
	result,
	['JSON', 'parse', 'Unexpected'],
	t,
);
```

### Component Interaction

```typescript
// Test keyboard navigation
const {lastFrame, stdin} = InkTestHelpers.renderComponent(Component);
InkTestHelpers.simulateTabNavigation(stdin, 3);
InkTestHelpers.assertTimeInputsVisible(lastFrame() || '', t);
```

## Test Categories

- **Unit Tests**: Pure functions, utilities, calculations
- **Component Tests**: UI rendering and basic interaction
- **Integration Tests**: Complete workflows, CLI commands
- **Error Handling**: Validation, corruption recovery, edge cases

## Running Tests

```bash
# All tests with build and linting
npm test

# Specific pattern
npx ava dist/**/*.test.js -m "*attendance*"

# Watch mode
npx ava --watch

# Specific file
npx ava dist/tests/cli/attendance-commands.test.js
```

## Avoiding Lazy Test Assertions

### What Are Lazy Assertions?

Lazy assertions are test assertions that provide little to no actual verification value. They often pass regardless of whether the code being tested actually works correctly.

### Common Lazy Assertion Patterns to Avoid

#### 1. Generic t.pass() Without Verification

```typescript
// ❌ Bad - Lazy fallback assertion
test('integration flow', t => {
	// Complex setup...
	t.pass(); // Tells us nothing about whether integration actually works
});

// ✅ Good - Verify actual behavior
test('integration flow', async t => {
	const {lastFrame, stdin} = render(<App />);

	// Navigate and interact
	stdin.write(' '); // Open form
	stdin.write('2h'); // Enter time
	stdin.write('\r'); // Submit

	// Wait for and verify success state
	await waitFor(() => {
		const output = lastFrame();
		return output != null && output.includes('Success');
	});

	const finalOutput = lastFrame();
	t.true(finalOutput!.includes('Success'), 'Should show success message');
	t.true(mockJiraClient.addWorklog.calledOnce, 'Should call Jira API');
});
```

#### 2. Meaningless Type Checks

```typescript
// ❌ Bad - Useless type assertion
test('hook interface', t => {
	const expectedInterface = {
		data: 'should be WeeklyWorklogSummary | null',
		isLoading: 'should be boolean',
	};
	t.is(typeof expectedInterface, 'object'); // Tells us nothing
});

// ✅ Good - Test actual hook behavior
test('hook returns correct interface', async t => {
	const mockClient = createMockJiraClient();
	const mockConfig = ConfigFactory.createValidConfig();

	const hook = renderHook(() =>
		useWeeklyWorklogSummary(mockClient, mockConfig),
	);

	// Test initial state
	t.is(hook.result.current.data, null, 'Initial data should be null');
	t.is(hook.result.current.isLoading, true, 'Should be loading initially');
	t.is(
		typeof hook.result.current.refresh,
		'function',
		'Should provide refresh function',
	);

	// Wait for data load and verify
	await waitFor(() => {
		t.is(hook.result.current.isLoading, false, 'Should finish loading');
		t.truthy(hook.result.current.data, 'Should have loaded data');
	});
});
```

#### 3. Weak t.truthy() for Existence Only

```typescript
// ❌ Bad - Only checks existence
test('component renders', t => {
	const {lastFrame} = render(<Component />);
	const output = lastFrame();
	t.truthy(output); // Only confirms something rendered
});

// ✅ Good - Verify meaningful content
test('component renders with correct structure', t => {
	const {lastFrame} = render(<WeeklyTimetableView {...props} />);
	const output = lastFrame();

	// Verify specific UI elements
	t.true(output!.includes('Weekly Timetable'), 'Should show page title');
	t.true(output!.includes('Mon'), 'Should show Monday column');
	t.true(output!.includes('Tue'), 'Should show Tuesday column');
	t.true(output!.includes('Space: Add worklog'), 'Should show help text');
	t.true(output!.includes('█'), 'Should show focus indicator');
});
```

#### 4. Incomplete t.notThrows() Tests

```typescript
// ❌ Bad - Only tests that no error is thrown
test('handles keyboard input', t => {
	const {stdin} = render(<IssueList {...props} />);
	t.notThrows(() => {
		stdin.write('\r');
	});
});

// ✅ Good - Verify the actual behavior
test('handles enter key to select issue', t => {
	const mockOnSelect = sinon.stub();
	const {lastFrame, stdin} = render(
		<IssueList onSelect={mockOnSelect} {...props} />,
	);

	// Verify initial state
	let output = lastFrame();
	t.true(output!.includes('TEST-1'), 'Should show first issue');

	// Test the action AND its result
	t.notThrows(() => {
		stdin.write('\r');
	}, 'Enter key should not throw');

	// Verify the expected side effect
	t.true(mockOnSelect.calledOnce, 'Should call onSelect when enter is pressed');
	t.is(
		mockOnSelect.getCall(0).args[0].key,
		'TEST-1',
		'Should select the focused issue',
	);
});
```

#### 5. Cache Key Tests Without Hook Integration

```typescript
// ❌ Bad - Only tests string manipulation
test('cache key logic', t => {
	const expectedCacheKeyPattern = 'some-cache-key-2024-01-01';
	t.is(typeof expectedCacheKeyPattern, 'string'); // Meaningless
	t.true(expectedCacheKeyPattern.includes('2024-01-01')); // Weak
});

// ✅ Good - Test cache behavior functionally
test('cache key affects hook behavior', async t => {
	const mockClient = createMockJiraClient();
	const cacheGetSpy = sinon.spy();

	// Test with different configurations
	const config1 = ConfigFactory.createValidConfig({
		slidingWindowDays: {past: 7, future: 3},
	});
	const config2 = ConfigFactory.createValidConfig({
		slidingWindowDays: {past: 14, future: 7},
	});

	// Test that different configs use different cache keys
	const hook1 = renderHook(() => useWeeklyWorklogSummary(mockClient, config1));
	const hook2 = renderHook(() => useWeeklyWorklogSummary(mockClient, config2));

	await waitFor(() => {
		t.true(
			cacheGetSpy.calledTwice,
			'Should call cache twice for different configs',
		);
	});

	const cacheKey1 = cacheGetSpy.getCall(0).args[0];
	const cacheKey2 = cacheGetSpy.getCall(1).args[0];
	t.not(
		cacheKey1,
		cacheKey2,
		'Different configs should generate different cache keys',
	);
});
```

### Guidelines for Meaningful Tests

#### 1. Test Behavior, Not Implementation

```typescript
// Focus on what the user/system experiences
test('form submission saves worklog', async t => {
	// Setup
	const mockSubmit = sinon.stub();
	const {stdin} = render(<WorklogForm onSubmit={mockSubmit} />);

	// User interaction
	stdin.write('4h'); // Time input
	stdin.write('\t'); // Tab to comment
	stdin.write('Development work'); // Comment
	stdin.write('\r'); // Submit

	// Verify outcome
	t.true(mockSubmit.calledOnce, 'Should submit form');
	const submitData = mockSubmit.getCall(0).args[0];
	t.is(submitData.timeSpent, '4h', 'Should submit correct time');
	t.is(submitData.comment, 'Development work', 'Should submit correct comment');
});
```

#### 2. Use waitFor for Async UI Changes

```typescript
// Always wait for async state changes in UI tests
test('shows loading then success state', async t => {
	const {lastFrame} = render(<Component />);

	// Initial loading state
	let output = lastFrame();
	t.true(output!.includes('Loading'), 'Should show loading initially');

	// Wait for success state
	await waitFor(() => {
		output = lastFrame();
		return output != null && output.includes('Success');
	});

	t.true(output!.includes('Success'), 'Should show success message');
	t.false(output!.includes('Loading'), 'Should hide loading indicator');
});
```

#### 3. Test Error Handling Completely

```typescript
// Don't just test that errors don't crash - test error handling behavior
test('handles callback errors gracefully', async t => {
	let callbackWasCalled = false;
	let caughtError: Error | null = null;

	const onSelect = (_key: string) => {
		callbackWasCalled = true;
		throw new Error('Test error');
	};

	const {stdin, lastFrame} = render(
		<IssueList onSelect={onSelect} {...props} />,
	);

	// Trigger the error
	try {
		stdin.write('\r');
		await new Promise(resolve => setTimeout(resolve, 50));
	} catch (error) {
		caughtError = error as Error;
	}

	// Verify error handling
	t.true(callbackWasCalled, 'Callback should have been called');
	t.is(caughtError, null, 'Component should handle callback errors gracefully');

	// Verify component remains functional
	const output = lastFrame();
	t.true(output!.includes('TEST-123'), 'Should still show content after error');
	t.false(output!.includes('Error'), 'Should not display error in UI');
});
```

### Red Flags in Tests

Watch out for these patterns that often indicate lazy testing:

- Tests that only use `t.pass()` or `t.truthy(output)` without specific assertions
- Tests that check `typeof` for basic JavaScript types
- Tests that use `t.notThrows()` without verifying the expected outcome
- Integration tests that don't verify integration actually happened
- Component tests that only check for rendering without verifying content
- Tests with names like "should work" or "renders without crashing"

### Converting Lazy Tests

When you find lazy tests, ask:

1. **What behavior is this supposed to verify?**
2. **What would a user/consumer actually care about?**
3. **What could go wrong that this test should catch?**
4. **What specific outcome should this code produce?**

Then write assertions that verify those specific outcomes and behaviors.

These utilities and patterns ensure consistent, maintainable tests that are easy to read and extend.
