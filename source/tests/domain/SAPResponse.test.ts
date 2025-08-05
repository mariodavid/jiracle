import test from 'ava';
import {SAPResponse} from '../../domain/SAPResponse.js';

test('SAPResponse success detection', t => {
	// EXPLICIT TEST DATA
	const successHtml =
		'<div>Some content</div>successfully sent to S4/Hana<div>More content</div>';
	const failureHtml = '<div>Error occurred during processing</div>';

	// OPERATIONS
	const successResponse = new SAPResponse(successHtml);
	const failureResponse = new SAPResponse(failureHtml);

	// SPECIFIC VALUE COMPARISONS
	t.true(successResponse.isSuccess(), 'Should detect success message');
	t.false(
		failureResponse.isSuccess(),
		'Should not detect success in error response',
	);
});

test('SAPResponse error extraction', t => {
	// EXPLICIT TEST DATA
	const errorHtml = `
		<div class="aui-message aui-message-error">
			<strong>Error:</strong> Personnel number not found
		</div>
		<div class="aui-message aui-message-error">
			<span>Second error message</span>
		</div>
	`;
	const noErrorHtml = '<div>Normal content without errors</div>';
	const expectedErrors = [
		'Error: Personnel number not found',
		'Second error message',
	];

	// OPERATIONS
	const errorResponse = new SAPResponse(errorHtml);
	const cleanResponse = new SAPResponse(noErrorHtml);

	// SPECIFIC VALUE COMPARISONS
	const extractedErrors = errorResponse.extractErrors();
	t.is(extractedErrors.length, 2, 'Should extract both error messages');
	t.is(
		extractedErrors[0],
		expectedErrors[0],
		'Should extract first error correctly',
	);
	t.is(
		extractedErrors[1],
		expectedErrors[1],
		'Should extract second error correctly',
	);
	t.is(
		cleanResponse.extractErrors().length,
		0,
		'Should return empty array for no errors',
	);
});

test('SAPResponse warning extraction', t => {
	// EXPLICIT TEST DATA
	const warningHtml = `
		<div class="aui-message aui-message-warning">
			<p>Warning: Some data may be incomplete</p>
		</div>
	`;
	const expectedWarning = 'Warning: Some data may be incomplete';

	// OPERATIONS
	const warningResponse = new SAPResponse(warningHtml);

	// SPECIFIC VALUE COMPARISONS
	const extractedWarnings = warningResponse.extractWarnings();
	t.is(extractedWarnings.length, 1, 'Should extract warning message');
	t.is(
		extractedWarnings[0],
		expectedWarning,
		'Should extract warning text correctly',
	);
});

test('SAPResponse personnel number error detection', t => {
	// EXPLICIT TEST DATA
	const personnelMissingHtml = '<div>Please provide the personnel number</div>';
	const employeeNotFoundHtml = '<div>Cannot find employee for given ID</div>';
	const normalHtml = '<div>Everything is fine</div>';

	// OPERATIONS
	const missingResponse = new SAPResponse(personnelMissingHtml);
	const notFoundResponse = new SAPResponse(employeeNotFoundHtml);
	const normalResponse = new SAPResponse(normalHtml);

	// SPECIFIC VALUE COMPARISONS
	t.true(
		missingResponse.hasPersonnelNumberError(),
		'Should detect missing personnel number',
	);
	t.true(
		notFoundResponse.hasPersonnelNumberError(),
		'Should detect employee not found',
	);
	t.false(
		normalResponse.hasPersonnelNumberError(),
		'Should not detect error in normal response',
	);
});

test('SAPResponse no worklogs error detection', t => {
	// EXPLICIT TEST DATA
	const noWorklogsHtml = '<div>No worklogs found for this period</div>';
	const normalHtml = '<div>Processing worklogs...</div>';

	// OPERATIONS
	const noWorklogsResponse = new SAPResponse(noWorklogsHtml);
	const normalResponse = new SAPResponse(normalHtml);

	// SPECIFIC VALUE COMPARISONS
	t.true(
		noWorklogsResponse.hasNoWorklogsError(),
		'Should detect no worklogs message',
	);
	t.false(
		normalResponse.hasNoWorklogsError(),
		'Should not detect error in normal response',
	);
});

test('SAPResponse HTML cleaning', t => {
	// EXPLICIT TEST DATA
	const messyHtml = `
		<div class="aui-message aui-message-error">
			<strong>Error:</strong>&nbsp;&amp;nbsp;Invalid&lt;data&gt;&quot;test&quot;&#39;quote&#39;
		</div>
	`;
	const expectedCleanText = 'Error: &nbsp;Invalid<data>"test"\'quote\'';

	// OPERATIONS
	const response = new SAPResponse(messyHtml);
	const errors = response.extractErrors();

	// SPECIFIC VALUE COMPARISONS
	t.is(errors.length, 1, 'Should extract one error');
	t.is(
		errors[0],
		expectedCleanText,
		'Should clean HTML entities and tags correctly',
	);
});

test('SAPResponse utility methods', t => {
	// EXPLICIT TEST DATA
	const emptyHtml = '';
	const whitespaceHtml = '   \n\t   ';
	const contentHtml = '<div>Some content</div>';
	const searchText = 'content';

	// OPERATIONS
	const emptyResponse = new SAPResponse(emptyHtml);
	const whitespaceResponse = new SAPResponse(whitespaceHtml);
	const contentResponse = new SAPResponse(contentHtml);

	// SPECIFIC VALUE COMPARISONS
	t.is(emptyResponse.getRawHtml(), emptyHtml, 'Should return raw HTML');
	t.true(emptyResponse.isEmpty(), 'Should detect empty content');
	t.true(whitespaceResponse.isEmpty(), 'Should detect whitespace-only content');
	t.false(contentResponse.isEmpty(), 'Should not detect content as empty');
	t.true(
		contentResponse.containsText(searchText),
		'Should find contained text',
	);
	t.false(
		contentResponse.containsText('missing'),
		'Should not find missing text',
	);
});

test('SAPResponse complex scenario', t => {
	// EXPLICIT TEST DATA
	const complexHtml = `
		<html>
			<body>
				<div class="aui-message aui-message-warning">
					<p>Warning: Partial data processed</p>
				</div>
				<div class="content">
					Processing results...
				</div>
				<div class="aui-message aui-message-error">
					Personnel number validation failed
				</div>
				<div>Please provide the personnel number</div>
			</body>
		</html>
	`;

	// OPERATIONS
	const response = new SAPResponse(complexHtml);

	// SPECIFIC VALUE COMPARISONS
	t.false(response.isSuccess(), 'Should not be success with errors');
	t.true(response.hasPersonnelNumberError(), 'Should detect personnel error');
	t.false(response.isEmpty(), 'Should not be empty');

	const errors = response.extractErrors();
	const warnings = response.extractWarnings();

	t.is(errors.length, 1, 'Should extract error messages');
	t.is(warnings.length, 1, 'Should extract warning messages');
	t.is(
		warnings[0],
		'Warning: Partial data processed',
		'Should extract warning correctly',
	);
	t.is(
		errors[0],
		'Personnel number validation failed',
		'Should extract error correctly',
	);
});
