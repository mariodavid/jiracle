import React from 'react';
import {render} from 'ink-testing-library';
import type {Attendance} from '../../attendance/types.js';

// Component test helpers
export const InkTestHelpers: any = {
	// Standard props factory for AttendanceEditForm
	createAttendanceEditFormProps(overrides: Partial<any> = {}) {
		return {
			date: new Date(2025, 6, 11), // July 11, 2025
			onSubmit() {},
			onCancel() {},
			...overrides,
		};
	},

	// Render component with default props
	renderAttendanceEditForm(component: any, props: any = {}) {
		const defaultProps = this.createAttendanceEditFormProps(props);
		return render(React.createElement(component, defaultProps));
	},

	// Common assertions for component output
	assertComponentContains(output: string, expectedTexts: string[], t: any) {
		for (const text of expectedTexts) {
			t.true(output.includes(text), `Expected output to contain "${text}"`);
		}
	},

	assertGermanDateFormat(output: string, expectedFormat: string, t: any) {
		t.true(
			output.includes(expectedFormat),
			`Expected German date format "${expectedFormat}" in output but got: ${output}`,
		);
	},

	assertTimeInputsVisible(output: string, t: any) {
		const expectedInputs = ['Beginn:', 'Ende:', 'Pause:'];
		this.assertComponentContains(output, expectedInputs, t);
	},

	assertNavigationButtonsVisible(output: string, t: any) {
		const expectedButtons = ['[Speichern]', '[Abbrechen]'];
		this.assertComponentContains(output, expectedButtons, t);
	},

	assertNavigationHelpVisible(output: string, t: any) {
		const expectedHelp = [
			'[Tab] Feld wechseln',
			'[Enter] Speichern',
			'[Esc] Abbrechen',
		];
		this.assertComponentContains(output, expectedHelp, t);
	},

	// Test keyboard interaction pattern
	simulateTabNavigation(stdin: any, steps = 3) {
		for (let i = 0; i < steps; i++) {
			stdin.write('\t');
		}
	},

	// Validate callback setup
	assertCallbackSetup(callback: any, t: any) {
		t.is(typeof callback, 'function', 'Callback should be a function');
	},

	// Test data for different scenarios
	createTestAttendanceData(): {
		valid: Attendance;
		withInitialData: Attendance;
		withInvalidTime: Attendance;
		withEmptyFields: Partial<Attendance>;
		withDifferentBreak: Attendance;
	} {
		return {
			valid: {
				date: '2025-07-11',
				checkIn: '08:00',
				checkOut: '17:00',
				breakMinutes: 30,
			},
			withInitialData: {
				date: '2025-07-11',
				checkIn: '09:00',
				checkOut: '18:00',
				breakMinutes: 45,
			},
			withInvalidTime: {
				date: '2025-07-11',
				checkIn: '25:00',
				checkOut: '17:00',
				breakMinutes: 30,
			},
			withEmptyFields: {
				date: '2025-07-11',
				breakMinutes: 30,
			},
			withDifferentBreak: {
				date: '2025-07-11',
				checkIn: '08:00',
				checkOut: '17:00',
				breakMinutes: 45,
			},
		};
	},

	// Config variations for testing
	createTestConfigs() {
		return {
			withCustomDefaults: {
				attendance: {
					defaultCheckIn: '07:30',
					defaultCheckOut: '16:30',
				},
			},
			empty: {},
		};
	},

	// Date test helpers
	createTestDates() {
		return {
			friday: new Date(2025, 6, 11), // July 11, 2025 (Friday)
			sunday: new Date(2025, 5, 15), // June 15, 2025 (Sunday)
			testDate: new Date(2025, 6, 11), // Standard test date
		};
	},

	// German date format expectations
	getExpectedGermanFormats() {
		return {
			friday: 'Fr, 11. Jul',
			sunday: 'So, 15. Jun',
		};
	},

	// Common test patterns for component testing
	testComponentStructure(component: any, expectedElements: string[], t: any) {
		const {lastFrame} = this.renderAttendanceEditForm(component);
		const output = lastFrame() || '';
		this.assertComponentContains(output, expectedElements, t);
		return output as string;
	},

	testComponentWithData(
		component: any,
		initialData: Attendance,
		expectedValues: string[],
		t: any,
	) {
		const props = this.createAttendanceEditFormProps({initialData});
		const {lastFrame} = render(React.createElement(component, props));
		const output = lastFrame() || '';
		this.assertComponentContains(output, expectedValues, t);
		return output;
	},

	testComponentWithConfig(
		component: any,
		config: any,
		expectedValues: string[],
		t: any,
	) {
		const props = this.createAttendanceEditFormProps({config});
		const {lastFrame} = render(React.createElement(component, props));
		const output = lastFrame() || '';
		this.assertComponentContains(output, expectedValues, t);
		return output;
	},

	// Test timing utilities
	delay(ms: number): Promise<void> {
		// eslint-disable-next-line no-promise-executor-return
		return new Promise(resolve => setTimeout(resolve, ms));
	},

	// For async effects in React components
	waitForEffects(): Promise<void> {
		// eslint-disable-next-line no-promise-executor-return
		return new Promise(resolve => setImmediate(resolve));
	},
};
