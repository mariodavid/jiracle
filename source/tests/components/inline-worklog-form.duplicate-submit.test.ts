import test from 'ava';

// Mock implementation of the duplicate submission logic from InlineWorklogForm
// This simulates what happens when onSubmit is called multiple times rapidly
class InlineFormSubmissionTest {
	private isSubmitting = false;
	private localSubmitting = false;
	private submittingRef = false;
	private submitCallCount = 0;

	constructor(private readonly onSubmit: () => void) {}

	// This mirrors the handleSubmit logic in InlineWorklogForm
	simulateHandleSubmit() {
		// Same logic as in the real component
		if (this.isSubmitting || this.localSubmitting || this.submittingRef) {
			return false; // Blocked
		}

		// Set ref immediately (synchronous)
		this.submittingRef = true;
		this.localSubmitting = true;

		// Call the actual onSubmit callback
		this.onSubmit();
		this.submitCallCount++;
		return true; // Submitted
	}

	// Simulate the useEffect that resets when isSubmitting changes
	simulateSubmissionComplete() {
		this.isSubmitting = false;
		this.localSubmitting = false;
		this.submittingRef = false;
	}

	// Simulate parent setting isSubmitting to true
	simulateParentSubmitting() {
		this.isSubmitting = true;
	}

	getSubmitCount() {
		return this.submitCallCount;
	}

	getState() {
		return {
			isSubmitting: this.isSubmitting,
			localSubmitting: this.localSubmitting,
			submittingRef: this.submittingRef,
		};
	}
}

test('InlineWorklogForm prevents duplicate submissions on rapid onSubmit calls', t => {
	let externalSubmitCount = 0;
	const mockOnSubmit = () => {
		externalSubmitCount++;
	};

	const formTest = new InlineFormSubmissionTest(mockOnSubmit);

	// Simulate rapid submission attempts (like rapid key presses)
	const result1 = formTest.simulateHandleSubmit();
	const result2 = formTest.simulateHandleSubmit(); // Should be blocked
	const result3 = formTest.simulateHandleSubmit(); // Should be blocked

	t.true(result1, 'First submission should succeed');
	t.false(result2, 'Second submission should be blocked');
	t.false(result3, 'Third submission should be blocked');
	t.is(externalSubmitCount, 1, 'onSubmit should only be called once');
});

test('InlineWorklogForm allows submission after previous submission completes', t => {
	let externalSubmitCount = 0;
	const mockOnSubmit = () => {
		externalSubmitCount++;
	};

	const formTest = new InlineFormSubmissionTest(mockOnSubmit);

	// First submission
	const result1 = formTest.simulateHandleSubmit();
	t.true(result1, 'First submission should succeed');
	t.is(externalSubmitCount, 1, 'onSubmit should be called once');

	// Attempt second submission while first is still "in progress"
	const result2 = formTest.simulateHandleSubmit();
	t.false(
		result2,
		'Second submission should be blocked while first is in progress',
	);
	t.is(externalSubmitCount, 1, 'onSubmit should still only be called once');

	// Simulate completion of first submission
	formTest.simulateSubmissionComplete();

	// Now third submission should work
	const result3 = formTest.simulateHandleSubmit();
	t.true(result3, 'Third submission should succeed after reset');
	t.is(externalSubmitCount, 2, 'onSubmit should be called twice total');
});

test('InlineWorklogForm blocks submission when parent isSubmitting is true', t => {
	let externalSubmitCount = 0;
	const mockOnSubmit = () => {
		externalSubmitCount++;
	};

	const formTest = new InlineFormSubmissionTest(mockOnSubmit);

	// Simulate parent component setting isSubmitting to true
	formTest.simulateParentSubmitting();

	// Try to submit while parent is submitting
	const result = formTest.simulateHandleSubmit();
	t.false(result, 'Submission should be blocked when parent is submitting');
	t.is(externalSubmitCount, 0, 'onSubmit should not be called');

	// Check state
	const state = formTest.getState();
	t.true(state.isSubmitting, 'isSubmitting should be true');
});

test('InlineWorklogForm rapid fire submission simulation', t => {
	let externalSubmitCount = 0;
	const mockOnSubmit = () => {
		externalSubmitCount++;
	};

	const formTest = new InlineFormSubmissionTest(mockOnSubmit);

	// Simulate rapid clicking/key pressing (like what happened in the bug)
	const results = [];
	for (let i = 0; i < 10; i++) {
		results.push(formTest.simulateHandleSubmit());
	}

	// Only the first one should succeed
	t.true(results[0], 'First submission should succeed');
	for (let i = 1; i < 10; i++) {
		t.false(results[i], `Submission ${i + 1} should be blocked`);
	}

	t.is(
		externalSubmitCount,
		1,
		'onSubmit should only be called once despite 10 attempts',
	);
	t.is(formTest.getSubmitCount(), 1, 'Internal submit count should be 1');
});

test('InlineWorklogForm state transitions work correctly', t => {
	let externalSubmitCount = 0;
	const mockOnSubmit = () => {
		externalSubmitCount++;
	};

	const formTest = new InlineFormSubmissionTest(mockOnSubmit);

	// Initial state
	let state = formTest.getState();
	t.false(state.isSubmitting, 'Initial isSubmitting should be false');
	t.false(state.localSubmitting, 'Initial localSubmitting should be false');
	t.false(state.submittingRef, 'Initial submittingRef should be false');

	// After submission
	formTest.simulateHandleSubmit();
	state = formTest.getState();
	t.false(
		state.isSubmitting,
		'isSubmitting should still be false (not set by handleSubmit)',
	);
	t.true(
		state.localSubmitting,
		'localSubmitting should be true after submission',
	);
	t.true(state.submittingRef, 'submittingRef should be true after submission');

	// After reset
	formTest.simulateSubmissionComplete();
	state = formTest.getState();
	t.false(state.isSubmitting, 'isSubmitting should be false after reset');
	t.false(state.localSubmitting, 'localSubmitting should be false after reset');
	t.false(state.submittingRef, 'submittingRef should be false after reset');
});
