import {join} from 'path';
import {tmpdir} from 'os';
import {writeFileSync, unlinkSync, existsSync} from 'fs';
import type {JiraConfig} from '../../jira-client.js';
import type {Attendance} from '../../attendance/types.js';

// Test data factories
export const TestData = {
	createAttendance(overrides: Partial<Attendance> = {}): Attendance {
		return {
			date: '2025-07-11',
			checkIn: '08:00',
			checkOut: '17:00',
			breakMinutes: 30,
			...overrides,
		};
	},

	createFullDayAttendance(date = '2025-07-11'): Attendance {
		return this.createAttendance({
			date,
			totalHours: 8.5,
		});
	},

	createPartialAttendance(date = '2025-07-11'): Attendance {
		return {
			date,
			checkIn: '08:00',
			breakMinutes: 30,
		};
	},

	createInvalidAttendance(): Attendance {
		return {
			date: 'invalid-date',
			checkIn: '25:00',
			checkOut: '30:00',
			breakMinutes: -10,
		};
	},
};

// Config factories
export const ConfigFactory = {
	createValidConfig(overrides: Partial<JiraConfig> = {}): JiraConfig {
		return {
			jiraUrl: 'https://test.atlassian.net',
			username: 'test@example.com',
			apiToken: 'test-token',
			attendance: {
				enabled: true,
				workingHours: 8,
				breakMinutes: 30,
				defaultCheckIn: '08:00',
				defaultCheckOut: '17:00',
				defaultBreakMinutes: 30,
			},
			...overrides,
		};
	},

	createDisabledConfig(): JiraConfig {
		return {
			jiraUrl: 'https://test.atlassian.net',
			username: 'test@example.com',
			apiToken: 'test-token',
			// No attendance config = disabled
		};
	},

	createInvalidAttendanceConfig(attendanceConfig: any): JiraConfig {
		return {
			jiraUrl: 'https://test.atlassian.net',
			username: 'test@example.com',
			apiToken: 'test-token',
			attendance: attendanceConfig,
		};
	},
};

// File system helpers
export class TempFileManager {
	private files: string[] = [];

	createTempConfigPath(): string {
		const path = join(
			tmpdir(),
			`jiracle-test-${Date.now()}-${Math.random()
				.toString(36)
				.substring(7)}.json`,
		);
		this.files.push(path);
		return path;
	}

	createTempCSVPath(): string {
		const path = join(
			tmpdir(),
			`attendance-test-${Date.now()}-${Math.random()
				.toString(36)
				.substring(7)}.csv`,
		);
		this.files.push(path);
		return path;
	}

	writeConfig(config: JiraConfig): string {
		const path = this.createTempConfigPath();
		writeFileSync(path, JSON.stringify(config, null, 2));
		return path;
	}

	writeCSV(content: string): string {
		const path = this.createTempCSVPath();
		writeFileSync(path, content);
		return path;
	}

	cleanupAll() {
		for (const file of this.files) {
			if (existsSync(file)) {
				unlinkSync(file);
			}
		}
		this.files = [];
	}
}

// Time helpers
export const TimeHelpers = {
	getCurrentTimeString(): string {
		const now = new Date();
		return `${now.getHours().toString().padStart(2, '0')}:${now
			.getMinutes()
			.toString()
			.padStart(2, '0')}`;
	},

	getTomorrowDateString(): string {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return tomorrow.toISOString().split('T')[0]!;
	},

	getYesterdayDateString(): string {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		return yesterday.toISOString().split('T')[0]!;
	},

	isTimeWithinRange(
		timeStr: string,
		beforeTime: Date,
		afterTime: Date,
	): boolean {
		const testTime = new Date(`2025-07-11T${timeStr}:00`);
		const beforeTimeStr = `2025-07-11T${beforeTime
			.toTimeString()
			.substring(0, 5)}:00`;
		const afterTimeStr = `2025-07-11T${afterTime
			.toTimeString()
			.substring(0, 5)}:00`;

		return (
			testTime >= new Date(new Date(beforeTimeStr).getTime() - 60000) &&
			testTime <= new Date(new Date(afterTimeStr).getTime() + 60000)
		);
	},
};

