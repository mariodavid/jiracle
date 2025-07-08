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

## Installation (coming soon)

```bash
npm install -g jiracle
# or
pipx install jiracle
```
