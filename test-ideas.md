# Test Ideas for Attendance Tracking (Issue #15)

This document outlines comprehensive test scenarios for the Attendance Tracking feature based on GitHub Issue #15.

## Phase 1: Core Functions Testing

### CLI Commands Testing

#### `jiracle checkin` Command

- **Basic Functionality**

  - [ ] Check-in with default time (08:00 from config)
  - [ ] Check-in with custom time (`--time 07:45`)
  - [ ] Retroactive check-in (`--date 2025-07-13 --time 08:30`)
  - [ ] Check-in for today without date parameter
  - [ ] Multiple check-ins on same day (should update existing)

- **Validation & Error Handling**

  - [ ] Invalid time format rejection (`25:00`, `08:3`, `8:30`)
  - [ ] Invalid date format rejection (`2025-7-11`, `25-07-11`)
  - [ ] Future date rejection
  - [ ] Missing attendance config shows appropriate error
  - [ ] Disabled attendance feature shows error

- **Edge Cases**
  - [ ] Check-in at midnight (`00:00`)
  - [ ] Check-in at 23:59
  - [ ] Weekend check-ins
  - [ ] Holiday check-ins

#### `jiracle checkout` Command

- **Basic Functionality**

  - [ ] Check-out with default time (17:00 from config)
  - [ ] Check-out with custom time (`--time 16:45`)
  - [ ] Retroactive check-out (`--date 2025-07-13 --time 17:30`)
  - [ ] Check-out without prior check-in (should error)
  - [ ] Check-out before check-in time (should error)

- **Calculation Verification**

  - [ ] Total hours calculation with default break (30min)
  - [ ] Total hours calculation with custom break
  - [ ] Overtime calculation (>8 hours)
  - [ ] Undertime calculation (<8 hours)
  - [ ] Fractional hour handling (8h 15m = 8.25h)

- **Time Display Formats**
  - [ ] Message includes check-out time
  - [ ] Message includes total hours worked
  - [ ] Message includes time span (8:00-17:00)

#### `jiracle status` Command

- **Current Day Status**
  - [ ] No attendance recorded shows appropriate message
  - [ ] Only check-in shows "Checked in at XX:XX"
  - [ ] Full day shows complete summary with totals
  - [ ] Status for specific date (`--date 2025-07-13`)

#### Attendance Deletion (UI)

- **Delete Confirmation Dialog**

  - [ ] Delete confirmation appears when 'D' pressed on attendance cell
  - [ ] Confirmation dialog shows correct date
  - [ ] Y/Enter confirms deletion
  - [ ] N/Escape cancels deletion
  - [ ] Deletion removes record from CSV
  - [ ] UI updates immediately after deletion
  - [ ] No confirmation shown for empty attendance days

- **Error Handling**

  - [ ] Cannot delete non-existent attendance records
  - [ ] Error message for failed deletion (file locked, permissions)
  - [ ] Graceful handling of corrupted CSV during deletion

- **Status Indicators**

  - [ ] ✅ for complete day meeting target hours
  - [ ] ⚠️ for incomplete or under-hours day
  - [ ] Target time comparison (8h vs actual)

- **Jira Integration Display**
  - [ ] Show Jira logged time for the day
  - [ ] Show difference between attendance and Jira time
  - [ ] "Not tracked" time calculation

### Configuration Testing

#### Config File Validation

- [ ] Default values applied when config missing
- [ ] Custom default times honored (`defaultCheckIn`, `defaultCheckOut`)
- [ ] Working hours target configurable
- [ ] Break minutes configurable
- [ ] Feature can be disabled (`enabled: false`)

#### Config Edge Cases

- [ ] Invalid working hours (negative, zero, >24)
- [ ] Invalid break minutes (negative, >workingHours)
- [ ] Invalid default times (malformed, out of range)
- [ ] Missing config file handling
- [ ] Malformed JSON handling

### Data Storage Testing

#### CSV Operations

- [ ] Create new CSV file when none exists
- [ ] Append new attendance records
- [ ] Update existing records for same date
- [ ] Delete existing records by date
- [ ] CSV format is Excel-compatible
- [ ] Headers are correct and properly formatted
- [ ] Special characters in notes field handled

#### Data Integrity

- [ ] Concurrent access handling (multiple processes)
- [ ] File permissions handling
- [ ] Large file handling (100+ days)
- [ ] Backup/recovery scenarios
- [ ] Data migration between formats

#### CSV Export Features

- [ ] Weekly export functionality
- [ ] Monthly export functionality
- [ ] HR-ready format includes all required fields
- [ ] Date range filtering works correctly
- [ ] Export handles empty periods gracefully

## Phase 2: UI Integration Testing

### Attendance Row in Weekly Timetable

#### Display Logic

- [ ] Attendance row appears when feature enabled
- [ ] Row hidden when feature disabled
- [ ] Row shows correct week dates (Monday-Friday)
- [ ] Weekend columns handled appropriately
- [ ] Current day highlighting works

#### Status Indicators

- [ ] ✅ for complete days (check-in + check-out)
- [ ] ⚠️ for partial days (only check-in)
- [ ] Empty cells for days with no attendance
- [ ] Overtime/undertime visual indicators
- [ ] Color coding consistency

#### Data Integration

- [ ] Real-time updates when attendance changes
- [ ] Refresh functionality updates attendance row
- [ ] Week navigation updates attendance data
- [ ] Today navigation highlights current attendance

### Attendance Table UI (accessed via 'a' key)

#### Table Structure

- [ ] Monday-Friday columns displayed
- [ ] Three rows: Start time, End time, Break
- [ ] Proper column headers and labels
- [ ] Responsive layout for different terminal sizes

