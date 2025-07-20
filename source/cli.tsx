#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import {
	JiraClient,
	WorklogRequest,
	loadConfigWithEnvVars,
} from './jira-client.js';
import {readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import winston from 'winston';
import {
	executeCheckIn,
	executeCheckOut,
	executeStatus,
	type CheckInParams,
	type CheckOutParams,
	type StatusParams,
} from './cli/attendance-commands.js';

const cli = meow(
	`
	Usage
	  $ jiracle
	  $ jiracle worklog add --issue <issue-key> --date <YYYY-MM-DD> --time <time> --comment <comment>
	  $ jiracle checkin [--date <YYYY-MM-DD>] [--time <HH:MM>]
	  $ jiracle checkout [--date <YYYY-MM-DD>] [--time <HH:MM>]
	  $ jiracle status [--date <YYYY-MM-DD>]

	Commands
	  worklog add    Add a worklog entry to an issue
	  checkin        Check in for attendance tracking
	  checkout       Check out for attendance tracking  
	  status         Show attendance status

	Options for worklog add
	  --issue      Issue key (e.g., DEF-2398)
	  --date       Work date in YYYY-MM-DD format
	  --time       Time spent (e.g., 5h, 30m, 2.5h)
	  --comment    Worklog comment

	Options for attendance commands
	  --date       Date in YYYY-MM-DD format (defaults to today)
	  --time       Time in HH:MM format (uses config defaults if not provided)

	Examples
	  $ jiracle
	  $ jiracle worklog add --issue DEF-2398 --date 2025-08-01 --time 5h --comment "Did some work"
	  $ jiracle checkin
	  $ jiracle checkin --time 08:30
	  $ jiracle checkout
	  $ jiracle checkout --date 2025-07-11 --time 17:30
	  $ jiracle status
	  $ jiracle status --date 2025-07-11
`,
	{
		importMeta: import.meta,
		flags: {
			issue: {
				type: 'string',
				alias: 'i',
			},
			date: {
				type: 'string',
				alias: 'd',
			},
			time: {
				type: 'string',
				alias: 't',
			},
			comment: {
				type: 'string',
				alias: 'c',
			},
		},
	},
);

export type WorklogAddParams = {
	issue: string;
	date: string;
	time: string;
	comment: string;
};

export type WorklogAddResult = {
	success: boolean;
	message: string;
};

export async function executeWorklogAdd(
	params: WorklogAddParams,
	configPath?: string,
): Promise<WorklogAddResult> {
	const {issue, date, time, comment} = params;

	// Parameter validation
	if (!issue || !date || !time || !comment) {
		throw new Error(
			'All flags are required: --issue, --date, --time, --comment',
		);
	}

	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		throw new Error('Date must be in YYYY-MM-DD format');
	}

	// Additional date validation - check if it's a valid date
	const testDate = new Date(date);
	if (
		Number.isNaN(testDate.getTime()) ||
		testDate.toISOString().split('T')[0] !== date
	) {
		throw new Error('Date must be in YYYY-MM-DD format');
	}

	if (!/^(\d+(\.\d+)?[hm]|\d{1,2}:[0-5]\d)$/.test(time)) {
		throw new Error(
			'Time must be in format like "5h", "30m", "2.5h", or "1:30"',
		);
	}

	try {
		const configFilePath =
			configPath || join(homedir(), '.config', 'jiracle.json');
		const configData = readFileSync(configFilePath, 'utf8');
		const baseConfig = JSON.parse(configData);
		const config = loadConfigWithEnvVars(baseConfig);

		// Create a silent logger for CLI usage to avoid debug output
		const silentLogger = winston.createLogger({
			level: 'error',
			format: winston.format.simple(),
			transports: [
				new winston.transports.Console({
					silent: true,
				}),
			],
		});

		const client = new JiraClient(config, silentLogger);

		const workDate = new Date(date);
		workDate.setHours(9, 0, 0, 0);
		const formattedStarted = workDate.toISOString().replace('Z', '+0000');

		const worklogData: WorklogRequest = {
			timeSpent: time,
			comment,
			started: formattedStarted,
		};

		await client.addWorklog(issue, worklogData);
		return {
			success: true,
			message: `✅ Successfully logged ${time} to ${issue} on ${date}`,
		};
	} catch (error) {
		// Clean error messages for CLI usage
		if (error instanceof Error) {
			const message = error.message;

			// Handle specific Jira API errors
			if (message.includes('404') && message.includes('Issue Does Not Exist')) {
				throw new Error(`Issue '${issue}' does not exist`);
			} else if (message.includes('401') || message.includes('Unauthorized')) {
				throw new Error('Invalid Jira credentials or insufficient permissions');
			} else if (message.includes('403') || message.includes('Forbidden')) {
				throw new Error(`Access denied to issue '${issue}'`);
			} else if (message.includes('400') && message.includes('Bad Request')) {
				throw new Error(
					'Invalid request (check time format or other parameters)',
				);
			} else if (
				message.includes('ENOTFOUND') ||
				message.includes('fetch failed')
			) {
				throw new Error(
					'Cannot connect to Jira server (check URL and network)',
				);
			} else if (message.includes('JSON')) {
				throw new Error('Invalid configuration file format');
			} else {
				// Generic error message without debug info
				throw new Error(message.split(' - ')[0]);
			}
		} else {
			throw new TypeError('Unknown error occurred');
		}
	}
}

