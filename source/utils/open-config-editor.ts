import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import process from 'node:process';
import type {JiraConfig} from '../jira/types.js';

/**
 * Get the path to the Jiracle configuration file
 */
export function getConfigPath(): string {
	const configPath = process.env['JIRACLE_CONFIG_PATH'];
	if (configPath) {
		return configPath;
	}

	return join(homedir(), '.config', 'jiracle.json');
}

/**
 * Detect common editors available on the system
 */
function detectEditor(): string | undefined {
	// Check environment variables first
	const editorFromEnv = process.env['EDITOR'] ?? process.env['VISUAL'];
	if (editorFromEnv) {
		return editorFromEnv;
	}

	// Common editors to check for
	const commonEditors = [
		'code', // VS Code
		'vim',
		'nvim', // Neovim
		'nano',
		'emacs',
		'subl', // Sublime Text
		'atom',
	];

	// On Windows, also check for notepad
	if (process.platform === 'win32') {
		commonEditors.push('notepad');
	}

	// Try to detect which editor is available
	// This is a simplified check - in reality, we'd need to check PATH
	// For now, return the first common editor as a fallback
	return process.platform === 'win32' ? 'notepad' : 'nano';
}

/**
 * Open the configuration file using the configured command
 */
export async function openConfigInEditor(
	config?: JiraConfig,
): Promise<{success: boolean; message: string}> {
	const configPath = getConfigPath();

	// Check if config file exists
	if (!existsSync(configPath)) {
		return {
			success: false,
			message: `Configuration file not found at ${configPath}. Please run 'jiracle' to create it.`,
		};
	}

	// Use configured command or build default editor command
	let command: string;
	if (config?.openConfigCommand) {
		// Replace placeholder with actual config path if present
		command = config.openConfigCommand.replace(
			'~/.config/jiracle.json',
			configPath,
		);
	} else {
		// Fallback to default editor behavior
		const editor = detectEditor();
		if (!editor) {
			return {
				success: false,
				message:
					'No command configured. Please set the "openConfigCommand" field in your config or set the EDITOR environment variable.',
			};
		}

		command = `${editor} "${configPath}"`;
	}

	return new Promise(resolve => {
		// Parse command in case it has arguments
		const commandParts = command.split(' ');
		const executable = commandParts[0]!;
		const args = commandParts.slice(1);

		// Spawn the process
		const childProcess = spawn(executable, args, {
			stdio: 'inherit',
			shell: process.platform === 'win32',
		});

		childProcess.on('error', error => {
			resolve({
				success: false,
				message: `Failed to execute command: ${error.message}. Make sure "${executable}" is installed and in your PATH.`,
			});
		});

		childProcess.on('exit', code => {
			if (code === 0) {
				resolve({
					success: true,
					message: `Configuration command executed successfully`,
				});
			} else {
				resolve({
					success: false,
					message: `Command exited with code ${code ?? 'unknown'}`,
				});
			}
		});
	});
}
