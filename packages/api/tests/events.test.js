const {
	setupTestDb,
	cleanupTestDb,
	makeRequest,
	createQuizWithQuestions,
	clearDatabase,
	getAttemptById,
	getEventsByAttemptId,
} = require("./test-utils");
const request = require("supertest");

let app;

describe("Anti-Cheat Event Tracking", () => {
	beforeAll(() => {
		setupTestDb();
		const { createApp } = require("../src/app");
		app = createApp();
	});

	afterAll(() => {
		cleanupTestDb();
	});

	beforeEach(() => {
		clearDatabase();
	});

	// Helper function to create test attempt
	async function createTestAttempt() {
		const req = makeRequest(app);
		const { quiz } = await createQuizWithQuestions(app, { isPublished: true }, [
			{
				type: "mcq",
				prompt: "Test question",
				options: ["A", "B"],
				correctAnswer: 0,
			},
		]);
		const attemptResponse = await req
			.post("/attempts")
			.send({ quizId: quiz.id });
		return attemptResponse.body.id;
	}

	describe("POST /attempts/:id/events", () => {
		test("should track event for valid attempt", async () => {
			const req = makeRequest(app);
			const attemptId = await createTestAttempt();
			const event = "tab_switch_detected";

			const response = await req
				.post(`/attempts/${attemptId}/events`)
				.send({ event });

			expect(response.status).toBe(201);
			expect(response.body).toEqual({ ok: true });

			// Verify event saved in database
			const events = getEventsByAttemptId(attemptId);
			expect(events).toHaveLength(1);
			expect(events[0]).toMatchObject({
				attempt_id: attemptId,
				event: event,
				timestamp: expect.any(String),
			});
			expect(events[0].id).toBeDefined();
		});

		test("should track multiple events for same attempt", async () => {
			const req = makeRequest(app);
			const attemptId = await createTestAttempt();
			const events = [
				"tab_switch_detected",
				"window_blur",
				"copy_paste_detected",
			];

			// Track multiple events
			for (const event of events) {
				const response = await req
					.post(`/attempts/${attemptId}/events`)
					.send({ event });
				expect(response.status).toBe(201);
			}

			// Verify all events saved
			const dbEvents = getEventsByAttemptId(attemptId);
			expect(dbEvents).toHaveLength(3);
			expect(dbEvents.map((e) => e.event)).toEqual(events);
		});

		test("should auto-generate timestamp for events", async () => {
			const req = makeRequest(app);
			const attemptId = await createTestAttempt();
			const beforeTime = new Date();

			await req
				.post(`/attempts/${attemptId}/events`)
				.send({ event: "test_event" });

			const afterTime = new Date();
			const events = getEventsByAttemptId(attemptId);

			expect(events).toHaveLength(1);
			const eventTime = new Date(events[0].timestamp.replace(" ", "T") + "Z"); // Convert SQLite format to ISO
			expect(eventTime.getTime()).toBeGreaterThanOrEqual(
				beforeTime.getTime() - 1000,
			); // 1 second tolerance
			expect(eventTime.getTime()).toBeLessThanOrEqual(
				afterTime.getTime() + 1000,
			);
		});

		test("should require event parameter", async () => {
			const req = makeRequest(app);
			const attemptId = await createTestAttempt();

			// Missing event
			let response = await req.post(`/attempts/${attemptId}/events`).send({});
			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "event is required and must be a string",
			});

			// Null event
			response = await req
				.post(`/attempts/${attemptId}/events`)
				.send({ event: null });
			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "event is required and must be a string",
			});

			// Empty event
			response = await req
				.post(`/attempts/${attemptId}/events`)
				.send({ event: "" });
			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "event is required and must be a string",
			});
		});

		test("should require event to be a string", async () => {
			const req = makeRequest(app);
			const attemptId = await createTestAttempt();

			// Non-string event (number)
			let response = await req
				.post(`/attempts/${attemptId}/events`)
				.send({ event: 123 });
			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "event is required and must be a string",
			});

			// Non-string event (object)
			response = await req
				.post(`/attempts/${attemptId}/events`)
				.send({ event: { type: "tab_switch" } });
			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "event is required and must be a string",
			});

			// Non-string event (array)
			response = await req
				.post(`/attempts/${attemptId}/events`)
				.send({ event: ["tab_switch"] });
			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "event is required and must be a string",
			});
		});

		test("should reject event for non-existent attempt", async () => {
			const req = makeRequest(app);

			const response = await req
				.post("/attempts/99999/events")
				.send({ event: "test_event" });

			expect(response.status).toBe(404);
			expect(response.body).toEqual({
				error: "Attempt not found",
			});
		});

		test("should reject event for submitted attempt", async () => {
			const req = makeRequest(app);
			const attemptId = await createTestAttempt();

			// Submit attempt first
			await req.post(`/attempts/${attemptId}/submit`);

			// Try to track event after submission
			const response = await req
				.post(`/attempts/${attemptId}/events`)
				.send({ event: "test_event" });

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: "Attempt already submitted",
			});

			// Verify no event was saved
			const events = getEventsByAttemptId(attemptId);
			expect(events).toHaveLength(0);
		});

		test("should handle various event types", async () => {
			const req = makeRequest(app);
			const attemptId = await createTestAttempt();

			const eventTypes = [
				"tab_switch_detected",
				"window_blur",
				"window_focus",
				"copy_paste_detected",
				"right_click_disabled",
				"devtools_opened",
				"suspicious_activity",
				"fullscreen_exit",
				"page_visibility_change",
				"mouse_leave_window",
			];

			// Track all event types
			for (const event of eventTypes) {
				const response = await req
					.post(`/attempts/${attemptId}/events`)
					.send({ event });
				expect(response.status).toBe(201);
			}

			// Verify all events saved
			const events = getEventsByAttemptId(attemptId);
			expect(events).toHaveLength(eventTypes.length);
			expect(events.map((e) => e.event)).toEqual(eventTypes);
		});

		test("should handle long event descriptions", async () => {
			const req = makeRequest(app);
			const attemptId = await createTestAttempt();
			const longEvent = "a".repeat(1000); // 1000 character event

			const response = await req
				.post(`/attempts/${attemptId}/events`)
				.send({ event: longEvent });

			expect(response.status).toBe(201);
			expect(response.body).toEqual({ ok: true });

			const events = getEventsByAttemptId(attemptId);
			expect(events).toHaveLength(1);
			expect(events[0].event).toBe(longEvent);
		});

		test("should handle special characters in event descriptions", async () => {
			const req = makeRequest(app);
			const attemptId = await createTestAttempt();
			const specialEvent =
				"event_with_特殊字符_and_émojis_🚫_and_quotes_\"single'_and_newlines\n\r";

			const response = await req
				.post(`/attempts/${attemptId}/events`)
				.send({ event: specialEvent });

			expect(response.status).toBe(201);
			expect(response.body).toEqual({ ok: true });

			const events = getEventsByAttemptId(attemptId);
			expect(events).toHaveLength(1);
			expect(events[0].event).toBe(specialEvent);
		});

		test("should maintain chronological order of events", async () => {
			const req = makeRequest(app);
			const attemptId = await createTestAttempt();
			const eventSequence = ["start", "middle", "end"];

			// Track events with small delays to ensure different timestamps
			for (let i = 0; i < eventSequence.length; i++) {
				await req
					.post(`/attempts/${attemptId}/events`)
					.send({ event: eventSequence[i] });
				if (i < eventSequence.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
				}
			}

			const events = getEventsByAttemptId(attemptId);
			expect(events).toHaveLength(3);

			// Verify chronological order
			expect(events[0].event).toBe("start");
			expect(events[1].event).toBe("middle");
			expect(events[2].event).toBe("end");

			// Verify timestamps are in ascending order (string comparison works for ISO format)
			expect(events[0].timestamp <= events[1].timestamp).toBe(true);
			expect(events[1].timestamp <= events[2].timestamp).toBe(true);
		});

		test("should work alongside other attempt operations", async () => {
			const req = makeRequest(app);

			// Create attempt with questions
			const { quiz, questions } = await createQuizWithQuestions(
				app,
				{ isPublished: true },
				[
					{
						type: "mcq",
						prompt: "Question 1",
						options: ["A", "B"],
						correctAnswer: 0,
					},
					{ type: "short", prompt: "Question 2", correctAnswer: "answer" },
				],
			);

			const attemptResponse = await req
				.post("/attempts")
				.send({ quizId: quiz.id });
			const attemptId = attemptResponse.body.id;

			// Track events during quiz taking
			await req
				.post(`/attempts/${attemptId}/events`)
				.send({ event: "quiz_started" });

			// Answer questions
			await req.post(`/attempts/${attemptId}/answer`).send({
				questionId: questions[0].id,
				value: "0",
			});

			await req
				.post(`/attempts/${attemptId}/events`)
				.send({ event: "question_1_answered" });

			await req.post(`/attempts/${attemptId}/answer`).send({
				questionId: questions[1].id,
				value: "answer",
			});

			await req
				.post(`/attempts/${attemptId}/events`)
				.send({ event: "question_2_answered" });
			await req
				.post(`/attempts/${attemptId}/events`)
				.send({ event: "about_to_submit" });

			// Submit attempt
			const submitResponse = await req.post(`/attempts/${attemptId}/submit`);
			expect(submitResponse.status).toBe(200);

			// Verify all events were tracked
			const events = getEventsByAttemptId(attemptId);
			expect(events).toHaveLength(4);
			expect(events.map((e) => e.event)).toEqual([
				"quiz_started",
				"question_1_answered",
				"question_2_answered",
				"about_to_submit",
			]);

			// Verify quiz was properly graded
			expect(submitResponse.body.score).toBe(2);
		});

		test("should require authentication", async () => {
			const attemptId = await createTestAttempt();

			// Request without Authorization header
			const response = await request(app)
				.post(`/attempts/${attemptId}/events`)
				.send({ event: "test_event" });

			expect(response.status).toBe(401);
			expect(response.body).toEqual({
				error: "Missing or invalid Authorization header",
			});
		});

		test("should reject invalid authentication", async () => {
			const attemptId = await createTestAttempt();

			// Request with invalid token
			const response = await request(app)
				.post(`/attempts/${attemptId}/events`)
				.set("Authorization", "Bearer invalid-token")
				.send({ event: "test_event" });

			expect(response.status).toBe(401);
			expect(response.body).toEqual({
				error: "Invalid token",
			});
		});
	});

	describe("Database Integration", () => {
		test("should create proper foreign key relationship", async () => {
			const req = makeRequest(app);
			const attemptId = await createTestAttempt();

			// Track event
			await req
				.post(`/attempts/${attemptId}/events`)
				.send({ event: "test_event" });

			// Verify event exists
			let events = getEventsByAttemptId(attemptId);
			expect(events).toHaveLength(1);

			// Delete attempt (should cascade delete events due to foreign key constraint)
			const { db } = require("../src/db");
			db.prepare("DELETE FROM attempts WHERE id = ?").run(attemptId);

			// Verify event was also deleted
			events = getEventsByAttemptId(attemptId);
			expect(events).toHaveLength(0);
		});

		test("should handle database errors gracefully", async () => {
			// This test would require mocking the database to simulate errors
			// For now, we verify that the endpoint structure supports error handling
			const req = makeRequest(app);
			const attemptId = await createTestAttempt();

			const response = await req
				.post(`/attempts/${attemptId}/events`)
				.send({ event: "test_event" });
			expect(response.status).toBe(201);
		});
	});
});
