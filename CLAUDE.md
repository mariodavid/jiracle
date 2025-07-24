# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for TypeScript compilation  
- `npm test` - Run all tests with auto-formatting (local development)
- `npm run test:ci` - Run tests with format checking (CI/CD)
- `npm run lint:fix` - Auto-fix XO linting issues
- `npx ava dist/**/*.test.js -m "*pattern*"` - Run tests matching a pattern
- `node dist/cli.js` - Run the compiled CLI application

## Architecture

Terminal-based Jira time tracking built with **Ink 6.0** (React for terminals), **TypeScript**, and **AVA** testing.

### Key Principles
- **Custom Hooks**: Extract state logic into hooks (`useWorklogForm`, `useWeeklyWorklogSummary`)
- **Hook-first**: Prefer hooks over component state management
- **Test-driven refactoring**: Write tests before extracting logic
- **Modular components**: Small, focused, single-responsibility pieces

### State Flow
```
loading → weekly-timetable → issue-selection → time-selection → comment-input → date-selection → submitting → success
```

### Structure
- `source/` - TypeScript source, compiled to `dist/`
- `source/components/` - UI components
- `source/hooks/` - Custom React hooks
- `source/use-cases/` - Business logic
- Core components: `WeeklyTimetableView`, `TimetableGrid`, `InlineWorklogForm`

## Testing

Uses **AVA** with comprehensive test utilities. Tests written in TypeScript, compiled to `dist/` before execution.

**⚠️ CRITICAL: ALL tests MUST follow the Test Data Pattern specified in [guidelines/tests.md](guidelines/tests.md)**

### Mandatory Test Structure
Every test MUST follow this exact pattern:
1. **EXPLICIT TEST DATA** (at the top) - Define expected inputs and outputs
2. **OPERATIONS** (in the middle) - Execute the functionality being tested  
3. **SPECIFIC VALUE COMPARISONS** (at the bottom) - Verify exact expected results

### Forbidden Patterns
- ❌ `t.pass()` without verification
- ❌ Generic existence checks (`t.truthy(output)`, `output.length > 0`)
- ❌ Type-only testing (`typeof === 'function'`)
- ❌ `t.notThrows()` without verifying expected behavior
- ❌ Any test that doesn't follow the 3-part structure above

### Testing Utilities
- Use `TestPatterns.withTempFiles()` for file cleanup
- Use `TestData.createAttendance()` and `ConfigFactory.createValidConfig()` factories  
- Use `AssertionHelpers` for descriptive error messages
- Use `test.serial()` for CLI commands that modify files
- Hook testing: Create wrapper component, test initial state + handlers + edge cases

### Complete Guidelines
See [guidelines/tests.md](guidelines/tests.md) for comprehensive testing patterns, examples, and enforcement rules.

## GitHub Integration

**IMPORTANT**: For ALL GitHub interactions, ALWAYS use the `gh` command-line tool, even when user provides GitHub URLs.

### Mandatory PR Creation Process

**⚠️ CRITICAL: Before creating ANY pull request, you MUST:**

1. **Run complete linting and tests locally:**
   ```bash
   npm run lint:fix  # Fix all linting issues
   npm test         # Run full test suite
   ```
   
2. **Only proceed if both commands succeed without errors**

3. **After creating PR, ALWAYS wait for and check CI status:**
   ```bash
   gh pr checks <PR_NUMBER>  # Check PR status
   ```
   
4. **If checks fail, you MUST:**
   - Examine the failure details with `gh pr checks <PR_NUMBER>`
   - Fix all issues locally
   - Re-run `npm run lint:fix` and `npm test` 
   - Push fixes and wait for checks again
   - **Never merge PRs with failing checks**

**Example complete workflow:**
```bash
# 1. MANDATORY: Run local checks first
npm run lint:fix
npm test

# 2. Only if both succeed, create PR
git checkout -b feature/my-change
git add .
git commit -m "My change"
git push -u origin feature/my-change
gh pr create --title "My change" --body "Description"

# 3. MANDATORY: Wait for and verify CI checks
gh pr checks <PR_NUMBER>
# If checks fail, fix issues and repeat until all pass

# 4. Only merge when all checks are green
gh pr merge <PR_NUMBER>
```

**This prevents failed CI runs and maintains code quality standards.**

## Configuration

The app reads configuration from `~/.config/jiracle.json` for Jira credentials and preferences.

Key configuration options:
- `defaultTime`, `defaultComment` - Global defaults
- `projects[]` - Project-specific defaults by key prefix
- `favorites[]` - Issue-specific defaults and aliases
- `groups[]` - Organize issues with shared defaults
- `commentPrefillDays` - Auto-fill comments from recent worklogs
- `slidingWindowDays` - Show recent issues across weeks

Priority: Issue-specific > Group-specific > Project-specific > Global defaults