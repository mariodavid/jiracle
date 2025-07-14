![Jiracle Logo](assets/logo.png)

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

- **Weekly Timetable View** - See all your Jira issues in a week-at-a-glance grid with attendance tracking
- **Keyboard Navigation** - Navigate efficiently with arrow keys and shortcuts
- **Quick Time Entry** - Log time directly in the grid cells with inline forms
- **Attendance Tracking** - Built-in check-in/check-out with working hours calculation
- **Issue Organization** - Group issues and configure project-level defaults
- **Daily Reminders** - Automatic desktop notifications to remind you to log time
- **Smart Defaults** - Hierarchical configuration with group, project, and issue-specific defaults
- **Favorite Issues** - Quick access to frequently used issues with aliases
- **Recent Work Continuity** - Show recently worked issues across week boundaries
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
Attendance      08:30-17:00  08:45-17:30  09:00-17:15  -      -
PROJ-123        2h        -         4h        -         -
PROJ-456        -         6h        2h        -         -
PROJ-789        4h        -         -         8h        -
```

Navigate to any cell, press Enter to edit:

- **Worklog cells**: Enter time ("2h 30m"), add comment, submit to Jira
- **Attendance cells**: Set check-in/check-out times, calculate working hours
- Use `I`/`O` shortcuts for quick attendance tracking
- Use `Shift+←→` to navigate between weeks, `T` to jump to current week
- Visual feedback shows your progress and total hours

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
	"workingHoursPerWeek": 40,
	"groups": [
		{
			"id": "development",
			"name": "Development Work",
			"defaultComment": "Development and coding tasks",
			"defaultTime": "2h",
			"desiredAmount": 6
		}
	],
	"projects": [
		{
			"key": "PROJ",
			"groupId": "development"
		}
	],
	"favorites": [
		{
			"key": "PROJ-123",
			"alias": "Main Feature",
			"defaultComment": "Development work on main project",
			"groupId": "development"
		},
		{
			"key": "PROJ-456"
		}
	],
	"slidingWindowDays": {
		"past": 14,
		"future": 7
	}
}
```

### Configuration Options

| Option                | Required | Description                                                                  |
| --------------------- | -------- | ---------------------------------------------------------------------------- |
| `jiraUrl`             | Yes      | Your Jira instance URL (e.g., `https://company.atlassian.net`)               |
| `username`            | Yes      | Your Jira username/email                                                     |
| `apiToken`            | Yes      | Your Jira API token                                                          |
| `defaultComment`      | No       | Global default comment for all worklogs                                      |
| `defaultTime`         | No       | Global default time (e.g., "1h", "2h")                                       |
| `workingHoursPerWeek` | No       | Expected working hours per week for tracking purposes                        |
| `reminders`           | No       | Daily reminder settings for desktop notifications                            |
| `groups`              | No       | Issue groups with shared defaults and organization                           |
| `projects`            | No       | Project-level defaults and group assignments                                 |
| `favorites`           | No       | Array of favorite issues with optional aliases and defaults                  |
| `attendance`          | No       | Attendance tracking configuration                                            |
| `slidingWindowDays`   | No       | Show issues worked on around the current week (object with past/future days) |

### Attendance Configuration

| Option                | Type    | Default   | Description                                         |
| --------------------- | ------- | --------- | --------------------------------------------------- |
| `enabled`             | boolean | `false`   | Enable attendance tracking features                 |
| `workingHours`        | number  | `8`       | Expected working hours per day                      |
| `breakMinutes`        | number  | `30`      | Default break duration in minutes                   |
| `defaultCheckIn`      | string  | `"08:00"` | Default check-in time (not used with current time)  |
| `defaultCheckOut`     | string  | `"17:00"` | Default check-out time (not used with current time) |
| `defaultBreakMinutes` | number  | `30`      | Default break duration for new entries              |
| `csvPath`             | string  | Auto      | Custom path for attendance CSV file                 |

**Example attendance configuration:**