#### Time Input Fields

- [ ] Start time field accepts HH:MM format
- [ ] End time field accepts HH:MM format
- [ ] Arrow key navigation (↑/↓) for time adjustment
- [ ] Tab navigation between fields
- [ ] Enter key saves current field

#### Break Input Field

- [ ] CustomNumberField for break minutes
- [ ] Default value from config (30 minutes)
- [ ] Min/max validation (0-480 minutes)
- [ ] Arrow key increment/decrement
- [ ] Direct number input

#### Keyboard Navigation

- [ ] Tab moves between days and fields
- [ ] Arrow keys navigate within table
- [ ] Enter saves and moves to next field
- [ ] Escape cancels and returns to weekly view
- [ ] 'a' key from weekly view opens table
- [ ] 'D' key from focused attendance cell opens delete confirmation

#### Data Persistence

- [ ] Changes auto-save to CSV
- [ ] Validation before saving
- [ ] Error handling for invalid data
- [ ] Undo functionality for accidental changes

### Integration with Weekly Timetable

#### Display Integration

- [ ] Attendance data appears alongside Jira data
- [ ] Clear visual separation between attendance and Jira
- [ ] Time difference calculations shown
- [ ] Summary totals include attendance vs Jira comparison

#### Workflow Integration

- [ ] Attendance table accessible from any weekly view
- [ ] Changes in attendance table reflect in main view
- [ ] Navigation preserves current week/date context
- [ ] Help text shows attendance-related shortcuts

## Phase 3: Reports Testing

### Weekly Overview

- [ ] Target time comparison for each day
- [ ] Weekly total calculation
- [ ] Overtime/undertime summary
- [ ] Missing days highlighted
- [ ] Export to CSV functionality

### Monthly Overview

- [ ] Month selection interface
- [ ] Monthly totals calculation
- [ ] Average daily hours
- [ ] Working days vs total days
- [ ] Monthly export functionality

### HR-Ready Export

- [ ] Professional formatting
- [ ] All required HR fields included
- [ ] Date range selection
- [ ] Multiple format options (CSV, PDF)
- [ ] Email integration (if implemented)

## Integration & System Testing

### Cross-Feature Integration

- [ ] Attendance tracking doesn't interfere with existing Jira features
- [ ] Performance impact on startup and navigation
- [ ] Memory usage with large attendance datasets
- [ ] Concurrent Jira and attendance operations

### User Experience Testing

- [ ] First-time user onboarding
- [ ] Feature discovery (how users find attendance features)
- [ ] Workflow efficiency for daily check-in/out
- [ ] Error recovery and user guidance

### Backward Compatibility

- [ ] Existing users unaffected when feature disabled
- [ ] Migration path for enabling attendance
- [ ] Config file upgrades handle gracefully
- [ ] No breaking changes to existing functionality

## Performance & Reliability Testing

### Performance Benchmarks

- [ ] CSV read/write performance with large datasets
- [ ] UI responsiveness with 365+ days of data
- [ ] Memory usage patterns
- [ ] Startup time impact

### Error Recovery

- [ ] Corrupted CSV file recovery
- [ ] Network interruption during operations
- [ ] Disk space exhaustion handling
- [ ] Permission denied scenarios

### Security Considerations

- [ ] CSV file permissions appropriate
- [ ] No sensitive data exposure
- [ ] Input sanitization for all fields
- [ ] Protection against CSV injection

## Acceptance Testing Scenarios

### End-to-End Workflows

#### Daily Usage Pattern

1. User starts work day: `jiracle checkin`
2. Works on Jira issues, logs time normally
3. Ends work day: `jiracle checkout`
4. Checks status: `jiracle status`
5. Views weekly summary in UI

#### Weekly Planning Pattern

1. User opens weekly timetable
2. Presses 'a' to view attendance table
3. Plans upcoming week attendance
4. Pre-fills expected times
5. Makes adjustments throughout week

#### Monthly Review Pattern

1. User generates monthly report
2. Exports HR-ready CSV
3. Compares Jira logged time vs attendance
4. Identifies discrepancies
5. Makes corrections for next month

#### Retroactive Correction Pattern

1. User realizes missing check-in from yesterday
2. Uses `--date` parameter to add retroactive entry
3. Verifies correction in status display
4. Updates attendance table if needed
5. Confirms weekly view shows correction

### Configuration Testing Scenarios

#### First-Time Setup

1. User enables attendance in config
2. Sets personal default times
3. Configures break preferences
4. Tests basic check-in/out flow
5. Verifies CSV file creation

#### Advanced Configuration

1. User customizes working hours target
2. Adjusts break calculation method
3. Modifies export format preferences
4. Tests edge cases with new settings
5. Validates all features work with custom config

## Test Data Requirements

### Sample Datasets

- [ ] Empty dataset (new user)
- [ ] Small dataset (1 week)
- [ ] Medium dataset (1 month)
- [ ] Large dataset (1 year)
- [ ] Edge case dataset (gaps, corrections, overtime)

### Configuration Variations

- [ ] Default configuration
- [ ] Minimal configuration
- [ ] Maximum configuration
- [ ] International time formats
- [ ] Different working hour patterns

## Test Automation Considerations

### Unit Tests

- All calculation functions
- CSV operations
- Configuration parsing
- Time validation functions

### Integration Tests

- CLI command flows
- UI component interactions
- File system operations
- Configuration loading

### End-to-End Tests

- Complete user workflows
- Cross-platform compatibility
- Performance benchmarks
- Error scenarios

---

_This test plan ensures comprehensive coverage of all attendance tracking features described in GitHub Issue #15, with focus on reliability, usability, and integration with existing Jiracle functionality._
