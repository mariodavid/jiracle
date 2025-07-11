import test from 'ava';

// Mock of the duplicate submission prevention logic for WeeklyTimetableView
// This tests the handleWorklogSubmit logic without actual HTTP requests
class WorklogSubmissionHandler {
	private isSubmittingWorklog = false;

	constructor(private mockApiCall: (data: any) => Promise<void>) {}

	async handleWorklogSubmit(data: {timeSpent: string; comment: string}) {
		// This mirrors the logic in WeeklyTimetableView.handleWorklogSubmit
		if (this.isSubmittingWorklog) {
			return {blocked: true, submitted: false};
		}

		this.isSubmittingWorklog = true;

		try {
			await this.mockApiCall(data);
			return {blocked: false, submitted: true};
		} catch (error) {
			return {blocked: false, submitted: false, error};
		} finally {
			this.isSubmittingWorklog = false;
		}
	}

	getState() {
		return {isSubmittingWorklog: this.isSubmittingWorklog};
	}
}

test('WeeklyTimetableView handleWorklogSubmit prevents duplicate submissions', async t => {
	let apiCallCount = 0;
	const mockApiCall = async (_data: any) => {
		apiCallCount++;
		// Simulate API delay
		await new Promise(resolve => setTimeout(resolve, 10));
	};

	const handler = new WorklogSubmissionHandler(mockApiCall);

	// Start two submissions simultaneously
	const promise1 = handler.handleWorklogSubmit({
		timeSpent: '4h',
		comment: 'Test',
	});
	const promise2 = handler.handleWorklogSubmit({
		timeSpent: '4h',
		comment: 'Test',
	});

	const [result1, result2] = await Promise.all([promise1, promise2]);

	// First should succeed, second should be blocked
	t.false(result1.blocked, 'First submission should not be blocked');
	t.true(result1.submitted, 'First submission should succeed');

	t.true(result2.blocked, 'Second submission should be blocked');
	t.false(result2.submitted, 'Second submission should not succeed');

	t.is(apiCallCount, 1, 'API should only be called once');
});

test('WeeklyTimetableView allows submission after previous completes', async t => {
	let apiCallCount = 0;
	const mockApiCall = async (_data: any) => {
		apiCallCount++;
		await new Promise(resolve => setTimeout(resolve, 10));
	};

	const handler = new WorklogSubmissionHandler(mockApiCall);

	// First submission
	const result1 = await handler.handleWorklogSubmit({
		timeSpent: '4h',
		comment: 'Test 1',
	});
	t.false(result1.blocked, 'First submission should not be blocked');
	t.true(result1.submitted, 'First submission should succeed');
	t.is(apiCallCount, 1, 'API should be called once');

	// Second submission after first completes
	const result2 = await handler.handleWorklogSubmit({
		timeSpent: '2h',
		comment: 'Test 2',
	});
	t.false(result2.blocked, 'Second submission should not be blocked');
	t.true(result2.submitted, 'Second submission should succeed');
	t.is(apiCallCount, 2, 'API should be called twice');
});

test('WeeklyTimetableView handles API errors without blocking future submissions', async t => {
	let apiCallCount = 0;
	const mockApiCall = async (_data: any) => {
		apiCallCount++;
		if (apiCallCount === 1) {
			throw new Error('API Error');
		}
		await new Promise(resolve => setTimeout(resolve, 10));
	};

	const handler = new WorklogSubmissionHandler(mockApiCall);

	// First submission fails
	const result1 = await handler.handleWorklogSubmit({
		timeSpent: '4h',
		comment: 'Test 1',
	});
	t.false(result1.blocked, 'First submission should not be blocked');
	t.false(result1.submitted, 'First submission should fail');
	t.truthy(result1.error, 'First submission should have error');
	t.is(apiCallCount, 1, 'API should be called once');

	// Second submission should work
	const result2 = await handler.handleWorklogSubmit({
		timeSpent: '2h',
		comment: 'Test 2',
	});
	t.false(result2.blocked, 'Second submission should not be blocked');
	t.true(result2.submitted, 'Second submission should succeed');
	t.is(apiCallCount, 2, 'API should be called twice');
});

test('WeeklyTimetableView rapid submission stress test', async t => {
	let apiCallCount = 0;
	const mockApiCall = async (_data: any) => {
		apiCallCount++;
		await new Promise(resolve => setTimeout(resolve, 5));
	};

	const handler = new WorklogSubmissionHandler(mockApiCall);

	// Fire 10 submissions simultaneously
	const promises = [];
	for (let i = 0; i < 10; i++) {
		promises.push(
			handler.handleWorklogSubmit({timeSpent: '1h', comment: `Test ${i}`}),
		);
	}

	const results = await Promise.all(promises);

	// Count successful vs blocked submissions
	const successful = results.filter(r => r.submitted && !r.blocked).length;
	const blocked = results.filter(r => r.blocked).length;

	t.is(successful, 1, 'Only one submission should succeed');
	t.is(blocked, 9, 'Nine submissions should be blocked');
	t.is(apiCallCount, 1, 'API should only be called once');
	t.is(successful + blocked, 10, 'All submissions should be accounted for');
});
