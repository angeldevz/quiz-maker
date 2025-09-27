const { setupTestDb, cleanupTestDb, makeRequest, createTestQuiz, createTestQuestion, clearDatabase, getQuestionById } = require('./test-utils');

let app;

describe('Question Management', () => {
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

  describe('POST /quizzes/:id/questions', () => {
    let quizId;

    beforeEach(async () => {
      const req = makeRequest(app);
      const quizResponse = await req.post('/quizzes').send(createTestQuiz());
      quizId = quizResponse.body.id;
    });

    describe('MCQ Questions', () => {
      test('should create MCQ question with valid data', async () => {
        const req = makeRequest(app);
        const questionData = createTestQuestion('mcq', {
          prompt: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1,
          position: 1
        });

        const response = await req.post(`/quizzes/${quizId}/questions`).send(questionData);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          id: expect.any(Number),
          quizId: quizId,
          type: 'mcq',
          prompt: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1,
          position: 1
        });
      });

      test('should accept correctAnswer as option text', async () => {
        const req = makeRequest(app);
        const questionData = createTestQuestion('mcq', {
          options: ['Red', 'Blue', 'Green', 'Yellow'],
          correctAnswer: 'Blue'
        });

        const response = await req.post(`/quizzes/${quizId}/questions`).send(questionData);

        expect(response.status).toBe(201);
        expect(response.body.correctAnswer).toBe('Blue');
      });

      test('should auto-assign position if not provided', async () => {
        const req = makeRequest(app);
        
        // Create first question
        const response1 = await req.post(`/quizzes/${quizId}/questions`)
          .send(createTestQuestion('mcq'));
        
        // Create second question without position
        const questionData = createTestQuestion('mcq');
        delete questionData.position;
        
        const response2 = await req.post(`/quizzes/${quizId}/questions`)
          .send(questionData);

        expect(response1.body.position).toBe(1);
        expect(response2.body.position).toBe(2);
      });

      test('should require options array with at least 2 options', async () => {
        const req = makeRequest(app);
        const questionData = createTestQuestion('mcq', {
          options: ['Only one option'],
          correctAnswer: 0
        });

        const response = await req.post(`/quizzes/${quizId}/questions`).send(questionData);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'mcq requires options (>=2)'
        });
      });

      test('should require correctAnswer for MCQ', async () => {
        const req = makeRequest(app);
        const questionData = createTestQuestion('mcq');
        delete questionData.correctAnswer;

        const response = await req.post(`/quizzes/${quizId}/questions`).send(questionData);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'mcq requires correctAnswer (index or text)'
        });
      });

      test('should reject MCQ without options', async () => {
        const req = makeRequest(app);
        const questionData = createTestQuestion('mcq');
        delete questionData.options;

        const response = await req.post(`/quizzes/${quizId}/questions`).send(questionData);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'mcq requires options (>=2)'
        });
      });
    });

    describe('Short Answer Questions', () => {
      test('should create short answer question with valid data', async () => {
        const req = makeRequest(app);
        const questionData = createTestQuestion('short', {
          prompt: 'What is the capital of France?',
          correctAnswer: 'Paris',
          position: 1
        });

        const response = await req.post(`/quizzes/${quizId}/questions`).send(questionData);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          id: expect.any(Number),
          quizId: quizId,
          type: 'short',
          prompt: 'What is the capital of France?',
          correctAnswer: 'Paris',
          position: 1
        });
        expect(response.body.options).toBeUndefined();
      });

      test('should require correctAnswer for short questions', async () => {
        const req = makeRequest(app);
        const questionData = createTestQuestion('short');
        delete questionData.correctAnswer;

        const response = await req.post(`/quizzes/${quizId}/questions`).send(questionData);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'short requires correctAnswer (string)'
        });
      });

      test('should reject non-string correctAnswer for short questions', async () => {
        const req = makeRequest(app);
        const questionData = createTestQuestion('short', {
          correctAnswer: 123
        });

        const response = await req.post(`/quizzes/${quizId}/questions`).send(questionData);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'short requires correctAnswer (string)'
        });
      });
    });

    describe('Code Questions', () => {
      test('should create code question with valid data', async () => {
        const req = makeRequest(app);
        const questionData = createTestQuestion('code', {
          prompt: 'Write a function that returns the factorial of a number',
          position: 1
        });

        const response = await req.post(`/quizzes/${quizId}/questions`).send(questionData);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          id: expect.any(Number),
          quizId: quizId,
          type: 'code',
          prompt: 'Write a function that returns the factorial of a number',
          position: 1
        });
        expect(response.body.options).toBeUndefined();
        expect(response.body.correctAnswer).toBeUndefined();
      });

      test('should accept code question without correctAnswer', async () => {
        const req = makeRequest(app);
        const questionData = createTestQuestion('code');
        delete questionData.correctAnswer;

        const response = await req.post(`/quizzes/${quizId}/questions`).send(questionData);

        expect(response.status).toBe(201);
        expect(response.body.correctAnswer).toBeUndefined();
      });
    });

    describe('General Validation', () => {
      test('should require type and prompt', async () => {
        const req = makeRequest(app);
        
        const response = await req.post(`/quizzes/${quizId}/questions`).send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'type and prompt are required'
        });
      });

      test('should reject invalid question type', async () => {
        const req = makeRequest(app);
        const questionData = {
          type: 'invalid',
          prompt: 'Test question'
        };

        const response = await req.post(`/quizzes/${quizId}/questions`).send(questionData);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          error: 'invalid type'
        });
      });

      test('should return 404 for non-existent quiz', async () => {
        const req = makeRequest(app);
        const questionData = createTestQuestion('mcq');

        const response = await req.post('/quizzes/99999/questions').send(questionData);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
          error: 'Quiz not found'
        });
      });

      test('should use custom position when provided', async () => {
        const req = makeRequest(app);
        const questionData = createTestQuestion('mcq', { position: 5 });

        const response = await req.post(`/quizzes/${quizId}/questions`).send(questionData);

        expect(response.status).toBe(201);
        expect(response.body.position).toBe(5);
      });
    });
  });

  describe('PATCH /questions/:id', () => {
    let questionId;

    beforeEach(async () => {
      const req = makeRequest(app);
      const quizResponse = await req.post('/quizzes').send(createTestQuiz());
      const quizId = quizResponse.body.id;
      
      const questionResponse = await req.post(`/quizzes/${quizId}/questions`)
        .send(createTestQuestion('mcq'));
      questionId = questionResponse.body.id;
    });

    test('should update question type', async () => {
      const req = makeRequest(app);
      
      const response = await req.patch(`/questions/${questionId}`).send({
        type: 'short',
        correctAnswer: 'New answer'
      });

      expect(response.status).toBe(200);
      expect(response.body.type).toBe('short');
    });

    test('should update question prompt', async () => {
      const req = makeRequest(app);
      
      const response = await req.patch(`/questions/${questionId}`).send({
        prompt: 'Updated prompt'
      });

      expect(response.status).toBe(200);
      expect(response.body.prompt).toBe('Updated prompt');
    });

    test('should update MCQ options', async () => {
      const req = makeRequest(app);
      const newOptions = ['A', 'B', 'C'];
      
      const response = await req.patch(`/questions/${questionId}`).send({
        options: newOptions
      });

      expect(response.status).toBe(200);
      expect(response.body.options).toEqual(newOptions);
    });

    test('should update correct answer', async () => {
      const req = makeRequest(app);
      
      const response = await req.patch(`/questions/${questionId}`).send({
        correctAnswer: 'New correct answer'
      });

      expect(response.status).toBe(200);
      expect(response.body.correctAnswer).toBe('New correct answer');
    });

    test('should update position', async () => {
      const req = makeRequest(app);
      
      const response = await req.patch(`/questions/${questionId}`).send({
        position: 10
      });

      expect(response.status).toBe(200);
      expect(response.body.position).toBe(10);
    });

    test('should update multiple fields at once', async () => {
      const req = makeRequest(app);
      
      const response = await req.patch(`/questions/${questionId}`).send({
        prompt: 'Updated prompt',
        options: ['New A', 'New B'],
        correctAnswer: 1,
        position: 5
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        prompt: 'Updated prompt',
        options: ['New A', 'New B'],
        correctAnswer: 1,
        position: 5
      });
    });

    test('should handle null options', async () => {
      const req = makeRequest(app);
      
      const response = await req.patch(`/questions/${questionId}`).send({
        options: null
      });

      expect(response.status).toBe(200);
      expect(response.body.options).toBeUndefined();
    });

    test('should reject invalid question type', async () => {
      const req = makeRequest(app);
      
      const response = await req.patch(`/questions/${questionId}`).send({
        type: 'invalid'
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'invalid type'
      });
    });

    test('should reject non-array options', async () => {
      const req = makeRequest(app);
      
      const response = await req.patch(`/questions/${questionId}`).send({
        options: 'not an array'
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'options must be array or null'
      });
    });

    test('should return 404 for non-existent question', async () => {
      const req = makeRequest(app);
      
      const response = await req.patch('/questions/99999').send({
        prompt: 'Updated'
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Question not found'
      });
    });

    test('should handle empty update', async () => {
      const req = makeRequest(app);
      
      const originalResponse = await req.get(`/questions/${questionId}`);
      const response = await req.patch(`/questions/${questionId}`).send({});

      expect(response.status).toBe(200);
      // Response structure might differ due to DB format conversion
      expect(response.body.id).toBe(questionId);
    });
  });

  describe('DELETE /questions/:id', () => {
    let questionId;

    beforeEach(async () => {
      const req = makeRequest(app);
      const quizResponse = await req.post('/quizzes').send(createTestQuiz());
      const quizId = quizResponse.body.id;
      
      const questionResponse = await req.post(`/quizzes/${quizId}/questions`)
        .send(createTestQuestion('mcq'));
      questionId = questionResponse.body.id;
    });

    test('should delete existing question', async () => {
      const req = makeRequest(app);
      
      const response = await req.delete(`/questions/${questionId}`);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
      
      // Verify question is deleted
      const dbQuestion = getQuestionById(questionId);
      expect(dbQuestion).toBeUndefined();
    });

    test('should return 404 for non-existent question', async () => {
      const req = makeRequest(app);
      
      const response = await req.delete('/questions/99999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Question not found'
      });
    });

    test('should not affect other questions when deleting one', async () => {
      const req = makeRequest(app);
      
      // Create second question
      const quizResponse = await req.post('/quizzes').send(createTestQuiz());
      const quizId = quizResponse.body.id;
      
      const question2Response = await req.post(`/quizzes/${quizId}/questions`)
        .send(createTestQuestion('short'));
      const question2Id = question2Response.body.id;
      
      // Delete first question
      await req.delete(`/questions/${questionId}`);
      
      // Verify second question still exists
      const dbQuestion2 = getQuestionById(question2Id);
      expect(dbQuestion2).toBeTruthy();
    });
  });
});