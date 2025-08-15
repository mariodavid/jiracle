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
 * Open the configuration file in the configured editor
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

	// Determine which editor to use
	const editor = config?.editor ?? detectEditor();

	if (!editor) {
		return {
			success: false,
			message:
				'No editor configured. Please set the "editor" field in your config or set the EDITOR environment variable.',
		};
	}

	return new Promise(resolve => {
		// Parse editor command in case it has arguments
		const editorParts = editor.split(' ');
		const editorCommand = editorParts[0]!;
		const editorArgs = [...editorParts.slice(1), configPath];

		// Spawn the editor process
		const editorProcess = spawn(editorCommand, editorArgs, {
			stdio: 'inherit',
			shell: process.platform === 'win32',
		});

		editorProcess.on('error', error => {
			resolve({
				success: false,
				message: `Failed to open editor: ${error.message}. Make sure "${editorCommand}" is installed and in your PATH.`,
			});
		});

		editorProcess.on('exit', code => {
			if (code === 0) {
				resolve({
					success: true,
					message: `Configuration file opened in ${editorCommand}`,
				});
			} else {
				resolve({
					success: false,
					message: `Editor exited with code ${code ?? 'unknown'}`,
				});
			}
		});
	});
}
