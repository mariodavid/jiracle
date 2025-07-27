import {readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {IssueKey} from '../domain/IssueKey.js';
import type {JiraConfig} from '../jira/types.js';
import {loadConfigWithEnvVars} from '../jira-client.js';

/**
 * Transform string keys in favorites to IssueKey objects
 */
function transformConfig(config: Record<string, unknown>): JiraConfig {
	const transformedConfig = {...config};

	if (Array.isArray(transformedConfig['favorites'])) {
		transformedConfig['favorites'] = transformedConfig['favorites'].map(
			(fav: unknown) => {
				if (typeof fav === 'object' && fav !== null && 'key' in fav) {
					const favorite = fav as Record<string, unknown>;
					const {key} = favorite;

					let transformedKey = key;
					if (typeof key === 'string') {
						// Key is a string, convert to IssueKey
						transformedKey = IssueKey.fromString(key);
					} else if (
						typeof key === 'object' &&
						key !== null &&
						'project' in key &&
						'number' in key
					) {
						// Key is a serialized IssueKey object, reconstruct it
						const keyObject = key as Record<string, unknown>;
						if (
							typeof keyObject['project'] === 'string' &&
							typeof keyObject['number'] === 'number'
						) {
							transformedKey = IssueKey.fromString(
								`${keyObject['project']}-${keyObject['number']}`,
							);
						}
					}

					return {
						...favorite,
						key: transformedKey,
					};
				}

				return fav;
			},
		);
	}

	return transformedConfig as JiraConfig;
}

/**
 * Loads and parses the Jira configuration file from the default location
 * or a custom path.
 *
 * @param configPath - Optional custom config file path. Defaults to ~/.config/jiracle.json
 * @param includeEnvVars - Whether to load environment variables into the config. Defaults to false
 * @returns Parsed JiraConfig object
 * @throws Error if config file cannot be read or parsed
 */
export function loadJiraConfig(
	configPath?: string,
	includeEnvVars = false,
): JiraConfig {
	const configFilePath =
		configPath ?? join(homedir(), '.config', 'jiracle.json');

	const configData = readFileSync(configFilePath, 'utf8');
	const rawConfig = JSON.parse(configData) as Record<string, unknown>;
	const baseConfig = transformConfig(rawConfig);

	return includeEnvVars ? loadConfigWithEnvVars(baseConfig) : baseConfig;
}
