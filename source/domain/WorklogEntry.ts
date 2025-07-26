import type {
	WorklogEntry as ApiWorklogEntry,
	WorklogRequest,
} from '../jira/types.js';
import {IssueKey} from './IssueKey.js';

type WorklogEntryData = {
	id: string;
	issueKey: string;
	duration: number;
	comment: string;
	date: Date;
	author: {displayName: string; emailAddress: string};
};

type CreateWorklogOptions = {
	issueKey: string;
	duration: number;
	comment: string;
	date: Date;
	author: {displayName: string; emailAddress: string};
};

export class WorklogEntry {
	static create(options: CreateWorklogOptions): WorklogEntry {
		// Validate and normalize issue key using domain object
		const validatedIssueKey = IssueKey.fromString(options.issueKey);

		if (options.duration <= 0) {
			throw new Error('Duration must be greater than 0');
		}

		if (!options.author?.displayName || !options.author?.emailAddress) {
			throw new Error('Author displayName and emailAddress are required');
		}

		// Generate a temporary ID for new worklogs
		const id = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

		return new WorklogEntry({
			id,
			issueKey: validatedIssueKey.toString(),
			duration: Math.round(options.duration),
			comment: options.comment.trim(),
			date: new Date(options.date),
			author: {...options.author},
		});
	}

	static fromApiResponse(
		apiEntry: ApiWorklogEntry,
		issueKey: string,
	): WorklogEntry {
		if (!apiEntry.id) {
			throw new Error('API worklog entry must have an id');
		}

		// Validate and normalize issue key using domain object
		const validatedIssueKey = IssueKey.fromString(issueKey);

		const startedDate = new Date(apiEntry.started);
		if (Number.isNaN(startedDate.getTime())) {
			throw new TypeError(`Invalid started date: ${apiEntry.started}`);
		}

		return new WorklogEntry({
			id: apiEntry.id,
			issueKey: validatedIssueKey.toString(),
			duration: apiEntry.timeSpentSeconds,
			comment: apiEntry.comment ?? '',
			date: startedDate,
			author: {...apiEntry.author},
		});
	}

	private readonly _id: string;
	private readonly _issueKey: string;
	private readonly _duration: number; // TimeSpentSeconds
	private readonly _comment: string;
	private readonly _date: Date;
	private readonly _author: {
		displayName: string;
		emailAddress: string;
	};

	private constructor(data: WorklogEntryData) {
		this._id = data.id;
		this._issueKey = data.issueKey;
		this._duration = data.duration;
		this._comment = data.comment;
		this._date = data.date;
		this._author = data.author;
	}

	get id(): string {
		return this._id;
	}

	get issueKey(): string {
		return this._issueKey;
	}

	get duration(): number {
		return this._duration;
	}

	get durationHours(): number {
		return this._duration / 3600;
	}

	get comment(): string {
		return this._comment;
	}

	get date(): Date {
		return new Date(this._date);
	}

	get author(): {displayName: string; emailAddress: string} {
		return {...this._author};
	}

	get isTemporary(): boolean {
		return this._id.startsWith('temp-');
	}

	isEditableBy(userEmail: string): boolean {
		if (!userEmail) {
			return false;
		}

		return this._author.emailAddress.toLowerCase() === userEmail.toLowerCase();
	}

	canBeDeletedBy(userEmail: string): boolean {
		return this.isEditableBy(userEmail);
	}

	updateDuration(newDurationSeconds: number): WorklogEntry {
		if (newDurationSeconds <= 0) {
			throw new Error('Duration must be greater than 0');
		}

		return new WorklogEntry({
			id: this._id,
			issueKey: this._issueKey,
			duration: Math.round(newDurationSeconds),
			comment: this._comment,
			date: this._date,
			author: this._author,
		});
	}

	updateComment(newComment: string): WorklogEntry {
		return new WorklogEntry({
			id: this._id,
			issueKey: this._issueKey,
			duration: this._duration,
			comment: newComment.trim(),
			date: this._date,
			author: this._author,
		});
	}

	isSameDay(other: WorklogEntry | Date): boolean {
		const otherDate = other instanceof WorklogEntry ? other._date : other;
		const thisDateString = this._date.toISOString().split('T')[0];
		const otherDateString = otherDate.toISOString().split('T')[0];
		return thisDateString === otherDateString;
	}

	toApiRequest(): WorklogRequest {
		const startedDateTime = new Date(this._date);
		startedDateTime.setUTCHours(9, 0, 0, 0);

		return {
			timeSpent: this.formatDurationAsTimeSpent(),
			comment: this._comment || 'Work logged via Jiracle',
			started: startedDateTime.toISOString().replace('Z', '+0000'),
		};
	}

	formatDurationAsTimeSpent(): string {
		const hours = Math.floor(this.durationHours);
		const minutes = Math.round((this.durationHours - hours) * 60);

		if (hours > 0 && minutes > 0) {
			return `${hours}h ${minutes}m`;
		}

		if (hours > 0) {
			return `${hours}h`;
		}

		return `${minutes}m`;
	}

	equals(other: WorklogEntry): boolean {
		return (
			this._id === other._id &&
			this._issueKey === other._issueKey &&
			this._duration === other._duration &&
			this._comment === other._comment &&
			this._date.getTime() === other._date.getTime() &&
			this._author.emailAddress === other._author.emailAddress
		);
	}

	toString(): string {
		const dateString = this._date.toISOString().split('T')[0];
		const timeSpent = String(this.formatDurationAsTimeSpent());
		return [
			'WorklogEntry(',
			String(this._issueKey),
			', ',
			timeSpent,
			', ',
			dateString,
			')',
		].join('');
	}
}
