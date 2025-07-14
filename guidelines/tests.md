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

These utilities and patterns ensure consistent, maintainable tests that are easy to read and extend.
