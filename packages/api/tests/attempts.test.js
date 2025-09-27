const { setupTestDb, cleanupTestDb, makeRequest, createQuizWithQuestions, clearDatabase, getAttemptById, getAnswersByAttemptId } = require('./test-utils');

let app;

describe('Quiz Attempts', () => {
  beforeAll(() => {
    setupTestDb();
    const { createApp } = require('../src/app');
    app = createApp();
  });

  afterAll(() => {
    cleanupTestDb();
  });

  beforeEach(() => {
    clearDatabase();
  });

  describe('POST /attempts', () => {
    test('should start attempt for published quiz', async () => {
      const req = makeRequest(app);
      
      const { quiz } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [
          { type: 'mcq', prompt: 'Question 1', options: ['A', 'B'], correctAnswer: 0 },
          { type: 'short', prompt: 'Question 2', correctAnswer: 'answer' }
        ]
      );

      const response = await req.post('/attempts').send({ quizId: quiz.id });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        quizId: quiz.id,
        startedAt: expect.any(String),
        submittedAt: null,
        answers: [],
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          questions: expect.arrayContaining([
            expect.objectContaining({
              type: 'mcq',
              prompt: 'Question 1',
              options: ['A', 'B']
            }),
            expect.objectContaining({
              type: 'short',
              prompt: 'Question 2'
            })
          ])
        }
      });

      // Verify correct answers are hidden
      response.body.quiz.questions.forEach(question => {
        expect(question.correctAnswer).toBeUndefined();
      });
    });

    test('should reject attempt for unpublished quiz', async () => {
      const req = makeRequest(app);
      
      const { quiz } = await createQuizWithQuestions(app, { isPublished: false }, []);

      const response = await req.post('/attempts').send({ quizId: quiz.id });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Quiz is not published'
      });
    });

    test('should reject attempt for non-existent quiz', async () => {
      const req = makeRequest(app);

      const response = await req.post('/attempts').send({ quizId: 99999 });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Quiz not found'
      });
    });

    test('should require quizId', async () => {
      const req = makeRequest(app);

      const response = await req.post('/attempts').send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'quizId required'
      });
    });

    test('should order questions by position in attempt snapshot', async () => {
      const req = makeRequest(app);
      
      const { quiz } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [
          { type: 'short', prompt: 'Third', correctAnswer: 'answer', position: 3 },
          { type: 'short', prompt: 'First', correctAnswer: 'answer', position: 1 },
          { type: 'short', prompt: 'Second', correctAnswer: 'answer', position: 2 }
        ]
      );

      const response = await req.post('/attempts').send({ quizId: quiz.id });

      expect(response.status).toBe(201);
      expect(response.body.quiz.questions).toHaveLength(3);
      expect(response.body.quiz.questions[0].prompt).toBe('First');
      expect(response.body.quiz.questions[1].prompt).toBe('Second');
      expect(response.body.quiz.questions[2].prompt).toBe('Third');
    });

    test('should create attempt record in database', async () => {
      const req = makeRequest(app);
      
      const { quiz } = await createQuizWithQuestions(app, { isPublished: true }, []);

      const response = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = response.body.id;

      const dbAttempt = getAttemptById(attemptId);
      expect(dbAttempt).toBeTruthy();
      expect(dbAttempt.quiz_id).toBe(quiz.id);
      expect(dbAttempt.submitted_at).toBeNull();
      expect(dbAttempt.score).toBeNull();
    });
  });

  describe('POST /attempts/:id/answer', () => {
    let attemptId, questionId;

    beforeEach(async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ type: 'mcq', prompt: 'Test question', options: ['A', 'B'], correctAnswer: 0 }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      attemptId = attemptResponse.body.id;
      questionId = questions[0].id;
    });

    test('should save answer for valid attempt and question', async () => {
      const req = makeRequest(app);

      const response = await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questionId,
        value: 'Test answer'
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });

      // Verify answer saved in database
      const answers = getAnswersByAttemptId(attemptId);
      expect(answers).toHaveLength(1);
      expect(answers[0]).toMatchObject({
        attempt_id: attemptId,
        question_id: questionId,
        value: 'Test answer'
      });
    });

    test('should update existing answer (upsert)', async () => {
      const req = makeRequest(app);

      // Save initial answer
      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questionId,
        value: 'First answer'
      });

      // Update answer
      const response = await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questionId,
        value: 'Updated answer'
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });

      // Verify only one answer exists with updated value
      const answers = getAnswersByAttemptId(attemptId);
      expect(answers).toHaveLength(1);
      expect(answers[0].value).toBe('Updated answer');
    });

    test('should require questionId and value', async () => {
      const req = makeRequest(app);

      // Missing questionId
      let response = await req.post(`/attempts/${attemptId}/answer`).send({
        value: 'answer'
      });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'questionId and value required'
      });

      // Missing value
      response = await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questionId
      });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'questionId and value required'
      });

      // Null value
      response = await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questionId,
        value: null
      });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'questionId and value required'
      });
    });

    test('should reject answer for non-existent attempt', async () => {
      const req = makeRequest(app);

      const response = await req.post('/attempts/99999/answer').send({
        questionId: questionId,
        value: 'answer'
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Attempt not found'
      });
    });

    test('should reject answer for non-existent question', async () => {
      const req = makeRequest(app);

      const response = await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: 99999,
        value: 'answer'
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Question not found'
      });
    });

    test('should reject answer for question not in quiz', async () => {
      const req = makeRequest(app);
      
      // Create different quiz with question
      const { questions: otherQuestions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ type: 'short', prompt: 'Other question', correctAnswer: 'answer' }]
      );

      const response = await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: otherQuestions[0].id,
        value: 'answer'
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Question does not belong to this attempt\'s quiz'
      });
    });

    test('should reject answer for submitted attempt', async () => {
      const req = makeRequest(app);

      // Submit attempt first
      await req.post(`/attempts/${attemptId}/submit`);

      const response = await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questionId,
        value: 'answer'
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Attempt already submitted'
      });
    });

    test('should convert value to string', async () => {
      const req = makeRequest(app);

      const response = await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questionId,
        value: 123
      });

      expect(response.status).toBe(200);

      const answers = getAnswersByAttemptId(attemptId);
      expect(answers[0].value).toBe('123');
    });
  });

  describe('POST /attempts/:id/submit', () => {
    test('should submit attempt and calculate score', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [
          { type: 'mcq', prompt: 'MCQ Question', options: ['A', 'B', 'C'], correctAnswer: 1 },
          { type: 'short', prompt: 'Short Question', correctAnswer: 'correct answer' },
          { type: 'code', prompt: 'Code Question' }
        ]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      // Answer questions
      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[0].id,
        value: '1' // Correct MCQ answer (index)
      });

      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[1].id,
        value: 'Correct Answer' // Correct short answer (case insensitive)
      });

      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[2].id,
        value: 'def factorial(n): return 1 if n <= 1 else n * factorial(n-1)'
      });

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        score: 2, // MCQ + short answer correct, code not auto-graded
        details: [
          { questionId: questions[0].id, correct: true, expected: 'B' },
          { questionId: questions[1].id, correct: true, expected: 'correct answer' },
          { questionId: questions[2].id, correct: false } // Code not graded
        ]
      });

      // Verify attempt is marked as submitted in database
      const dbAttempt = getAttemptById(attemptId);
      expect(dbAttempt.submitted_at).not.toBeNull();
      expect(dbAttempt.score).toBe(2);
    });

    test('should handle attempt with no answers', async () => {
      const req = makeRequest(app);
      
      const { quiz } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ type: 'mcq', prompt: 'Question', options: ['A', 'B'], correctAnswer: 0 }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(0);
      expect(response.body.details).toHaveLength(1);
      expect(response.body.details[0].correct).toBe(false);
    });

    test('should reject submission of already submitted attempt', async () => {
      const req = makeRequest(app);
      
      const { quiz } = await createQuizWithQuestions(app, { isPublished: true }, []);

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      // Submit once
      await req.post(`/attempts/${attemptId}/submit`);

      // Try to submit again
      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Attempt already submitted'
      });
    });

    test('should reject submission for non-existent attempt', async () => {
      const req = makeRequest(app);

      const response = await req.post('/attempts/99999/submit');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Attempt not found'
      });
    });

    test('should process questions in correct order', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [
          { type: 'short', prompt: 'Third', correctAnswer: 'answer', position: 3 },
          { type: 'short', prompt: 'First', correctAnswer: 'answer', position: 1 },
          { type: 'short', prompt: 'Second', correctAnswer: 'answer', position: 2 }
        ]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.details).toHaveLength(3);
      
      // Find question IDs by prompt to verify order
      const firstQuestion = questions.find(q => q.prompt === 'First');
      const secondQuestion = questions.find(q => q.prompt === 'Second');
      const thirdQuestion = questions.find(q => q.prompt === 'Third');
      
      expect(response.body.details[0].questionId).toBe(firstQuestion.id);
      expect(response.body.details[1].questionId).toBe(secondQuestion.id);
      expect(response.body.details[2].questionId).toBe(thirdQuestion.id);
    });
  });
});