// Assertion helpers
export const AssertionHelpers = {
	assertSuccess(result: {success: boolean; message: string}, t: any) {
		t.true(result.success, `Expected success but got: ${result.message}`);
	},

	assertFailure(
		result: {success: boolean; message: string},
		t: any,
		expectedMessage?: string,
	) {
		t.false(
			result.success,
			`Expected failure but got success: ${result.message}`,
		);
		if (expectedMessage) {
			t.true(
				result.message.includes(expectedMessage),
				`Expected message to contain "${expectedMessage}" but got: ${result.message}`,
			);
		}
	},

	assertTimeFormat(
		result: {success: boolean; message: string},
		expectedTime: string,
		t: any,
	) {
		this.assertSuccess(result, t);
		t.true(
			result.message.includes(expectedTime),
			`Expected message to contain time "${expectedTime}" but got: ${result.message}`,
		);
	},

	assertErrorContains(
		result: {success: boolean; message: string},
		expectedErrors: string[],
		t: any,
	) {
		this.assertFailure(result, t);
		const hasExpectedError = expectedErrors.some(error =>
			result.message.includes(error),
		);
		t.true(
			hasExpectedError,
			`Expected message to contain one of [${expectedErrors.join(
				', ',
			)}] but got: ${result.message}`,
		);
	},

	assertMessageContains(message: string, expectedTexts: string[], t: any) {
		for (const text of expectedTexts) {
			t.true(
				message.includes(text),
				`Expected message to contain "${text}" but got: ${message}`,
			);
		}
	},

	assertAttendanceStatus(
		result: {success: boolean; message: string},
		expectedDate: string,
		t: any,
		expectedHours?: string,
	) {
		this.assertSuccess(result, t);
		t.true(result.message.includes(expectedDate));
		if (expectedHours) {
			t.true(result.message.includes(expectedHours));
		}
	},
};

// CSV Content generators
export const CSVHelpers = {
	createValidCSV(): string {
		return 'date,checkIn,checkOut,breakMinutes,totalHours\n2025-07-11,08:00,17:00,30,8.5\n';
	},

	createInvalidHeaderCSV(): string {
		return 'invalid,headers,here\n2025-07-11,08:00,17:00,30\n';
	},

	createMissingColumnsCSV(): string {
		return 'date,checkIn,checkOut,breakMinutes,totalHours\n2025-07-11,08:00\n';
	},

	createExtraColumnsCSV(): string {
		return 'date,checkIn,checkOut,breakMinutes,totalHours,extra1,extra2\n2025-07-11,08:00,17:00,30,8.5,extra,data\n';
	},

	createSpecialCharactersCSV(): string {
		return 'date,checkIn,checkOut,breakMinutes,totalHours\n2025-07-11,08:00,17:00,30,8.5\n2025-07-12,"08:00","17:00",30,8.5\n';
	},

	createInjectionAttemptCSV(): string {
		return 'date,checkIn,checkOut,breakMinutes,totalHours\n2025-07-11,=1+1+cmd|/C calc|!A0,17:00,30,8.5\n';
	},

	createInvalidDatesCSV(): string {
		return 'date,checkIn,checkOut,breakMinutes,totalHours\ninvalid-date,08:00,17:00,30,8.5\n2025-13-45,08:00,17:00,30,8.5\n2025-07-11,08:00,17:00,30,8.5\n';
	},
};

// Test patterns
export const TestPatterns = {
	async withTempFiles<T>(
		fn: (manager: TempFileManager) => Promise<T>,
	): Promise<T> {
		const manager = new TempFileManager();
		try {
			return await fn(manager);
		} finally {
			manager.cleanupAll();
		}
	},

	async testTimeValidation(
		executeFn: (
			params: any,
			configPath: string,
			csvPath?: string,
		) => Promise<{success: boolean; message: string}>,
		invalidTimes: string[],
		t: any,
	) {
		await this.withTempFiles(async manager => {
			const configPath = manager.writeConfig(ConfigFactory.createValidConfig());
			const csvPath = manager.createTempCSVPath();

			for (const invalidTime of invalidTimes) {
				const result = await executeFn(
					{date: '2025-07-11', time: invalidTime},
					configPath,
					csvPath,
				);
				AssertionHelpers.assertFailure(
					result,
					t,
					'Time must be in HH:MM format',
				);
			}
		});
	},

	async testDateValidation(
		executeFn: (
			params: any,
			configPath: string,
			csvPath?: string,
		) => Promise<{success: boolean; message: string}>,
		invalidDates: string[],
		t: any,
	) {
		await this.withTempFiles(async manager => {
			const configPath = manager.writeConfig(ConfigFactory.createValidConfig());
			const csvPath = manager.createTempCSVPath();

			for (const invalidDate of invalidDates) {
				const result = await executeFn(
					{date: invalidDate},
					configPath,
					csvPath,
				);
				AssertionHelpers.assertFailure(
					result,
					t,
					'Date must be in YYYY-MM-DD format',
				);
			}
		});
	},
};
