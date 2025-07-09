# Jiracle – The Terminal App for Effortless Jira Time Tracking

Jiracle is an interactive terminal application that helps you track and log your work time in Jira – without ever opening your browser.

## The Idea

Time tracking in Jira is often mandatory – but also tedious, click-heavy, and hard to navigate.  
Jiracle fixes that by giving you a fast, keyboard-friendly UI right in your terminal.

Goal: Quick overview of your weekly times and intuitive time logging via the Jira API – all from the terminal.

## Features

- Weekly time overview (issues × days, like a timesheet grid)
- Interactive terminal UI (not just a static CLI)
- Browse and select from your assigned Jira issues
- Log time entries inline (e.g. `2h "Bugfixing" on GVV-1234`)
- Caching for fast, responsive user experience
- Configurable Jira API access

## Tech Stack (suggested)

Depending on implementation:

- Node.js with [Ink](https://github.com/vadimdemedes/ink) – React-style terminal UIs
- or Python with [Textual](https://github.com/Textualize/textual) – modern TUI framework with layout, widgets, etc.

## Development

### Setup

```bash
npm install
npm run build
```

### Running the app

```bash
npm start
```

### Testing

Run all tests:

```bash
npm test
```

Run specific test categories:

```bash
# Only worklog tests
npm test -- --match="*worklog*"

# Only integration tests
npm test -- --match="*integration*"

# Only unit tests (jira-client)
npm test -- --match="*jira-client*"
```

Run specific test:

```bash
npm test -- --match="*should complete successful worklog submission*"
```

Additional test options:

```bash
# Verbose output
npm test -- --verbose

# Watch mode (runs tests on file changes)
npm run dev  # In first terminal
npx ava --watch  # In second terminal

# Fail fast (stop on first failure)
npm test -- --fail-fast
```

## Installation (coming soon)

```bash
npm install -g jiracle
# or
pipx install jiracle
```
