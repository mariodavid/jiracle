import {Buffer} from 'node:buffer';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import notifier from 'node-notifier';
import {type JiraClient, type ReminderConfig} from '../jira-client.js';

type ReminderState = {
	notifiedTimes: Set<string>;
	lastCheckDate: string;
};

export class ReminderService {
	private interval: NodeJS.Timeout | undefined = undefined;
	private state: ReminderState;
	private readonly checkIntervalMs = 60 * 1000; // Check every 60 seconds

	constructor(
		private readonly jiraClient: JiraClient,
		private readonly config: ReminderConfig,
	) {
		this.state = {
			notifiedTimes: new Set(),
			lastCheckDate: new Date().toISOString().split('T')[0]!,
		};
	}

	start(): void {
		if (this.interval) {
			return; // Already running
		}

		if (!this.config.enabled) {
			return; // Reminders disabled
		}

		this.interval = setInterval(() => {
			this.checkReminders().catch(error => {
				console.error('Error in reminder check:', error);
			});
		}, this.checkIntervalMs);
	}

	stop(): void {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = undefined;
		}
	}

	private async checkReminders(): Promise<void> {
		const now = new Date();
		const currentDate = now.toISOString().split('T')[0]!;
		const currentTime = this.formatTime(now);

		// Reset notification state if date changed
		if (this.state.lastCheckDate !== currentDate) {
			this.state.notifiedTimes.clear();
			this.state.lastCheckDate = currentDate;
		}

		// Check if today is a weekday (only if weekdaysOnly is enabled)
		if (this.config.weekdaysOnly && !this.isWeekday(now)) {
			return;
		}

		// Check each configured reminder time
		// Sequential processing required to avoid duplicate reminders
		for (const reminderTime of this.config.times) {
			if (
				this.isTimeMatch(currentTime, reminderTime) &&
				!this.state.notifiedTimes.has(reminderTime)
			) {
				// Check if user has logged work today
				try {
					const hasWorkedToday = await this.jiraClient.hasWorklogForToday(); // eslint-disable-line no-await-in-loop

					if (!hasWorkedToday) {
						await this.sendReminder(); // eslint-disable-line no-await-in-loop
						this.state.notifiedTimes.add(reminderTime);
					}
				} catch (error: unknown) {
					console.error('Failed to check worklog status:', error);
				}
			}
		}
	}

	private formatTime(date: Date): string {
		return date.toTimeString().slice(0, 5); // "HH:MM"
	}

	private isWeekday(date: Date): boolean {
		const day = date.getDay();
		return day >= 1 && day <= 5; // Monday = 1, Friday = 5
	}

	private isTimeMatch(currentTime: string, reminderTime: string): boolean {
		// Allow 1-minute tolerance
		const current = this.timeToMinutes(currentTime);
		const reminder = this.timeToMinutes(reminderTime);

		return Math.abs(current - reminder) <= 1;
	}

	private timeToMinutes(timeString: string): number {
		const parts = timeString.split(':');
		const hours = Number(parts[0] ?? '0');
		const minutes = Number(parts[1] ?? '0');
		return (
			(Number.isNaN(hours) ? 0 : hours) * 60 +
			(Number.isNaN(minutes) ? 0 : minutes)
		);
	}

	private async sendReminder(): Promise<void> {
		try {
			const {platform} = process;

			if (platform === 'darwin') {
				// MacOS - use terminal-notifier with better styling
				notifier.notify({
					title: 'Jiracle Time Tracker',
					message: "⏰ Don't forget to log your work time today!",
					icon: this.getNotificationIcon(),
					timeout: 15,
					wait: false,
				} as any); // Type assertion to bypass strict typing
			} else {
				// Windows/Linux - simplified but better styled
				notifier.notify({
					title: '⏰ Jiracle Time Tracker',
					message: "Don't forget to log your work time today!",
					icon: this.getNotificationIcon(),
					timeout: 10,
					wait: false,
				} as any); // Type assertion to bypass strict typing
			}
		} catch (error: unknown) {
			// Silently handle notification errors to avoid breaking the app
			console.error('Notification error (non-critical):', error);
		}
	}

	private getNotificationIcon(): string {
		const {platform} = process;

		try {
			// Try to create a temporary icon from embedded data
			return this.createTemporaryIcon();
		} catch {
			// Fall through to system icons
		}

		// Fallback to system icons
		if (platform === 'darwin') {
			// MacOS - use system clock/time icon
			return '/System/Library/CoreServices/Clock.app/Contents/Resources/Clock.icns';
		}

		if (platform === 'win32') {
			// Windows - use system clock icon
			return 'C:\\Windows\\System32\\shell32.dll,176';
		}

		// Linux - use a common system icon
		return '/usr/share/icons/gnome/48x48/status/appointment-soon.png';
	}

	private createTemporaryIcon(): string {
		// Base64 encoded PNG icon (32x32 pixels) - simple clock with "J"
		const iconBase64 =
			'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAANCSURBVFhH7ZdNiFxVFIafM+/e2123u6u7q7ozk0kmM5lJJpnJJJNkMjOZZJJJZjKZTCaZzGQymUwmk8lkMplMJpPJZDKZTCaZzGQymUwmk8lkMplMJpPJZDKZTCaZmUwmk8lkMplMJpPJZDKZTCaZmUwmk8lkMplMJpPJZDKZTCaZmUwmk8lkMplMJpNJ';

		const iconData = Buffer.from(iconBase64, 'base64');
		const temporaryDir = os.tmpdir();
		const iconPath = path.join(temporaryDir, 'jiracle-notification-icon.png');

		fs.writeFileSync(iconPath, iconData);
		return iconPath;
	}
}
