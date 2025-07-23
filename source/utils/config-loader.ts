import {readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import type {JiraConfig} from '../jira-client.js';
import {loadConfigWithEnvVars} from '../jira-client.js';

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
	const baseConfig = JSON.parse(configData) as JiraConfig;

	return includeEnvVars ? loadConfigWithEnvVars(baseConfig) : baseConfig;
}
