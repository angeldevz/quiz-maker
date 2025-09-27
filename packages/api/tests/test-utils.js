const request = require("supertest");
const fs = require("fs");
const path = require("path");

const TEST_DB_PATH = path.join(__dirname, "..", "test.sqlite");
const API_TOKEN = "test-token";

// Test database setup
function setupTestDb() {
	// Remove existing test db
	if (fs.existsSync(TEST_DB_PATH)) {
		fs.unlinkSync(TEST_DB_PATH);
	}

	// Set test environment variables
	process.env.API_TOKEN = API_TOKEN;

	// Since we're using better-sqlite3 which creates the file automatically,
	// we just need to ensure the test environment is set up properly
}

function cleanupTestDb() {
	if (fs.existsSync(TEST_DB_PATH)) {
		fs.unlinkSync(TEST_DB_PATH);
	}
	if (fs.existsSync("data.sqlite")) {
		fs.unlinkSync("data.sqlite");
	}
	if (fs.existsSync("test.sqlite")) {
		fs.unlinkSync("test.sqlite");
	}
}

// Helper to make authenticated requests
function makeRequest(app) {
	return {
		get: (url) =>
			request(app).get(url).set("Authorization", `Bearer ${API_TOKEN}`),
		post: (url) =>
			request(app).post(url).set("Authorization", `Bearer ${API_TOKEN}`),
		patch: (url) =>
			request(app).patch(url).set("Authorization", `Bearer ${API_TOKEN}`),
		delete: (url) =>
			request(app).delete(url).set("Authorization", `Bearer ${API_TOKEN}`),
	};
}

// Test data factories
function createTestQuiz(overrides = {}) {
	return {
		title: "Test Quiz",
		description: "A test quiz for testing purposes",
		timeLimitSeconds: 300,
		isPublished: true,
		...overrides,
	};
}

function createTestQuestion(type = "mcq", overrides = {}) {
	const baseQuestion = {
		type,
		prompt: `Test ${type} question`,
		position: 1,
		...overrides,
	};

	switch (type) {
		case "mcq":
			return {
				...baseQuestion,
				options: ["Option A", "Option B", "Option C", "Option D"],
				correctAnswer: 0,
				...overrides,
			};
		case "short":
			return {
				...baseQuestion,
				correctAnswer: "test answer",
				...overrides,
			};
		case "code":
			return {
				...baseQuestion,
				prompt: "Write a function that returns the sum of two numbers",
				...overrides,
			};
		default:
			return baseQuestion;
	}
}

async function createQuizWithQuestions(app, quizData = {}, questionsData = []) {
	const req = makeRequest(app);

	// Create quiz
	const quizResponse = await req
		.post("/quizzes")
		.send(createTestQuiz(quizData));
	const quiz = quizResponse.body;

	// Create questions
	const questions = [];
	for (const questionData of questionsData) {
		const questionResponse = await req
			.post(`/quizzes/${quiz.id}/questions`)
			.send(createTestQuestion(questionData.type || "mcq", questionData));
		questions.push(questionResponse.body);
	}

	return { quiz, questions };
}

async function startTestAttempt(app, quizId) {
	const req = makeRequest(app);
	const response = await req.post("/attempts").send({ quizId });
	return response.body;
}

// Database helpers
function clearDatabase() {
	const { db } = require("../src/db");
	db.prepare("DELETE FROM attempt_events").run();
	db.prepare("DELETE FROM attempt_answers").run();
	db.prepare("DELETE FROM attempts").run();
	db.prepare("DELETE FROM questions").run();
	db.prepare("DELETE FROM quizzes").run();
}

function getQuizById(id) {
	const { db } = require("../src/db");
	return db.prepare("SELECT * FROM quizzes WHERE id = ?").get(id);
}

function getQuestionById(id) {
	const { db } = require("../src/db");
	return db.prepare("SELECT * FROM questions WHERE id = ?").get(id);
}

function getAttemptById(id) {
	const { db } = require("../src/db");
	return db.prepare("SELECT * FROM attempts WHERE id = ?").get(id);
}

function getAnswersByAttemptId(attemptId) {
	const { db } = require("../src/db");
	return db
		.prepare("SELECT * FROM attempt_answers WHERE attempt_id = ?")
		.all(attemptId);
}

function getEventsByAttemptId(attemptId) {
	const { db } = require("../src/db");
	return db
		.prepare(
			"SELECT * FROM attempt_events WHERE attempt_id = ? ORDER BY timestamp ASC",
		)
		.all(attemptId);
}

module.exports = {
	setupTestDb,
	cleanupTestDb,
	makeRequest,
	createTestQuiz,
	createTestQuestion,
	createQuizWithQuestions,
	startTestAttempt,
	clearDatabase,
	getQuizById,
	getQuestionById,
	getAttemptById,
	getAnswersByAttemptId,
	getEventsByAttemptId,
	API_TOKEN,
};
