#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import process from 'node:process';
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import winston from 'winston';
import App from './app.js';
import {
	JiraClient,
	type WorklogRequest,
	type JiraConfig,
	loadConfigWithEnvVars,
} from './jira-client.js';
import {
	executeCheckIn,
	executeCheckOut,
	executeStatus,
	type CheckInParameters,
	type CheckOutParameters,
	type StatusParameters,
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

export type WorklogAddParameters = {
	issue: string;
	date: string;
	time: string;
	comment: string;
};

export type WorklogAddResult = {
	success: boolean;
	message: string;
};

function validateWorklogParameters(parameters: WorklogAddParameters): void {
	const {issue, date, time, comment} = parameters;

	if (!issue || !date || !time || !comment) {
		throw new Error(
			'All flags are required: --issue, --date, --time, --comment',
		);
	}

	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		throw new Error('Date must be in YYYY-MM-DD format');
	}

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
}

function loadConfig(configPath?: string): JiraConfig {
	const configFilePath =
		configPath || join(homedir(), '.config', 'jiracle.json');
	const configData = readFileSync(configFilePath, 'utf8');
	const baseConfig = JSON.parse(configData) as JiraConfig;
	return loadConfigWithEnvVars(baseConfig);
}

function createSilentLogger(): winston.Logger {
	return winston.createLogger({
		level: 'error',
		format: winston.format.simple(),
		transports: [
			new winston.transports.Console({
				silent: true,
			}),
		],
	});
}

function handleWorklogError(error: unknown, issue: string): never {
	if (error instanceof Error) {
		const {message} = error;

		if (message.includes('404') && message.includes('Issue Does Not Exist')) {
			throw new Error(`Issue '${issue}' does not exist`);
		}

		if (message.includes('401') || message.includes('Unauthorized')) {
			throw new Error('Invalid Jira credentials or insufficient permissions');
		}

		if (message.includes('403') || message.includes('Forbidden')) {
			throw new Error(`Access denied to issue '${issue}'`);
		}

		if (message.includes('400') && message.includes('Bad Request')) {
			throw new Error(
				'Invalid request (check time format or other parameters)',
			);
		}

		if (message.includes('ENOTFOUND') || message.includes('fetch failed')) {
			throw new Error('Cannot connect to Jira server (check URL and network)');
		}

		if (message.includes('JSON')) {
			throw new Error('Invalid configuration file format');
		}

		throw new Error(message.split(' - ')[0]);
	}

	throw new TypeError('Unknown error occurred');
}

export async function executeWorklogAdd(
	parameters: WorklogAddParameters,
	configPath?: string,
): Promise<WorklogAddResult> {
	const {issue, date, time, comment} = parameters;

	validateWorklogParameters(parameters);

	try {
		const config = loadConfig(configPath);
		const client = new JiraClient(config, createSilentLogger());

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
	} catch (error: unknown) {
		handleWorklogError(error, issue);
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
	} catch (error: unknown) {
		console.error(
			`Error: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exit(1);
	}
}

async function handleCheckIn() {
	const {date, time} = cli.flags;

	const parameters: CheckInParameters = {};

	if (date && typeof date === 'string') {
		parameters.date = date;
	}

	if (time && typeof time === 'string') {
		parameters.time = time;
	}

	try {
		const result = await executeCheckIn(parameters);
		if (result.success) {
			console.log(result.message);
			process.exit(0);
		} else {
			console.error(`Error: ${result.message}`);
			process.exit(1);
		}
	} catch (error: unknown) {
		console.error(
			`Error: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exit(1);
	}
}

async function handleCheckOut() {
	const {date, time} = cli.flags;

	const parameters: CheckOutParameters = {};

	if (date && typeof date === 'string') {
		parameters.date = date;
	}

	if (time && typeof time === 'string') {
		parameters.time = time;
	}

	try {
		const result = await executeCheckOut(parameters);
		if (result.success) {
			console.log(result.message);
			process.exit(0);
		} else {
			console.error(`Error: ${result.message}`);
			process.exit(1);
		}
	} catch (error: unknown) {
		console.error(
			`Error: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exit(1);
	}
}

async function handleStatus() {
	const {date} = cli.flags;

	const parameters: StatusParameters = {};

	if (date && typeof date === 'string') {
		parameters.date = date;
	}

	try {
		const result = await executeStatus(parameters);
		if (result.success) {
			console.log(result.message);
			process.exit(0);
		} else {
			console.error(`Error: ${result.message}`);
			process.exit(1);
		}
	} catch (error: unknown) {
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
