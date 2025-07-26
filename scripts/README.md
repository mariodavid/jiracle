# PR Analyzer Testing Scripts

This directory contains scripts for testing the PR analyzer logic locally without needing to run GitHub Actions.

## Scripts

### `test-pr-analyzer.sh`
Basic test script that runs hardcoded scenarios to verify the PR analyzer logic works correctly.

```bash
./scripts/test-pr-analyzer.sh
```

### `test-pr-analyzer-with-mocks.sh`  
Extended test script that uses mock response files to simulate different Claude responses.

```bash
./scripts/test-pr-analyzer-with-mocks.sh
```

## Mock Response Files

Located in `mock-responses/`:

- `claude-valid-skip.txt` - Proper Claude response with `TEST_REVIEW_DECISION: SKIP`
- `claude-valid-required.txt` - Proper Claude response with `TEST_REVIEW_DECISION: REQUIRED` 
- `claude-invalid-format.txt` - Claude response without proper format (tests fallback logic)
- `claude-empty.txt` - Empty response (tests git diff fallback)

## What the Scripts Test

1. **Method 1**: Parsing explicit `TEST_REVIEW_DECISION: [REQUIRED|SKIP]` format
2. **Method 2**: Fallback pattern matching for test file mentions
3. **Method 2.5**: Hardcoded check for `browser.test.ts` in PR title/body
4. **Method 3**: Git diff analysis against main branch as final fallback

## When to Use

- **Debugging PR analyzer failures** - Run locally to see which method should trigger
- **Testing new logic** - Verify changes before pushing to GitHub
- **Understanding behavior** - See exactly which fallback method gets used

## Output

The scripts show:
- ✅ Which methods succeed/fail
- 🧪 Final decision (REQUIRED/SKIP)
- 📋 Git diff analysis of current branch
- 🎯 Expected GitHub Actions behavior

Perfect for debugging issues like the one in PR #278!