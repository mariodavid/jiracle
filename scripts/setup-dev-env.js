#!/usr/bin/env node

import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {existsSync} from 'node:fs';
import process from 'node:process';

const DEV_DIR = '.dev';
const CONFIG_FILE = join(DEV_DIR, 'config.json');
const ATTENDANCE_FILE = join(DEV_DIR, 'attendance.csv');

const CONFIG_TEMPLATE = {
	jiraUrl: 'https://your-jira-instance.com',
	username: 'your-email@company.com',
	apiToken: 'your-api-token-here',
	defaultTime: '8h',
	defaultComment: 'Development work',
	favorites: [],
	projects: [],
	groups: [],
};

const ATTENDANCE_HEADER =
	'Date,Type,CheckIn,CheckOut,BreakMinutes,TotalHours,Notes\n';

async function setupDevEnvironment() {
	try {
		console.log('🚀 Setting up Jiracle development environment...\n');

		// Create .dev directory
		if (existsSync(DEV_DIR)) {
			console.log(`📁 ${DEV_DIR}/ directory already exists`);
		} else {
			await mkdir(DEV_DIR, {recursive: true});
			console.log(`✅ Created ${DEV_DIR}/ directory`);
		}

		// Create config.json template
		if (existsSync(CONFIG_FILE)) {
			console.log(`📄 ${CONFIG_FILE} already exists - skipping`);
		} else {
			await writeFile(
				CONFIG_FILE,
				JSON.stringify(CONFIG_TEMPLATE, null, 2) + '\n',
			);
			console.log(`✅ Created ${CONFIG_FILE} template`);
		}

		// Create empty attendance.csv
		if (existsSync(ATTENDANCE_FILE)) {
			console.log(`📄 ${ATTENDANCE_FILE} already exists - skipping`);
		} else {
			await writeFile(ATTENDANCE_FILE, ATTENDANCE_HEADER);
			console.log(`✅ Created ${ATTENDANCE_FILE}`);
		}

		console.log('\n🎉 Development environment setup complete!\n');
		console.log('Next steps:');
		console.log(`1. Edit ${CONFIG_FILE} with your Jira credentials`);
		console.log('2. Run "npm run dev:local" to start in development mode\n');

		console.log('Example config.json values:');
		console.log('- jiraUrl: "https://your-company.atlassian.net"');
		console.log('- username: Your Jira email address');
		console.log(
			'- apiToken: Create one at https://id.atlassian.com/manage/api-tokens\n',
		);
	} catch (error) {
		console.error('❌ Failed to setup development environment:', error);
		process.exit(1);
	}
}

await setupDevEnvironment();