```json
{
	"attendance": {
		"enabled": true,
		"workingHours": 8,
		"breakMinutes": 30,
		"defaultCheckIn": "08:00",
		"defaultCheckOut": "17:00",
		"defaultBreakMinutes": 30,
		"csvPath": "/custom/path/attendance.csv"
	}
}
```

**Note**: By default, `jiracle checkin` and `jiracle checkout` use the current time, not the configured default times. The `defaultCheckIn` and `defaultCheckOut` values are only used by the UI components.

### Sliding Window

The `slidingWindowDays` feature improves the weekly timetable view by showing issues you've worked on around the current week, even if they don't have any worklogs in the current week. This sliding window moves with whatever week you're currently viewing, preventing your timetable from becoming sparse when navigating between weeks.

**How it works:**

- When viewing the weekly timetable, Jiracle includes:
  1. **Favorite issues** (always shown)
  2. **Issues with worklogs in the current week**
  3. **Issues worked on in the sliding window period** (if `slidingWindowDays` is configured)

**Configuration example:**

```json
{
	"slidingWindowDays": {
		"past": 14,
		"future": 7
	}
}
```

**Benefits:**

- **Improved continuity**: Recent and upcoming work remains visible when navigating between weeks
- **Better context**: See what you worked on recently and plan to work on relative to the week you're viewing
- **Flexible window size**: Configure how many days back and forward to include (7, 14, 30, etc.)
- **Smart deduplication**: Issues are only shown once, even if they qualify through multiple criteria
- **Week-relative**: The window slides with the week you're viewing, not fixed to today's date
- **Bidirectional support**: Look both backward (past work) and forward (planned work)

**Example scenario:**

When viewing the week of Oct 7-13 with `{past: 14, future: 7}`, you'll see:

- Issues worked on from Sep 23 to Oct 6 (past window)
- Issues with worklogs in Oct 7-13 (current week)
- Issues worked on from Oct 14-20 (future window)

**Performance notes:**

- Makes additional API calls for the sliding window period when configured
- Results are cached for efficient performance
- Set past/future to `0` to disable those directions
- Omit `slidingWindowDays` entirely to disable the feature

### Issue Groups and Organization

Jiracle supports organizing your work into groups with shared defaults and visual organization. This helps manage different types of work with appropriate time allocations and comments.

**Groups Configuration:**

```json
{
	"groups": [
		{
			"id": "development",
			"name": "Development Work",
			"defaultComment": "Development and coding tasks",
			"defaultTime": "2h",
			"desiredAmount": 6
		},
		{
			"id": "meetings",
			"name": "Meetings & Communication",
			"defaultComment": "Team meetings and stakeholder communication",
			"defaultTime": "1h",
			"desiredAmount": 2
		}
	]
}
```

**Project-Level Configuration:**

```json
{
	"projects": [
		{
			"key": "PROJ",
			"groupId": "development"
		},
		{
			"key": "MEET",
			"groupId": "meetings"
		}
	]
}
```

**Group Options:**

| Option           | Type   | Description                              |
| ---------------- | ------ | ---------------------------------------- |
| `id`             | string | Unique identifier for the group          |
| `name`           | string | Display name for the group               |
| `defaultComment` | string | Default comment for issues in this group |
| `defaultTime`    | string | Default time allocation (e.g., "2h")     |
| `desiredAmount`  | number | Target hours per day/week for this group |

**Configuration Priority:**

When determining defaults for an issue, Jiracle uses this hierarchy:

1. **Issue-specific** defaults (from favorites configuration)
2. **Group defaults** (if the issue/project belongs to a group)
3. **Global defaults** (from main configuration)
4. **Built-in fallbacks** (1h time, empty comment)

### Favorite Issues

Favorite issues can be configured in two ways:

**Simple format** (just the issue key):

```json
"favorites": ["PROJ-123", "PROJ-456"]
```

**Advanced format** (with aliases, defaults, and group assignment):

```json
"favorites": [
	{
		"key": "PROJ-123",
		"alias": "Main Feature Development",
		"defaultComment": "Development work on main project",
		"defaultTime": "3h",
		"groupId": "development"
	},
	{
		"key": "PROJ-456",
		"alias": "Bug Fixes",
		"defaultComment": "Bug fixes and maintenance",
		"defaultTime": "1h"
	}
]
```

