# DeepSource Coverage Setup

This document explains how to set up DeepSource code coverage reporting for this repository.

## Prerequisites

1. **DeepSource Account**: Sign up at [deepsource.com](https://deepsource.com/)
2. **Repository Integration**: Connect your GitHub repository to DeepSource

## Setup Steps

### 1. DeepSource Configuration

Create a `.deepsource.toml` file in the repository root:

```toml
version = 1

[[analyzers]]
name = "javascript"
enabled = true

  [analyzers.meta]
  plugins = ["react"]
  environment = ["nodejs"]

[[transformers]]
name = "prettier"
enabled = true
```

### 2. GitHub Secrets Configuration

Add the DeepSource DSN as a GitHub secret:

1. Go to your repository settings
2. Navigate to **Secrets and variables** → **Actions**
3. Add a new repository secret:
   - **Name**: `DEEPSOURCE_DSN`
   - **Value**: Your DeepSource DSN (found in your DeepSource dashboard)

### 3. Coverage Workflow

The coverage workflow (`.github/workflows/coverage.yml`) will automatically:

- Run tests with coverage on every push and PR
- Generate Cobertura coverage reports
- Upload coverage data to DeepSource
- Provide backup coverage upload to Codecov (optional)

## Coverage Configuration

Coverage is configured in `package.json`:

```json
{
  "c8": {
    "check-coverage": true,
    "lines": 85,
    "functions": 85,
    "branches": 85,
    "statements": 85,
    "reporter": ["text", "cobertura"],
    "exclude": [
      "dist/**/*.test.js",
      "dist/tests/**",
      "coverage/**"
    ]
  }
}
```

## Running Coverage Locally

```bash
# Run tests with coverage
npm run test:coverage

# Coverage reports will be generated in the coverage/ directory
# - coverage/cobertura-coverage.xml (for CI/CD)
# - Terminal output shows coverage summary
```

## Coverage Targets

- **Lines**: 85%
- **Functions**: 85%
- **Branches**: 85%
- **Statements**: 85%

The CI will fail if coverage drops below these thresholds.

## DeepSource Benefits

1. **Code Quality Analysis**: Identifies potential issues and code smells
2. **Security Scanning**: Detects security vulnerabilities
3. **Coverage Tracking**: Monitors test coverage over time
4. **PR Integration**: Provides feedback directly in pull requests
5. **Technical Debt**: Tracks and helps reduce technical debt