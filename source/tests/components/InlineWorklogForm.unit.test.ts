import test from 'ava';

// Mock of the duplicate submission prevention logic
// This tests the core logic without the complexity of the full component
class SubmissionGuard {
	private isSubmitting = false;
	private localSubmitting = false;
	private submittingRef = false;

	constructor(private onSubmit: () => void) {}

	setIsSubmitting(value: boolean) {
		this.isSubmitting = value;
		if (!value) {
			this.localSubmitting = false;
			this.submittingRef = false;
		}
	}

	handleSubmit() {
		// This mirrors the logic in InlineWorklogForm.handleSubmit
		if (this.isSubmitting || this.localSubmitting || this.submittingRef) {
			return false; // Blocked
		}

		// Set ref immediately (synchronous)
		this.submittingRef = true;
		this.localSubmitting = true;
		this.onSubmit();
		return true; // Submitted
	}

	getState() {
		return {
			isSubmitting: this.isSubmitting,
			localSubmitting: this.localSubmitting,
			submittingRef: this.submittingRef,
		};
	}
}

test('SubmissionGuard prevents duplicate submissions', t => {
	let submitCount = 0;
	const guard = new SubmissionGuard(() => {
		submitCount++;
	});

	// First submission should work
	const firstResult = guard.handleSubmit();
	t.true(firstResult, 'First submission should succeed');
	t.is(submitCount, 1, 'onSubmit should be called once');

	// Second immediate submission should be blocked
	const secondResult = guard.handleSubmit();
	t.false(secondResult, 'Second submission should be blocked');
	t.is(submitCount, 1, 'onSubmit should still only be called once');

	// Third immediate submission should also be blocked
	const thirdResult = guard.handleSubmit();
	t.false(thirdResult, 'Third submission should be blocked');
	t.is(submitCount, 1, 'onSubmit should still only be called once');
});

test('SubmissionGuard allows submission after reset', t => {
	let submitCount = 0;
	const guard = new SubmissionGuard(() => {
		submitCount++;
	});

	// First submission
	guard.handleSubmit();
	t.is(submitCount, 1, 'First submission should work');

	// Reset the submission state (simulates parent component finishing)
	guard.setIsSubmitting(false);

	// Second submission should now work
	const result = guard.handleSubmit();
	t.true(result, 'Second submission should work after reset');
	t.is(submitCount, 2, 'onSubmit should be called twice total');
});

test('SubmissionGuard blocks when isSubmitting is true', t => {
	let submitCount = 0;
	const guard = new SubmissionGuard(() => {
		submitCount++;
	});

	// Set isSubmitting to true (parent is processing)
	guard.setIsSubmitting(true);

	// Submission should be blocked
	const result = guard.handleSubmit();
	t.false(result, 'Submission should be blocked when isSubmitting is true');
	t.is(submitCount, 0, 'onSubmit should not be called');
});

test('SubmissionGuard state management', t => {
	let submitCount = 0;
	const guard = new SubmissionGuard(() => {
		submitCount++;
	});

	// Initial state
	let state = guard.getState();
	t.false(state.isSubmitting, 'Initial isSubmitting should be false');
	t.false(state.localSubmitting, 'Initial localSubmitting should be false');
	t.false(state.submittingRef, 'Initial submittingRef should be false');

	// After submission
	guard.handleSubmit();
	state = guard.getState();
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
	guard.setIsSubmitting(false);
	state = guard.getState();
	t.false(state.isSubmitting, 'isSubmitting should be false after reset');
	t.false(state.localSubmitting, 'localSubmitting should be false after reset');
	t.false(state.submittingRef, 'submittingRef should be false after reset');
});

test('SubmissionGuard rapid fire submission simulation', t => {
	let submitCount = 0;
	const guard = new SubmissionGuard(() => {
		submitCount++;
	});

	// Simulate rapid clicking/key pressing (like what happened in the bug)
	const results = [];
	for (let i = 0; i < 10; i++) {
		results.push(guard.handleSubmit());
	}

	// Only the first one should succeed
	t.true(results[0], 'First submission should succeed');
	for (let i = 1; i < 10; i++) {
		t.false(results[i], `Submission ${i + 1} should be blocked`);
	}

	t.is(
		submitCount,
		1,
		'onSubmit should only be called once despite 10 attempts',
	);
});
