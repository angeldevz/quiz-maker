const { setupTestDb, cleanupTestDb, makeRequest, createTestQuiz, clearDatabase, getQuizById } = require('./test-utils');

let app;

describe('Quiz Management', () => {
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

  afterEach(() => {
    clearDatabase();
  });

  describe('GET /quizzes', () => {
    test('should return empty array when no quizzes exist', async () => {
      const req = makeRequest(app);
      const response = await req.get('/quizzes');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return all quizzes ordered by creation date desc', async () => {
      const req = makeRequest(app);
      
      // Create multiple quizzes
      await req.post('/quizzes').send(createTestQuiz({ title: 'First Quiz' }));
      await req.post('/quizzes').send(createTestQuiz({ title: 'Second Quiz' }));
      await req.post('/quizzes').send(createTestQuiz({ title: 'Third Quiz' }));
      
      const response = await req.get('/quizzes');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0].title).toBe('Third Quiz'); // Most recent first
      expect(response.body[1].title).toBe('Second Quiz');
      expect(response.body[2].title).toBe('First Quiz');
    });

    test('should return quizzes with correct structure', async () => {
      const req = makeRequest(app);
      const quizData = createTestQuiz({
        title: 'Test Quiz',
        description: 'Test Description',
        timeLimitSeconds: 600,
        isPublished: true
      });
      
      await req.post('/quizzes').send(quizData);
      const response = await req.get('/quizzes');
      
      expect(response.status).toBe(200);
      expect(response.body[0]).toMatchObject({
        id: expect.any(Number),
        title: 'Test Quiz',
        description: 'Test Description',
        timeLimitSeconds: 600,
        isPublished: true,
        createdAt: expect.any(String)
      });
    });
  });

  describe('POST /quizzes', () => {
    test('should create quiz with valid data', async () => {
      const req = makeRequest(app);
      const quizData = createTestQuiz();
      
      const response = await req.post('/quizzes').send(quizData);
      
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        title: quizData.title,
        description: quizData.description,
        timeLimitSeconds: quizData.timeLimitSeconds,
        isPublished: quizData.isPublished,
        createdAt: expect.any(String)
      });
      
      // Verify in database
      const dbQuiz = getQuizById(response.body.id);
      expect(dbQuiz).toBeTruthy();
      expect(dbQuiz.title).toBe(quizData.title);
    });

    test('should create quiz without optional fields', async () => {
      const req = makeRequest(app);
      const quizData = {
        title: 'Minimal Quiz',
        description: 'Just the basics'
      };
      
      const response = await req.post('/quizzes').send(quizData);
      
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        title: 'Minimal Quiz',
        description: 'Just the basics',
        isPublished: false
      });
      expect(response.body.timeLimitSeconds).toBeUndefined();
    });

    test('should reject quiz without title', async () => {
      const req = makeRequest(app);
      const quizData = { description: 'Missing title' };
      
      const response = await req.post('/quizzes').send(quizData);
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'title and description are required'
      });
    });

    test('should reject quiz without description', async () => {
      const req = makeRequest(app);
      const quizData = { title: 'Missing description' };
      
      const response = await req.post('/quizzes').send(quizData);
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'title and description are required'
      });
    });

    test('should handle empty request body', async () => {
      const req = makeRequest(app);
      
      const response = await req.post('/quizzes').send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'title and description are required'
      });
    });
  });

  describe('GET /quizzes/:id', () => {
    test('should return quiz with questions', async () => {
      const req = makeRequest(app);
      
      // Create quiz
      const quizResponse = await req.post('/quizzes').send(createTestQuiz());
      const quizId = quizResponse.body.id;
      
      // Add questions
      await req.post(`/quizzes/${quizId}/questions`).send({
        type: 'mcq',
        prompt: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1,
        position: 1
      });
      
      await req.post(`/quizzes/${quizId}/questions`).send({
        type: 'short',
        prompt: 'What is the capital of France?',
        correctAnswer: 'Paris',
        position: 2
      });
      
      const response = await req.get(`/quizzes/${quizId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: quizId,
        title: expect.any(String),
        description: expect.any(String),
        questions: expect.arrayContaining([
          expect.objectContaining({
            type: 'mcq',
            prompt: 'What is 2+2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: 1,
            position: 1
          }),
          expect.objectContaining({
            type: 'short',
            prompt: 'What is the capital of France?',
            correctAnswer: 'Paris',
            position: 2
          })
        ])
      });
      expect(response.body.questions).toHaveLength(2);
    });

    test('should return quiz without questions if none exist', async () => {
      const req = makeRequest(app);
      
      const quizResponse = await req.post('/quizzes').send(createTestQuiz());
      const quizId = quizResponse.body.id;
      
      const response = await req.get(`/quizzes/${quizId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.questions).toEqual([]);
    });

    test('should return 404 for non-existent quiz', async () => {
      const req = makeRequest(app);
      
      const response = await req.get('/quizzes/99999');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Quiz not found'
      });
    });

    test('should order questions by position then id', async () => {
      const req = makeRequest(app);
      
      const quizResponse = await req.post('/quizzes').send(createTestQuiz());
      const quizId = quizResponse.body.id;
      
      // Add questions with different positions
      await req.post(`/quizzes/${quizId}/questions`).send({
        type: 'short',
        prompt: 'Third question',
        correctAnswer: 'answer',
        position: 3
      });
      
      await req.post(`/quizzes/${quizId}/questions`).send({
        type: 'short',
        prompt: 'First question',
        correctAnswer: 'answer',
        position: 1
      });
      
      await req.post(`/quizzes/${quizId}/questions`).send({
        type: 'short',
        prompt: 'Second question',
        correctAnswer: 'answer',
        position: 2
      });
      
      const response = await req.get(`/quizzes/${quizId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.questions).toHaveLength(3);
      expect(response.body.questions[0].prompt).toBe('First question');
      expect(response.body.questions[1].prompt).toBe('Second question');
      expect(response.body.questions[2].prompt).toBe('Third question');
    });
  });

  describe('PATCH /quizzes/:id', () => {
    test('should update quiz title', async () => {
      const req = makeRequest(app);
      
      const quizResponse = await req.post('/quizzes').send(createTestQuiz());
      const quizId = quizResponse.body.id;
      
      const response = await req.patch(`/quizzes/${quizId}`).send({
        title: 'Updated Title'
      });
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
      expect(response.body.description).toBe(quizResponse.body.description); // Unchanged
    });

    test('should update quiz description', async () => {
      const req = makeRequest(app);
      
      const quizResponse = await req.post('/quizzes').send(createTestQuiz());
      const quizId = quizResponse.body.id;
      
      const response = await req.patch(`/quizzes/${quizId}`).send({
        description: 'Updated Description'
      });
      
      expect(response.status).toBe(200);
      expect(response.body.description).toBe('Updated Description');
      expect(response.body.title).toBe(quizResponse.body.title); // Unchanged
    });

    test('should update quiz time limit', async () => {
      const req = makeRequest(app);
      
      const quizResponse = await req.post('/quizzes').send(createTestQuiz());
      const quizId = quizResponse.body.id;
      
      const response = await req.patch(`/quizzes/${quizId}`).send({
        timeLimitSeconds: 1800
      });
      
      expect(response.status).toBe(200);
      expect(response.body.timeLimitSeconds).toBe(1800);
    });

    test('should update quiz published status', async () => {
      const req = makeRequest(app);
      
      const quizResponse = await req.post('/quizzes').send(createTestQuiz({ isPublished: false }));
      const quizId = quizResponse.body.id;
      
      const response = await req.patch(`/quizzes/${quizId}`).send({
        isPublished: true
      });
      
      expect(response.status).toBe(200);
      expect(response.body.isPublished).toBe(true);
    });

    test('should update multiple fields at once', async () => {
      const req = makeRequest(app);
      
      const quizResponse = await req.post('/quizzes').send(createTestQuiz());
      const quizId = quizResponse.body.id;
      
      const response = await req.patch(`/quizzes/${quizId}`).send({
        title: 'New Title',
        description: 'New Description',
        timeLimitSeconds: 900,
        isPublished: false
      });
      
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        title: 'New Title',
        description: 'New Description',
        timeLimitSeconds: 900,
        isPublished: false
      });
    });

    test('should return 404 for non-existent quiz', async () => {
      const req = makeRequest(app);
      
      const response = await req.patch('/quizzes/99999').send({
        title: 'Updated'
      });
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Quiz not found'
      });
    });

    test('should handle empty update', async () => {
      const req = makeRequest(app);
      
      const quizResponse = await req.post('/quizzes').send(createTestQuiz());
      const quizId = quizResponse.body.id;
      
      const response = await req.patch(`/quizzes/${quizId}`).send({});
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(quizResponse.body); // No changes
    });
  });
});