**Favorite Issue Options:**

| Option           | Type   | Description                                 |
| ---------------- | ------ | ------------------------------------------- |
| `key`            | string | Jira issue key (required)                   |
| `alias`          | string | Display name for the issue in the timetable |
| `defaultComment` | string | Default comment for this specific issue     |
| `defaultTime`    | string | Default time allocation (e.g., "2h")        |
| `groupId`        | string | ID of the group this issue belongs to       |

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

### Environment Variables

You can override configuration values using environment variables. This is useful for CI/CD, different environments, or keeping sensitive data out of config files.

| Environment Variable          | Description                         | Config Equivalent    |
| ----------------------------- | ----------------------------------- | -------------------- |
| `JIRACLE_JIRA_URL`            | Your Jira instance URL              | `jiraUrl`            |
| `JIRACLE_USERNAME`            | Your Jira username/email            | `username`           |
| `JIRACLE_API_TOKEN`           | Your Jira API token                 | `apiToken`           |
| `JIRACLE_ATTENDANCE_CSV_PATH` | Custom path for attendance CSV file | `attendance.csvPath` |

**Example usage:**

```bash
# Set environment variables
export JIRACLE_JIRA_URL="https://company.atlassian.net"
export JIRACLE_USERNAME="your-email@company.com"
export JIRACLE_API_TOKEN="your-api-token"
export JIRACLE_ATTENDANCE_CSV_PATH="/custom/attendance.csv"

# Run jiracle (will use environment variables)
jiracle
```

**Priority order:** Environment variables take precedence over configuration file values.

### Getting a Jira API Token

1. Log in to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a descriptive name (e.g., "Jiracle CLI")
4. Copy the token and add it to your config or set the `JIRACLE_API_TOKEN` environment variable

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

### Attendance Tracking Commands

Jiracle includes built-in attendance tracking to monitor your working hours. These commands complement the main time tracking interface.

```bash
# Check in for work (uses current time)
jiracle checkin

# Check in at specific time
jiracle checkin --time 08:30

# Check in for specific date
jiracle checkin --date 2025-07-15 --time 09:00

# Check out from work (uses current time)
jiracle checkout

# Check out at specific time
jiracle checkout --time 17:30

# Check out for specific date
jiracle checkout --date 2025-07-15 --time 16:45

# Show attendance status for today
jiracle status

# Show attendance status for specific date
jiracle status --date 2025-07-15
```

#### Attendance Features

- **Current Time Default**: By default, `checkin` and `checkout` use the current time
- **Retroactive Entries**: Use `--date` and `--time` to log attendance for past dates
- **CSV Storage**: Attendance data is stored in Excel-compatible CSV format
- **Working Hours Calculation**: Automatically calculates total hours worked (minus break time)

#### Example Workflow

```bash
# Monday morning - quick check-in
jiracle checkin
# > ✅ Checked in at 08:45

# End of day
jiracle checkout
# > ✅ Checked out at 17:30 (08:45-17:30, 8.25h total)

# Check today's status
jiracle status
# > Today: 08:45-17:30 (8h 45m, Target: 8h) ✅
```

### Keyboard Shortcuts

#### Weekly Timetable View

- `↑↓←→` - Navigate between cells (issues and days)
- `Enter` - Edit selected cell (worklog or attendance entry)
- `Shift+←→` - Navigate between weeks (previous/next week)
- `Tab` / `Shift+Tab` - Navigate between focusable elements
- `D` - Delete worklogs/attendance for focused cell
- `I` - Check in (attendance tracking)
- `O` - Check out (attendance tracking)
- `Shift+O` - Open focused issue in browser (when supported)
- `T` - Go to current week
- `R` - Refresh data from Jira
- `Q` - Quit application
- `L` - Add new issue (when in worklog mode)

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

# Run XO linter
npm run test:xo

# Build and start application
npm start
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
