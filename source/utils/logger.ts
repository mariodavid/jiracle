import {join} from 'node:path';
import {existsSync, unlinkSync} from 'node:fs';
import process from 'node:process';
import winston from 'winston';

// Create a shared logger for UI components
export const createUILogger = (): winston.Logger => {
	const isTestEnvironment =
		process.env['NODE_ENV'] === 'test' || process.env['AVA_CONFIG'];

	const logFilePath = join(
		process.env['HOME'] ?? '~',
		'.config',
		'jiracle-ui.log',
	);

	// Clear the log file at application start (only in non-test environments)
	if (!isTestEnvironment && existsSync(logFilePath)) {
		try {
			unlinkSync(logFilePath);
		} catch {
			// Ignore errors when clearing log file
		}
	}

	return winston.createLogger({
		level: process.env['JIRACLE_LOG_LEVEL'] ?? 'info', // Change to 'debug' to see debug logs
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.errors({stack: true}),
			winston.format.json(),
		),
		transports: [
			new winston.transports.File({
				filename: logFilePath,
			}),
			// Only add console transport in non-test environments
			...(isTestEnvironment
				? []
				: [
						new winston.transports.Console({
							format: winston.format.simple(),
						}),
				  ]),
		],
	});
};

// Singleton instance
export const uiLogger = createUILogger();