async function handleWorklogAdd() {
	const {issue, date, time, comment} = cli.flags;

	// Type guards to ensure all flags are strings
	if (
		typeof issue !== 'string' ||
		typeof date !== 'string' ||
		typeof time !== 'string' ||
		typeof comment !== 'string'
	) {
		console.error(
			'Error: All flags are required: --issue, --date, --time, --comment',
		);
		process.exit(1);
	}

	try {
		const result = await executeWorklogAdd({issue, date, time, comment});
		console.log(result.message);
		process.exit(0);
	} catch (error) {
		console.error(
			`Error: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exit(1);
	}
}

async function handleCheckIn() {
	const {date, time} = cli.flags;

	const params: CheckInParams = {};

	if (date && typeof date === 'string') {
		params.date = date;
	}

	if (time && typeof time === 'string') {
		params.time = time;
	}

	try {
		const result = await executeCheckIn(params);
		if (result.success) {
			console.log(result.message);
			process.exit(0);
		} else {
			console.error(`Error: ${result.message}`);
			process.exit(1);
		}
	} catch (error) {
		console.error(
			`Error: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exit(1);
	}
}

async function handleCheckOut() {
	const {date, time} = cli.flags;

	const params: CheckOutParams = {};

	if (date && typeof date === 'string') {
		params.date = date;
	}

	if (time && typeof time === 'string') {
		params.time = time;
	}

	try {
		const result = await executeCheckOut(params);
		if (result.success) {
			console.log(result.message);
			process.exit(0);
		} else {
			console.error(`Error: ${result.message}`);
			process.exit(1);
		}
	} catch (error) {
		console.error(
			`Error: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exit(1);
	}
}

async function handleStatus() {
	const {date} = cli.flags;

	const params: StatusParams = {};

	if (date && typeof date === 'string') {
		params.date = date;
	}

	try {
		const result = await executeStatus(params);
		if (result.success) {
			console.log(result.message);
			process.exit(0);
		} else {
			console.error(`Error: ${result.message}`);
			process.exit(1);
		}
	} catch (error) {
		console.error(
			`Error: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exit(1);
	}
}

if (cli.input.length > 0) {
	const [command, subcommand] = cli.input;

	if (command === 'worklog' && subcommand === 'add') {
		await handleWorklogAdd();
	} else {
		switch (command) {
			case 'checkin': {
				await handleCheckIn();
				break;
			}
			case 'checkout': {
				await handleCheckOut();
				break;
			}
			case 'status': {
				await handleStatus();
				break;
			}
			default: {
				console.error(`Unknown command: ${cli.input.join(' ')}`);
				process.exit(1);
			}
		}
	}
} else {
	render(<App />);
}
