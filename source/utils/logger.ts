import {join} from 'node:path';
import process from 'node:process';
import winston from 'winston';

// Create a shared logger for UI components
export const createUILogger = (): winston.Logger => {
	const isTestEnvironment =
		process.env['NODE_ENV'] === 'test' || process.env['AVA_CONFIG'];

	return winston.createLogger({
		level: process.env['JIRACLE_LOG_LEVEL'] ?? 'info', // Change to 'debug' to see debug logs
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.errors({stack: true}),
			winston.format.json(),
		),
		transports: [
			new winston.transports.File({
				filename: join(process.env['HOME'] ?? '~', '.config', 'jiracle-ui.log'),
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
