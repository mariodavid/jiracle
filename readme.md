# Jiracle

A terminal-based Jira time tracking application that makes logging work effortless. Built with Ink (React for terminals) to provide a smooth, keyboard-driven interface for managing your Jira worklogs.

![Node Version](https://img.shields.io/badge/node-%3E%3D16-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

Jiracle transforms the tedious task of logging time in Jira into a streamlined terminal experience. Instead of navigating through Jira's web interface, you can view your entire week's work in a compact grid and log time with just a few keystrokes.

The application presents your Jira issues in a calendar-like timetable where each row represents an issue and each column represents a day of the week. You can quickly see where you've already logged time, add new entries, or modify existing ones - all without leaving your terminal.

### Key Benefits

- **Efficient Time Tracking**: Log time for multiple issues and days in one session without page loads or context switches
- **Week Overview**: See your entire week's logged work at a glance to identify gaps or review your time allocation
- **Offline-First**: View and plan your time entries offline; sync with Jira when connected
- **Developer-Friendly**: Designed for keyboard-driven workflows, perfect for developers who live in the terminal

## Features

- **Weekly Timetable View** - See all your Jira issues in a week-at-a-glance grid
- **Keyboard Navigation** - Navigate efficiently with arrow keys and shortcuts
- **Quick Time Entry** - Log time directly in the grid cells with inline forms
- **Smart Issue Selection** - Access favorites, assigned issues, or search by key
- **Daily Reminders** - Automatic desktop notifications to remind you to log time
- **Default Comments** - Configure global and issue-specific default comments
- **Favorite Issues** - Quick access to frequently used issues
- **Inline Editing** - Edit worklogs without leaving the timetable view
- **Beautiful Terminal UI** - Clean, responsive interface built with Ink

### How It Works

1. **Launch Jiracle** - The app opens with your weekly timetable showing all your active issues
2. **Navigate the Grid** - Use arrow keys to move between cells (issue/day combinations)
3. **Log Time** - Press Enter on any cell to open an inline form:
   - Select time from predefined options (1h, 2h, 4h, etc.) or enter custom time
   - Add a comment (auto-filled with default comments if configured)
   - Submit directly from the timetable view
4. **Default Comments** - Comments are pre-filled based on your configuration:
   - Favorite issues use their specific default comments
   - Other issues use the global default comment
   - You can always edit or override the default
5. **Submit** - Worklogs are synced to Jira automatically

### Workflow Example

```
Monday    Tuesday   Wednesday Thursday  Friday
PROJ-123  2h        -         4h        -         -
PROJ-456  -         6h        2h        -         -
PROJ-789  4h        -         -         8h        -
```

Navigate to any cell, press Enter, type "2h 30m", add a comment, and you're done. The interface updates instantly, and your time is logged in Jira.

## Installation

```bash
npm install -g jiracle
```

Or run directly with npx:

```bash
npx jiracle
```

## Configuration

Create a configuration file at `~/.config/jiracle.json`:

```json
{
	"jiraUrl": "https://your-company.atlassian.net",
	"username": "your-email@company.com",
	"apiToken": "your-jira-api-token",
	"defaultComment": "Work logged via Jiracle",
	"reminders": {
		"enabled": true,
		"times": ["11:30", "16:30"],
		"weekdaysOnly": true
	},
	"favorites": [
		{
			"key": "PROJ-123",
			"defaultComment": "Development work on main project"
		},
		{
			"key": "PROJ-456"
		}
	]
}
```

### Configuration Options

| Option           | Required | Description                                                             |
| ---------------- | -------- | ----------------------------------------------------------------------- |
| `jiraUrl`        | Yes      | Your Jira instance URL (e.g., `https://company.atlassian.net`)          |
| `username`       | Yes      | Your Jira username/email                                                |
| `apiToken`       | Yes      | Your Jira API token                                                     |
| `defaultComment` | No       | Default comment for all worklogs when no specific comment is configured |
| `reminders`      | No       | Daily reminder settings for desktop notifications                       |
| `favorites`      | No       | Array of favorite issues with optional default comments                 |

### Favorite Issues

Favorite issues can be configured in two ways:

**Simple format** (just the issue key):

```json
"favorites": ["PROJ-123", "PROJ-456"]
```

**Advanced format** (with default comments):

```json
"favorites": [
	{
		"key": "PROJ-123",
		"defaultComment": "Development work on main project"
	},
	{
		"key": "PROJ-456",
		"defaultComment": "Bug fixes and maintenance"
	}
]
```

### Comment Priority

When creating a worklog, comments are used in this priority order:

1. **Specific favorite comment** - Comment configured for the specific issue
2. **Global default comment** - The `defaultComment` from configuration
3. **Empty string** - No default comment

Example: If `PROJ-123` has a specific `defaultComment` and you have a global `defaultComment`, the specific one will be used for `PROJ-123`, while other issues use the global default.

### Daily Reminders

Jiracle can automatically remind you to log time with desktop notifications. When the app is running, it periodically checks if you've logged any time today and sends a notification if you haven't.

**Configuration:**

```json
{
	"reminders": {
		"enabled": true,
		"times": ["11:30", "16:30"],
		"weekdaysOnly": true
	}
}
```

**Reminder Options:**

| Option         | Type     | Default | Description                                             |
| -------------- | -------- | ------- | ------------------------------------------------------- |
| `enabled`      | boolean  | `false` | Enable or disable reminder notifications                |
| `times`        | string[] | `[]`    | Array of times to check (24-hour format, e.g., "11:30") |
| `weekdaysOnly` | boolean  | `true`  | Only send reminders on weekdays (Monday-Friday)         |

**How it works:**

- While Jiracle is running, it checks every minute if the current time matches any configured reminder times (±1 minute tolerance)
- If you haven't logged any time today, it sends a desktop notification: "⏳ You haven't logged time today!"
- Each reminder time only triggers once per day to avoid spam
- Notifications reset daily, so you'll get reminded again tomorrow
- Works cross-platform on macOS, Windows, and Linux

**Example scenarios:**

- **Meeting reminders**: Set times like `["11:30", "16:30"]` to remind yourself before lunch and end of day
- **Hourly check-ins**: Use `["09:00", "12:00", "15:00", "17:00"]` for regular reminders throughout the day
- **Weekend work**: Set `weekdaysOnly: false` if you also work weekends and want reminders

### Getting a Jira API Token

1. Log in to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a descriptive name (e.g., "Jiracle CLI")
4. Copy the token and add it to your config

## Usage

### Basic Commands

```bash
# Launch the interactive UI
jiracle

# Show help
jiracle --help

# Show version
jiracle --version
```

### Keyboard Shortcuts

#### Weekly Timetable View

- `↑↓←→` - Navigate between cells
- `Enter` - Edit selected cell
- `i` - Add new issue
- `r` - Refresh data
- `q` - Quit
- `?` - Show help

#### Worklog Form

- `Tab` / `Shift+Tab` - Navigate between fields
- `Enter` - Submit current step
- `Esc` - Cancel

### Time Entry Format

Enter time in various formats:

- `2h` - 2 hours
- `30m` - 30 minutes
- `1h 30m` - 1 hour 30 minutes
- `1.5` - 1.5 hours
- `90` - 90 minutes

## Development

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/jiracle.git
cd jiracle

# Install dependencies
npm install

# Build the project
npm run build

# Run locally
node dist/cli.js
```

### Commands

```bash
# Development build with watch mode
npm run dev

# Run tests
npm test

# Run specific tests
npx ava dist/**/*.test.js -m "*pattern*"

# Check code formatting
npm run test:prettier

# Run linter
npm run test:xo
```

### Project Structure

```
jiracle/
├── source/             # TypeScript source code
│   ├── app.tsx         # Main application component
│   ├── cli.tsx         # CLI entry point
│   ├── components/     # UI components
│   ├── hooks/          # React hooks
│   ├── use-cases/      # Business logic
│   └── tests/          # Test files
├── dist/               # Compiled JavaScript
└── package.json        # Project configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Troubleshooting

### "Unauthorized" error

- Check that your API token is correct in `~/.config/jiracle.json`
- Ensure your Jira URL includes the full domain (e.g., `https://company.atlassian.net`)

### Issues not loading

- Verify you have access to the projects in Jira
- Check your internet connection
- Try refreshing with the `r` key

### Performance issues

- The app caches data for 5 minutes by default
- Large numbers of worklogs may slow down initial loading

## Debug Logging

Jiracle includes debug logging for troubleshooting UI interactions and worklog operations. By default, debug logs are disabled to keep the interface clean.

### Enable Debug Logging

Set the `JIRACLE_LOG_LEVEL` environment variable to `debug`:

```bash
# Enable debug logging for current session
export JIRACLE_LOG_LEVEL=debug
jiracle

# Or run with debug logging for single execution
JIRACLE_LOG_LEVEL=debug jiracle
```

### Debug Log Output

Debug logs are written to:

- **File**: `~/.config/jiracle-ui.log` (always)
- **Console**: Only when not in test environment

Debug logs include:

- Form submission events and duplicate submission prevention
- Worklog creation and deletion operations
- UI interaction details and timestamps

### Log Levels

| Level   | Description                    |
| ------- | ------------------------------ |
| `error` | Only errors                    |
| `warn`  | Warnings and errors            |
| `info`  | General information (default)  |
| `debug` | Detailed debugging information |

Example debug output:

```
2025-07-13T19:00:00.000Z [debug]: InlineWorklogForm: handleSubmit called
2025-07-13T19:00:01.000Z [debug]: WeeklyTimetableView: Worklog submitted successfully
2025-07-13T19:00:02.000Z [debug]: Found 2 worklogs to delete for JTS-2457 on 2025-07-16
```

## License

MIT © [Your Name]

## Acknowledgments

- Built with [Ink](https://github.com/vadimdemedes/ink) - React for CLIs
- Inspired by the need for better time tracking in terminal workflows
