const request = require("supertest");
const { setupTestDb, cleanupTestDb, API_TOKEN } = require("./test-utils");

let app;

describe("Authentication", () => {
	beforeAll(() => {
		setupTestDb();
		const { createApp } = require("../src/app");
		app = createApp();
	});

	afterAll(() => {
		cleanupTestDb();
	});

	describe("Bearer Token Authentication", () => {
		test("should reject requests without Authorization header", async () => {
			const response = await request(app).get("/quizzes");

			expect(response.status).toBe(401);
			expect(response.body).toEqual({
				error: "Missing or invalid Authorization header",
			});
		});

		test("should reject requests with malformed Authorization header", async () => {
			const response = await request(app)
				.get("/quizzes")
				.set("Authorization", "InvalidFormat");

			expect(response.status).toBe(401);
			expect(response.body).toEqual({
				error: "Missing or invalid Authorization header",
			});
		});

		test("should reject requests with invalid token", async () => {
			const response = await request(app)
				.get("/quizzes")
				.set("Authorization", "Bearer invalid-token");

			expect(response.status).toBe(401);
			expect(response.body).toEqual({
				error: "Invalid token",
			});
		});

		test("should accept requests with valid token", async () => {
			const response = await request(app)
				.get("/quizzes")
				.set("Authorization", `Bearer ${API_TOKEN}`);

			expect(response.status).toBe(200);
			expect(Array.isArray(response.body)).toBe(true);
		});

		test("should handle Bearer token with extra whitespace", async () => {
			const response = await request(app)
				.get("/quizzes")
				.set("Authorization", `Bearer   ${API_TOKEN}   `);

			expect(response.status).toBe(200);
		});

		test("should reject empty Bearer token", async () => {
			const response = await request(app)
				.get("/quizzes")
				.set("Authorization", "Bearer ");
			// "Bearer " will be trimmed to "Bearer"

			expect(response.status).toBe(401);
			expect(response.body).toEqual({
				error: "Missing or invalid Authorization header",
			});
		});
	});

	describe("All endpoints require authentication", () => {
		const endpoints = [
			{ method: "get", path: "/quizzes" },
			{ method: "post", path: "/quizzes" },
			{ method: "get", path: "/quizzes/1" },
			{ method: "patch", path: "/quizzes/1" },
			{ method: "post", path: "/quizzes/1/questions" },
			{ method: "patch", path: "/questions/1" },
			{ method: "delete", path: "/questions/1" },
			{ method: "post", path: "/attempts" },
			{ method: "post", path: "/attempts/1/answer" },
			{ method: "post", path: "/attempts/1/submit" },
		];

		endpoints.forEach(({ method, path }) => {
			test(`${method.toUpperCase()} ${path} should require authentication`, async () => {
				const response = await request(app)[method](path);
				expect(response.status).toBe(401);
			});
		});
	});
});
