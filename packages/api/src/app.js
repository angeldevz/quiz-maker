require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { db, migrate } = require("./db");

function createApp() {
	const app = express();
	const API_TOKEN = process.env.API_TOKEN || "dev-token";

	migrate();

	app.use(cors());
	app.use(express.json({ limit: "1mb" }));

	// Simple bearer auth
	app.use((req, res, next) => {
		const auth = req.headers["authorization"] || "";
		const prefix = "Bearer ";
		if (!auth.startsWith(prefix)) {
			return res
				.status(401)
				.json({ error: "Missing or invalid Authorization header" });
		}
		const token = auth.slice(prefix.length).trim();
		if (token === "" || token !== API_TOKEN) {
			return res.status(401).json({ error: "Invalid token" });
		}
		next();
	});

	function nowISO() {
		return new Date().toISOString().replace("T", " ").replace("Z", "");
	}

	// Helpers
	function asQuiz(row) {
		return {
			id: row.id,
			title: row.title,
			description: row.description,
			timeLimitSeconds: row.time_limit_seconds ?? undefined,
			isPublished: !!row.is_published,
			createdAt: row.created_at,
		};
	}

	function asQuestion(row) {
		let options = undefined;
		if (row.options_json) {
			try {
				options = JSON.parse(row.options_json);
			} catch (e) {
				options = undefined;
			}
		}

		let correctAnswer = row.correct_answer ?? undefined;
		// For MCQ questions, try to convert string correctAnswer back to number if it's a valid index
		if (row.type === "mcq" && correctAnswer !== undefined) {
			const num = Number(correctAnswer);
			if (!Number.isNaN(num) && Number.isInteger(num) && num >= 0) {
				correctAnswer = num;
			}
		}

		return {
			id: row.id,
			quizId: row.quiz_id,
			type: row.type,
			prompt: row.prompt,
			options,
			correctAnswer,
			position: row.position,
		};
	}

	// Routes

	// List quizzes
	app.get("/quizzes", (req, res) => {
		try {
			const rows = db
				.prepare(`SELECT * FROM quizzes ORDER BY created_at DESC`)
				.all();
			res.json(rows.map(asQuiz));
		} catch (e) {
			console.error(e);
			res.status(500).json({ error: "Failed to list quizzes" });
		}
	});

	// Create quiz
	app.post("/quizzes", (req, res) => {
		try {
			const { title, description, timeLimitSeconds, isPublished } =
				req.body || {};
			if (!title || !description)
				return res
					.status(400)
					.json({ error: "title and description are required" });
			const stmt = db.prepare(
				`INSERT INTO quizzes (title, description, time_limit_seconds, is_published, created_at) VALUES (?,?,?,?,?)`,
			);
			const info = stmt.run(
				title,
				description,
				timeLimitSeconds ?? null,
				isPublished ? 1 : 0,
				nowISO(),
			);
			const row = db
				.prepare(`SELECT * FROM quizzes WHERE id=?`)
				.get(info.lastInsertRowid);
			res.status(201).json(asQuiz(row));
		} catch (e) {
			console.error(e);
			res.status(500).json({ error: "Failed to create quiz" });
		}
	});

	// Get quiz with questions (creator view)
	app.get("/quizzes/:id", (req, res) => {
		try {
			const id = Number(req.params.id);
			const quizRow = db.prepare(`SELECT * FROM quizzes WHERE id=?`).get(id);
			if (!quizRow) return res.status(404).json({ error: "Quiz not found" });
			const qRows = db
				.prepare(
					`SELECT * FROM questions WHERE quiz_id=? ORDER BY position ASC, id ASC`,
				)
				.all(id);
			res.json({ ...asQuiz(quizRow), questions: qRows.map(asQuestion) });
		} catch (e) {
			console.error(e);
			res.status(500).json({ error: "Failed to fetch quiz" });
		}
	});

	// Update quiz metadata
	app.patch("/quizzes/:id", (req, res) => {
		try {
			const id = Number(req.params.id);
			const quizRow = db.prepare(`SELECT * FROM quizzes WHERE id=?`).get(id);
			if (!quizRow) return res.status(404).json({ error: "Quiz not found" });

			const { title, description, timeLimitSeconds, isPublished } =
				req.body || {};
			const upd =
				db.prepare(`UPDATE quizzes SET title=COALESCE(?, title), description=COALESCE(?, description),
        time_limit_seconds=COALESCE(?, time_limit_seconds), is_published=COALESCE(?, is_published) WHERE id=?`);
			upd.run(
				title ?? null,
				description ?? null,
				timeLimitSeconds ?? null,
				isPublished === undefined ? null : isPublished ? 1 : 0,
				id,
			);
			const row = db.prepare(`SELECT * FROM quizzes WHERE id=?`).get(id);
			res.json(asQuiz(row));
		} catch (e) {
			console.error(e);
			res.status(500).json({ error: "Failed to update quiz" });
		}
	});

	// Create question
	app.post("/quizzes/:id/questions", (req, res) => {
		try {
			const quizId = Number(req.params.id);
			const quiz = db.prepare(`SELECT * FROM quizzes WHERE id=?`).get(quizId);
			if (!quiz) return res.status(404).json({ error: "Quiz not found" });

			const { type, prompt, options, correctAnswer, position } = req.body || {};
			if (!type || !prompt)
				return res.status(400).json({ error: "type and prompt are required" });
			if (!["mcq", "short", "code"].includes(type))
				return res.status(400).json({ error: "invalid type" });

			let optionsJson = null;
			let finalCorrectAnswer = correctAnswer;
			if (type === "mcq") {
				if (!Array.isArray(options) || options.length < 2)
					return res.status(400).json({ error: "mcq requires options (>=2)" });
				optionsJson = JSON.stringify(options);
				if (finalCorrectAnswer === undefined || finalCorrectAnswer === null)
					return res
						.status(400)
						.json({ error: "mcq requires correctAnswer (index or text)" });

				// Convert numeric correctAnswer to string, keep text as-is
				if (typeof finalCorrectAnswer === "number") {
					finalCorrectAnswer = String(finalCorrectAnswer);
				}
			} else if (type === "short") {
				// Allow empty string for correctAnswer
				if (
					finalCorrectAnswer === undefined ||
					(typeof finalCorrectAnswer !== "string" &&
						finalCorrectAnswer !== null)
				) {
					return res
						.status(400)
						.json({ error: "short requires correctAnswer (string)" });
				}
				// Normalize to empty string if null
				finalCorrectAnswer = finalCorrectAnswer ?? "";
			}

			// Use finalCorrectAnswer for database storage - no need to reassign

			const maxPos = db
				.prepare(
					`SELECT COALESCE(MAX(position), -1) as m FROM questions WHERE quiz_id=?`,
				)
				.get(quizId).m;
			const pos =
				position !== undefined && position !== null
					? Number(position)
					: maxPos + 1;

			const stmt =
				db.prepare(`INSERT INTO questions (quiz_id, type, prompt, options_json, correct_answer, position, created_at)
        VALUES (?,?,?,?,?,?,?)`);
			const info = stmt.run(
				quizId,
				type,
				prompt,
				optionsJson,
				finalCorrectAnswer ?? null,
				pos,
				nowISO(),
			);
			const row = db
				.prepare(`SELECT * FROM questions WHERE id=?`)
				.get(info.lastInsertRowid);
			res.status(201).json(asQuestion(row));
		} catch (e) {
			console.error(e);
			res.status(500).json({ error: "Failed to create question" });
		}
	});

	// Update question (including reordering)
	app.patch("/questions/:id", (req, res) => {
		try {
			const id = Number(req.params.id);
			const row0 = db.prepare(`SELECT * FROM questions WHERE id=?`).get(id);
			if (!row0) return res.status(404).json({ error: "Question not found" });

			const { type, prompt, options, correctAnswer, position } = req.body || {};

			if (type && !["mcq", "short", "code"].includes(type))
				return res.status(400).json({ error: "invalid type" });
			let optionsJson = row0.options_json;
			if (options !== undefined) {
				if (options !== null && !Array.isArray(options))
					return res
						.status(400)
						.json({ error: "options must be array or null" });
				optionsJson = options ? JSON.stringify(options) : null;
			}

			const stmt = db.prepare(`UPDATE questions
        SET type=COALESCE(?, type),
            prompt=COALESCE(?, prompt),
            options_json=?,
            correct_answer=COALESCE(?, correct_answer),
            position=COALESCE(?, position)
        WHERE id=?`);
			stmt.run(
				type ?? null,
				prompt ?? null,
				optionsJson,
				correctAnswer === undefined ? null : correctAnswer,
				position === undefined ? null : Number(position),
				id,
			);

			const row = db.prepare(`SELECT * FROM questions WHERE id=?`).get(id);
			res.json(asQuestion(row));
		} catch (e) {
			console.error(e);
			res.status(500).json({ error: "Failed to update question" });
		}
	});

	// Delete question
	app.delete("/questions/:id", (req, res) => {
		try {
			const id = Number(req.params.id);
			const info = db.prepare(`DELETE FROM questions WHERE id=?`).run(id);
			if (info.changes === 0)
				return res.status(404).json({ error: "Question not found" });
			res.status(204).end();
		} catch (e) {
			console.error(e);
			res.status(500).json({ error: "Failed to delete question" });
		}
	});

	// Start attempt
	app.post("/attempts", (req, res) => {
		try {
			const { quizId } = req.body || {};
			if (!quizId) return res.status(400).json({ error: "quizId required" });
			const quiz = db.prepare(`SELECT * FROM quizzes WHERE id=?`).get(quizId);
			if (!quiz) return res.status(404).json({ error: "Quiz not found" });
			if (!quiz.is_published)
				return res.status(400).json({ error: "Quiz is not published" });

			const ins = db.prepare(
				`INSERT INTO attempts (quiz_id, started_at) VALUES (?, datetime('now'))`,
			);
			const info = ins.run(quizId);
			const attemptId = info.lastInsertRowid;

			const qRows = db
				.prepare(
					`SELECT * FROM questions WHERE quiz_id=? ORDER BY position ASC, id ASC`,
				)
				.all(quizId);
			const sanitized = qRows.map((r) => {
				const q = asQuestion(r);
				delete q.correctAnswer; // hide answers in snapshot
				return q;
			});

			res.status(201).json({
				id: attemptId,
				quizId,
				startedAt: nowISO(),
				submittedAt: null,
				answers: [],
				quiz: {
					id: quiz.id,
					title: quiz.title,
					description: quiz.description,
					timeLimitSeconds: quiz.time_limit_seconds ?? undefined,
					questions: sanitized,
				},
			});
		} catch (e) {
			console.error(e);
			res.status(500).json({ error: "Failed to start attempt" });
		}
	});

	// Upsert answer
	app.post("/attempts/:id/answer", (req, res) => {
		try {
			const attemptId = Number(req.params.id);
			const { questionId, value } = req.body || {};
			if (!questionId || value === undefined || value === null)
				return res.status(400).json({ error: "questionId and value required" });

			const att = db
				.prepare(`SELECT * FROM attempts WHERE id=?`)
				.get(attemptId);
			if (!att) return res.status(404).json({ error: "Attempt not found" });
			if (att.submitted_at)
				return res.status(400).json({ error: "Attempt already submitted" });

			const q = db
				.prepare(`SELECT * FROM questions WHERE id=?`)
				.get(Number(questionId));
			if (!q) return res.status(404).json({ error: "Question not found" });
			if (q.quiz_id !== att.quiz_id)
				return res
					.status(400)
					.json({ error: "Question does not belong to this attempt's quiz" });

			db.prepare(`INSERT INTO attempt_answers (attempt_id, question_id, value) VALUES (?,?,?)
        ON CONFLICT(attempt_id, question_id) DO UPDATE SET value=excluded.value`).run(
				attemptId,
				Number(questionId),
				String(value),
			);

			res.status(200).json({ ok: true });
		} catch (e) {
			console.error(e);
			res.status(500).json({ error: "Failed to save answer" });
		}
	});

	// Submit attempt
	app.post("/attempts/:id/submit", (req, res) => {
		try {
			const attemptId = Number(req.params.id);
			const att = db
				.prepare(`SELECT * FROM attempts WHERE id=?`)
				.get(attemptId);
			if (!att) return res.status(404).json({ error: "Attempt not found" });
			if (att.submitted_at)
				return res.status(400).json({ error: "Attempt already submitted" });

			const qRows = db
				.prepare(
					`SELECT * FROM questions WHERE quiz_id=? ORDER BY position ASC, id ASC`,
				)
				.all(att.quiz_id);
			const ansRows = db
				.prepare(`SELECT * FROM attempt_answers WHERE attempt_id=?`)
				.all(attemptId);
			const ansMap = new Map(ansRows.map((a) => [a.question_id, a.value]));
			let score = 0;
			const details = [];

			const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");

			for (const r of qRows) {
				const q = asQuestion(r);
				const raw = ansMap.get(q.id);
				if (q.type === "mcq") {
					// Normalize correctAnswer to index
					let correctIdx = -1;
					try {
						// Try converting to number first
						const numCorrectAnswer = Number(q.correctAnswer);
						if (!Number.isNaN(numCorrectAnswer)) {
							correctIdx = numCorrectAnswer;
						} else {
							// If not a number, find the index by matching text
							correctIdx = q.options.findIndex(
								(opt) => norm(opt) === norm(q.correctAnswer),
							);
						}
					} catch (e) {
						correctIdx = -1;
					}

					const correctText =
						Array.isArray(q.options) &&
						Number.isInteger(correctIdx) &&
						correctIdx >= 0 &&
						q.options[correctIdx] !== undefined
							? q.options[correctIdx]
							: undefined;

					let isCorrect = false;
					if (raw !== undefined) {
						if (!Number.isNaN(Number(raw))) {
							isCorrect = Number(raw) === correctIdx;
						} else if (correctText !== undefined) {
							isCorrect = norm(raw) === norm(correctText);
						}
					}
					if (isCorrect) score += 1;
					details.push({
						questionId: q.id,
						correct: isCorrect,
						expected: correctText,
					});
				} else if (q.type === "short") {
					const expected = q.correctAnswer ?? "";
					const normalizedExpected = norm(expected);
					const normalizedRaw = norm(raw ?? "");
					const isCorrect = normalizedRaw === normalizedExpected;
					if (isCorrect) score += 1;
					details.push({ questionId: q.id, correct: isCorrect, expected });
				} else {
					// code: not auto-graded
					details.push({ questionId: q.id, correct: false });
				}
			}

			db.prepare(
				`UPDATE attempts SET submitted_at=datetime('now'), score=? WHERE id=?`,
			).run(score, attemptId);

			res.json({ score, details });
		} catch (e) {
			console.error(e);
			res.status(500).json({ error: "Failed to submit attempt" });
		}
	});

	// Track anti-cheat events
	app.post("/attempts/:id/events", (req, res) => {
		try {
			const attemptId = Number(req.params.id);
			const { event } = req.body || {};
			if (!event || typeof event !== "string")
				return res
					.status(400)
					.json({ error: "event is required and must be a string" });

			const att = db
				.prepare(`SELECT * FROM attempts WHERE id=?`)
				.get(attemptId);
			if (!att) return res.status(404).json({ error: "Attempt not found" });
			if (att.submitted_at)
				return res.status(400).json({ error: "Attempt already submitted" });

			db.prepare(
				`INSERT INTO attempt_events (attempt_id, event) VALUES (?, ?)`,
			).run(attemptId, event);

			res.status(201).json({ ok: true });
		} catch (e) {
			console.error(e);
			res.status(500).json({ error: "Failed to track event" });
		}
	});

	// 404
	app.use((req, res) => {
		res.status(404).json({ error: "Not found" });
	});

	return app;
}

module.exports = { createApp };
