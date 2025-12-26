import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { TextInput } from '@inkjs/ui';
import { IssueKey } from '../../domain/IssueKey.js';

type IssueKeyInputProps = {
	issueKey?: IssueKey;
	onChange: (key: IssueKey | undefined) => void;
	isActive: boolean;
	onSubmit: () => void;
};

export const IssueKeyInput = ({
	issueKey,
	onChange,
	isActive,
	onSubmit,
}: IssueKeyInputProps) => {
	// State for the text input value to support controlled input and immediate parsing effects
	const [inputValue, setInputValue] = useState(issueKey?.toString() ?? '');

	// Update local state when prop changes externally (e.g. initial load or reset)
	useEffect(() => {
		// Only update if the prop value is different from what we have partially typed,
		// OR if the prop value matches the parsed version of what we have.
		// Actually, simplest is to just sync if they differ significantly,
		// but we want to avoid overwriting user typing if they are typing a partial key.

		// For now, let's trust that parent only updates issueKey when it's valid.
		if (issueKey?.toString() !== inputValue) {
			// Check if our current input value parses to this key. If so, keep our input value (preserved formatting/case).
			try {
				const currentParsed = IssueKey.fromString(inputValue);
				if (currentParsed.equals(issueKey!)) {
					return;
				}
			} catch { }

			setInputValue(issueKey?.toString() ?? '');
		}
	}, [issueKey]);

	const handleInput = (value: string) => {
		let nextValue = value;

		// Use RegExp.exec for better compliance or strict matches if needed,
		// but for simple extraction matching, match() is standard.
		// However, lint error said "Use the `RegExp#exec()` method instead".
		// @typescript-eslint/prefer-regexp-exec usually applies if we are not ensuring it's a string,
		// or maybe it just prefers exec loop.
		// Actually, for single match, regex.exec(string) is strictly better typed sometimes?
		// Let's stick to simple regex for now but satisfy linter if possible.

		const issueKeyRegex = /([a-zA-Z]+-\d+)/;
		const match = issueKeyRegex.exec(value);

		if (match) {
			const extractedKey = match[0];
			// If the input contains more than just the key (e.g. a URL),
			// immediately replace with the extracted key
			if (extractedKey.length < value.length) {
				nextValue = extractedKey;
				setInputValue(nextValue);

				try {
					const newKey = IssueKey.fromString(nextValue);
					// Notify parent immediately
					onChange(newKey);
				} catch { }

				return;
			}
		}

		setInputValue(nextValue);

		try {
			const newKey = IssueKey.fromString(nextValue);
			// We only call onChange if it's a valid key
			// But we need to avoid updating parent if it's the SAME key to avoid cycles?
			// Parent handles equality check usually.
			onChange(newKey);
		} catch {
			// Invalid, maybe clear parent's key if we want to support clearing?
			// Or just do nothing and let parent keep old key until valid?
			// Existing logic seemed to only update on valid.
			// But if user clears input, we should probably clear key?
			// If invalid, we don't pass undefined, we just don't pass a Key.
		}
	};

	return (
		<TextInput
			key={`issue-key-input-${inputValue}`} // Force re-render on programmatic update (paste)
			defaultValue={inputValue}
			placeholder="e.g. DEF-123, AD-456..."
			isDisabled={!isActive}
			onChange={handleInput}
			onSubmit={value => {
				// Final parse check
				const issueKeyRegex = /([a-zA-Z]+-\d+)/;
				const match = issueKeyRegex.exec(value);
				const keyToParse = match ? match[0] : value;

				try {
					const newKey = IssueKey.fromString(keyToParse);
					onChange(newKey);
					onSubmit();
				} catch {
					// Stay in field if invalid
				}
			}}
		/>
	);
};
