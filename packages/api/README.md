# Quiz Maker API (Node.js + SQLite)

This is a **drop-in backend** you can give to candidates for the Quiz Maker take-home. It exposes the endpoints from the brief and stores data in a local SQLite file (`data.sqlite`).

## Quick start

```bash
# 1) Install deps
npm i

# 2) Copy env and customize if needed
cp .env.example .env

# 3) Initialize DB with schema + sample data
npm run seed

# 4) Start the server
npm run dev    # or: npm start
```

By default the API runs on **http://localhost:4000** and requires `Authorization: Bearer ${API_TOKEN}` on every request.

- Default token (from `.env.example`): `dev-token`
- Set your own in `.env` → `API_TOKEN=your-secret`

## Endpoints (contract used by the take-home)

**Entities**
- `Quiz` → `{ id, title, description, timeLimitSeconds?, isPublished, createdAt }`
- `Question` → `{ id, quizId, type: 'mcq'|'short'|'code', prompt, options?[], correctAnswer? , position }`
- `Attempt` → `{ id, quizId, startedAt, submittedAt?, answers: Array<{questionId, value}>, score? }`

**Routes**

- `GET /quizzes` → list quizzes (creator use)
- `POST /quizzes` → create
- `GET /quizzes/:id` → quiz + questions (includes `correctAnswer` for creator views)
- `PATCH /quizzes/:id` → update metadata
- `POST /quizzes/:id/questions` → create question
- `PATCH /questions/:id` → update (incl. `position` for reordering)
- `DELETE /questions/:id` → delete
- `POST /attempts` **body:** `{ quizId }` → start attempt (returns attempt + **sanitized** quiz snapshot without `correctAnswer`)
- `POST /attempts/:id/answer` **body:** `{ questionId, value }` → upsert answer
- `POST /attempts/:id/submit` → returns graded result `{ score, details: Array<{questionId, correct, expected?}> }`

> Auto-grading covers **MCQ** and **short**; **code** prompts are not auto-graded and do not affect `score`.

### Notes
- **Auth:** All routes require `Authorization: Bearer <API_TOKEN>`.
- **Order:** Questions are ordered by `position ASC`. To reorder, `PATCH /questions/:id` with a new `position` (simple numeric ordering; collisions are tolerated).
- **MCQ answers:** The taker can send either the selected **option index** or the **option text**. The grader accepts both.
- **Short answer:** Comparison is case-insensitive and whitespace-normalized.
- **Code prompts:** Stored and returned but not scored.
- **Errors:** JSON errors with shape `{ error: string }` and proper HTTP status codes.

---

## Dev tips
- SQLite file is created at project root (`data.sqlite`).
- Re-run `npm run seed` to reset the sample data.
- Feel free to change the CORS origin in `src/server.js`.
