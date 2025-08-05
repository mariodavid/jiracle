import test from 'ava';
import {
	SAPExportResult,
	type SAPExportFailure,
	toLegacyResult,
} from '../../domain/SAPExportResult.js';
import {SAPResponse} from '../../domain/SAPResponse.js';

test('SAPExportResult success creation and properties', t => {
	// EXPLICIT TEST DATA
	const successMessage = 'Export completed successfully';

	// OPERATIONS
	const success = SAPExportResult.success(successMessage);
	const successWithoutMessage = SAPExportResult.success();

	// SPECIFIC VALUE COMPARISONS
	t.true(success.isSuccess(), 'Should indicate success');
	t.false(success.isFailure(), 'Should not indicate failure');
	t.is(success.getMessage(), successMessage, 'Should return message');
	t.is(
		success.getSuccessMessage(),
		successMessage,
		'Should return success message',
	);

	t.true(
		successWithoutMessage.isSuccess(),
		'Should indicate success without message',
	);
	t.is(
		successWithoutMessage.getSuccessMessage(),
		'Export completed successfully',
		'Should return default message',
	);
});

test('SAPExportResult failure creation and properties', t => {
	// EXPLICIT TEST DATA
	const errors = ['Error 1', 'Error 2'];
	const warnings = ['Warning 1'];

	// OPERATIONS
	const failureWithWarnings = SAPExportResult.failure(errors, warnings);
	const failureWithoutWarnings = SAPExportResult.failure(errors);

	// SPECIFIC VALUE COMPARISONS
	t.false(failureWithWarnings.isSuccess(), 'Should not indicate success');
	t.true(failureWithWarnings.isFailure(), 'Should indicate failure');
	t.is(
		failureWithWarnings.getMessage(),
		errors[0],
		'Should return first error as message',
	);

	const failure = failureWithWarnings;
	t.deepEqual(failure.getErrors(), errors, 'Should return all errors');
	t.deepEqual(failure.getWarnings(), warnings, 'Should return warnings');
	t.true(failure.hasWarnings(), 'Should indicate warnings present');
	t.is(failure.getErrorCount(), 2, 'Should return correct error count');
	t.is(failure.getWarningCount(), 1, 'Should return correct warning count');

	const failureNoWarnings = failureWithoutWarnings;
	t.false(failureNoWarnings.hasWarnings(), 'Should indicate no warnings');
	t.is(
		failureNoWarnings.getWarningCount(),
		0,
		'Should return zero warning count',
	);
});

test('SAPExportResult failure getAllMessages method', t => {
	// EXPLICIT TEST DATA
	const errors = ['Error 1', 'Error 2'];
	const warnings = ['Warning 1', 'Warning 2'];
	const expectedAllMessages = ['Error 1', 'Error 2', 'Warning 1', 'Warning 2'];

	// OPERATIONS
	const failure = SAPExportResult.failure(errors, warnings);

	// SPECIFIC VALUE COMPARISONS
	t.deepEqual(
		failure.getAllMessages(),
		expectedAllMessages,
		'Should combine errors and warnings',
	);
});

test('SAPExportResult fromSAPResponse with success', t => {
	// EXPLICIT TEST DATA
	const successHtml = 'Timesheet successfully sent to S4/Hana.';
	const expectedMessage = 'Timesheet successfully exported to SAP S/4HANA';

	// OPERATIONS
	const sapResponse = new SAPResponse(successHtml);
	const result = SAPExportResult.fromSAPResponse(sapResponse);

	// SPECIFIC VALUE COMPARISONS
	t.true(result.isSuccess(), 'Should create success result');
	t.is(result.getMessage(), expectedMessage, 'Should return success message');
});

test('SAPExportResult fromSAPResponse with personnel error', t => {
	// EXPLICIT TEST DATA
	const personnelErrorHtml = 'Please provide the personnel number';
	const expectedError =
		'Personnel number (Persnr) is missing. Please configure in settings.';

	// OPERATIONS
	const sapResponse = new SAPResponse(personnelErrorHtml);
	const result = SAPExportResult.fromSAPResponse(sapResponse);

	// SPECIFIC VALUE COMPARISONS
	t.true(result.isFailure(), 'Should create failure result');
	t.is(
		result.getMessage(),
		expectedError,
		'Should return personnel error message',
	);
});

test('SAPExportResult fromSAPResponse with no worklogs error', t => {
	// EXPLICIT TEST DATA
	const noWorklogsHtml = 'No worklogs found for this period';
	const expectedError = 'No worklogs found for the selected period.';

	// OPERATIONS
	const sapResponse = new SAPResponse(noWorklogsHtml);
	const result = SAPExportResult.fromSAPResponse(sapResponse);

	// SPECIFIC VALUE COMPARISONS
	t.true(result.isFailure(), 'Should create failure result');
	t.is(
		result.getMessage(),
		expectedError,
		'Should return no worklogs error message',
	);
});

