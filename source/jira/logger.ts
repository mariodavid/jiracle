import {join} from 'node:path';
import process from 'node:process';
import winston from 'winston';

export function createJiraLogger(): winston.Logger {
	const isTestEnvironment =
		process.env['NODE_ENV'] === 'test' || process.env['AVA_CONFIG'];

	return winston.createLogger({
		level: 'info',
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.errors({stack: true}),
			winston.format.json(),
		),
		transports: [
			new winston.transports.File({
				filename: join(
					process.env['HOME'] ?? '~',
					'.config',
					'jiracle-requests.log',
				),
				level: 'info',
			}),
			...(isTestEnvironment
				? []
				: [
						new winston.transports.Console({
							level: 'error',
							format: winston.format.simple(),
						}),
				  ]),
		],
	});
}
