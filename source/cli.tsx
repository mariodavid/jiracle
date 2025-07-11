#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import {JiraClient, WorklogRequest} from './jira-client.js';
import {readFileSync} from 'fs';
import {homedir} from 'os';
import {join} from 'path';
import winston from 'winston';

const cli = meow(
	`
	Usage
	  $ jiracle
	  $ jiracle workload add --issue <issue-key> --date <YYYY-MM-DD> --time <time> --comment <comment>

	Commands
	  workload add    Add a worklog entry to an issue

	Options for workload add
	  --issue      Issue key (e.g., JTS-2398)
	  --date       Work date in YYYY-MM-DD format
	  --time       Time spent (e.g., 5h, 30m, 2.5h)
	  --comment    Worklog comment

	Examples
	  $ jiracle
	  $ jiracle workload add --issue JTS-2398 --date 2025-08-01 --time 5h --comment "Did some work"
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

export interface WorklogAddParams {
	issue: string;
	date: string;
	time: string;
	comment: string;
}

export interface WorklogAddResult {
	success: boolean;
	message: string;
}

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
		isNaN(testDate.getTime()) ||
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
		const config = JSON.parse(configData);

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
			throw new Error('Unknown error occurred');
		}
	}
}

async function handleWorkloadAdd() {
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

if (cli.input.length > 0) {
	const [command, subcommand] = cli.input;

	if (command === 'workload' && subcommand === 'add') {
		await handleWorkloadAdd();
	} else {
		console.error(`Unknown command: ${cli.input.join(' ')}`);
		process.exit(1);
	}
} else {
	render(<App />);
}