test('SAPExportResult fromSAPResponse with HTML errors and warnings', t => {
	// EXPLICIT TEST DATA
	const errorWarningHtml = `
		<div class="aui-message aui-message-error">Validation failed</div>
		<div class="aui-message aui-message-warning">Data incomplete</div>
	`;

	// OPERATIONS
	const sapResponse = new SAPResponse(errorWarningHtml);
	const result = SAPExportResult.fromSAPResponse(sapResponse);

	// SPECIFIC VALUE COMPARISONS
	t.true(result.isFailure(), 'Should create failure result');
	const failure = result as SAPExportFailure;
	t.is(failure.getErrorCount(), 1, 'Should extract errors');
	t.is(failure.getWarningCount(), 1, 'Should extract warnings');
	t.is(
		failure.getErrors()[0],
		'Validation failed',
		'Should extract error text',
	);
	t.is(
		failure.getWarnings()[0],
		'Data incomplete',
		'Should extract warning text',
	);
});

test('SAPExportResult fromSAPResponse with unknown response', t => {
	// EXPLICIT TEST DATA
	const unknownHtml = '<div>Some unknown response</div>';
	const expectedError = 'Unknown response from server. Export may have failed.';

	// OPERATIONS
	const sapResponse = new SAPResponse(unknownHtml);
	const result = SAPExportResult.fromSAPResponse(sapResponse);

	// SPECIFIC VALUE COMPARISONS
	t.true(result.isFailure(), 'Should create failure result');
	t.is(
		result.getMessage(),
		expectedError,
		'Should return unknown error message',
	);
});

test('SAPExportResult fromNetworkError', t => {
	// EXPLICIT TEST DATA
	const networkError = new Error('Connection timeout');
	const expectedErrorMessage = 'Network error: Connection timeout';

	// OPERATIONS
	const result = SAPExportResult.fromNetworkError(networkError);

	// SPECIFIC VALUE COMPARISONS
	t.true(result.isFailure(), 'Should create failure result');
	t.is(
		result.getMessage(),
		expectedErrorMessage,
		'Should return network error message',
	);
});

test('SAPExportResult fromHttpError', t => {
	// EXPLICIT TEST DATA
	const status = 500;
	const statusText = 'Internal Server Error';
	const expectedErrorMessage = 'HTTP 500: Internal Server Error';

	// OPERATIONS
	const result = SAPExportResult.fromHttpError(status, statusText);

	// SPECIFIC VALUE COMPARISONS
	t.true(result.isFailure(), 'Should create failure result');
	t.is(
		result.getMessage(),
		expectedErrorMessage,
		'Should return HTTP error message',
	);
});

test('toLegacyResult converts success correctly', t => {
	// EXPLICIT TEST DATA
	const successMessage = 'Export successful';
	const success = SAPExportResult.success(successMessage);

	// OPERATIONS
	const legacy = toLegacyResult(success);

	// SPECIFIC VALUE COMPARISONS
	t.true(legacy.success, 'Should indicate success in legacy format');
	t.is(legacy.message, successMessage, 'Should preserve message');
	t.is(legacy.errors, undefined, 'Should not have errors');
	t.is(legacy.warnings, undefined, 'Should not have warnings');
});

test('toLegacyResult converts failure correctly', t => {
	// EXPLICIT TEST DATA
	const errors = ['Error 1', 'Error 2'];
	const warnings = ['Warning 1'];
	const failure = SAPExportResult.failure(errors, warnings);

	// OPERATIONS
	const legacy = toLegacyResult(failure);

	// SPECIFIC VALUE COMPARISONS
	t.false(legacy.success, 'Should indicate failure in legacy format');
	t.deepEqual(legacy.errors, errors, 'Should preserve errors');
	t.deepEqual(legacy.warnings, warnings, 'Should preserve warnings');
	t.is(legacy.message, undefined, 'Should not have message for failure');
});

test('toLegacyResult converts failure without warnings correctly', t => {
	// EXPLICIT TEST DATA
	const errors = ['Single error'];
	const failure = SAPExportResult.failure(errors);

	// OPERATIONS
	const legacy = toLegacyResult(failure);

	// SPECIFIC VALUE COMPARISONS
	t.false(legacy.success, 'Should indicate failure in legacy format');
	t.deepEqual(legacy.errors, errors, 'Should preserve errors');
	t.is(
		legacy.warnings,
		undefined,
		'Should not have warnings when none provided',
	);
});
