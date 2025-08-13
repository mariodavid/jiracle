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
- **Bonus progress tracking** with financial projections
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

#### Bonus Tracking

Enable bonus progress tracking with financial projections and target milestones:

```json
{
	"bonus": {
		"enabled": true,
		"hoursPerBonusDay": 8,
		"targetDays": 190,
		"targetAmount": 10000,
		"currency": "EUR",
		"targets": {
			"minimum": {"days": 150, "label": "Minimum", "percentage": 79},
			"standard": {"days": 190, "label": "Standard", "percentage": 100},
			"stretch": {"days": 210, "label": "Stretch", "percentage": 128},
			"maximum": {"days": 230, "label": "Maximum", "percentage": 148}
		},
		"billableCustomField": "customfield_12345"
	}
}
```

**Configuration Options:**

- `enabled`: Enable/disable bonus tracking
- `hoursPerBonusDay`: Hours required per bonus day (default: 8)
- `targetDays`: Primary target for 100% bonus (default: 190)
- `targetAmount`: Total bonus amount in base currency
- `currency`: Currency for financial display (e.g., "EUR", "USD")
- `targets`: Four milestone levels with days, labels, and percentage values
- `billableCustomField`: Jira custom field ID for billable hours classification

**Features:**

- **Financial Projections**: Current, projected, and maximum possible bonus amounts
- **Multi-Target Tracking**: Progress against Minimum, Standard, Stretch, and Maximum goals
- **Tier Visualization**: Progress bars showing achievement status across all targets
- **Real-time Calculations**: Automatic year-end projections based on current pace

Access via: `jiracle` → Statistics → Tab 2 (Bonus Overview)

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

# CSV import
jiracle import timesheet.csv  # Import timesheet from CSV file

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

### CSV Import

Import bulk timesheet data from CSV files for efficient time tracking:

```bash
jiracle import timesheet.csv
```

#### CSV Format

The CSV file must contain exactly 16 columns with this header structure:

```csv
Date,Start,End,Break,Work Item 1,Hours 1,Issue 1,Work Item 2,Hours 2,Issue 2,Work Item 3,Hours 3,Issue 3,Work Item 4,Hours 4,Issue 4
2025-07-15,08:00,17:30,1:00,Backend Development,4.5,PROJ-1001,Code Review,2.0,PROJ-1002,Documentation,2.0,DOC-500,,,
2025-07-16,07:30,16:00,0:45,Frontend Work,3.5,FEAT-2001,Bug Fixes,2.5,BUG-1500,Sprint Planning,1.75,PROJ-1001,,,
```

#### Column Details

- **Date**: Date in YYYY-MM-DD format
- **Start/End**: Work start/end times in HH:MM format
- **Break**: Break duration in HH:MM or minutes (e.g., `1:00` or `60`)
- **Work Item 1-4**: Description of work performed
- **Hours 1-4**: Time spent in decimal format (e.g., `4.5` for 4h 30m)
- **Issue 1-4**: Jira issue key (e.g., `PROJ-1001`)

#### What the Import Does

1. **Creates attendance records** with check-in/out times and breaks
2. **Logs time to Jira issues** with descriptions as worklog comments
3. **Validates all data** and reports any errors clearly
4. **Skips existing entries** to prevent duplicates
5. **Shows summary** of imported records and hours

#### Example Output

```
✅ Import completed successfully!
- Processed 2 entries
- Created 2 new attendance records
- Created 6 worklog entries
- Total hours logged: 16.25
```

## Development

### Setup

```bash
git clone https://github.com/yourusername/jiracle.git
cd jiracle
npm install
npm run build
node dist/cli.js
```

### Development Environment

For safe development and testing without affecting your production Jira data:

```bash
# One-time setup
npm run dev:setup

# Edit .dev/config.json with your Jira credentials
# This creates an isolated config separate from your main ~/.config/jiracle.json

# Run in development mode
npm run dev:local
```

This creates a `.dev/` directory in your project with:
- `.dev/config.json` - Isolated configuration (copy your production config here)
- `.dev/attendance.csv` - Separate attendance tracking for development

**Benefits:**
- Complete isolation from production data
- Safe testing environment
- Easy switching between dev and production modes
- All development data stays local to the project

### Commands

```bash
npm run dev          # Watch mode (TypeScript compilation)
npm run dev:setup    # Initialize development environment
npm run dev:local    # Run in development mode with isolated data
npm test             # Run tests
npm run build        # Compile TypeScript
npm start            # Build and run (production mode)
```

## License

MIT
