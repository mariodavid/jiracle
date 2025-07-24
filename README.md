# Jiracle

Terminal-based Jira time tracking with a keyboard-driven weekly timetable interface.

![Node Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Weekly grid view** of Jira issues × days
- **Keyboard navigation** with arrow keys and shortcuts
- **Quick time entry** directly in grid cells
- **Attendance tracking** with check-in/check-out
- **Smart defaults** and comment auto-fill
- **Offline-capable** with Jira sync

```
                Monday    Tuesday   Wednesday Thursday  Friday
Attendance      08:30-17:00  08:45-17:30  09:00-17:15  -      -
PROJ-123        2h        -         4h        -         -
PROJ-456        -         6h        2h        -         -
```

## Installation

```bash
npm install -g jiracle
# or
npx jiracle
```

## Configuration

Create `~/.config/jiracle.json`:

```json
{
	"jiraUrl": "https://your-company.atlassian.net",
	"username": "your-email@company.com",
	"apiToken": "your-jira-api-token",
	"defaultTime": "4h",
	"defaultComment": "Development work",
	"favorites": [{"key": "PROJ-123", "alias": "Main Feature"}],
	"slidingWindowDays": {
		"past": 7,
		"future": 0
	}
}
```

### Configuration Options

#### Sliding Window

The `slidingWindowDays` option controls which recently worked issues appear in new weeks:

- `past`: Number of days to look back for recent issues (default: 7)
- `future`: Number of days to look ahead (default: 0)

Example: Issues worked on in the last 7 days will automatically appear in new weeks, even if no time has been logged yet that week.

Get API token: [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)

## Usage

### Basic Commands

```bash
# Launch the interactive UI
jiracle

# Attendance tracking
jiracle checkin          # Check in for work
jiracle checkout         # Check out from work
jiracle status           # Show today's status

# Help and version
jiracle --help
jiracle --version
```

### Keyboard Shortcuts

- `↑↓←→` - Navigate between cells
- `Enter` - Edit selected cell
- `Shift+←→` - Navigate between weeks
- `D` - Delete worklog
- `I` / `O` - Check in / Check out
- `T` - Go to current week
- `R` - Refresh data
- `Q` - Quit

### Time Entry

Enter time in formats like: `2h`, `30m`, `1h 30m`, `1.5`, `90`

## Development

### Setup

```bash
git clone https://github.com/yourusername/jiracle.git
cd jiracle
npm install
npm run build
node dist/cli.js
```

### Commands

```bash
npm run dev      # Watch mode
npm test         # Run tests
npm run build    # Compile TypeScript
npm start        # Build and run
```

## License

MIT
