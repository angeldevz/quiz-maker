const { setupTestDb, cleanupTestDb, makeRequest, createQuizWithQuestions, clearDatabase } = require('./test-utils');

let app;

describe('Auto-grading System', () => {
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

  describe('MCQ Question Grading', () => {
    test('should correctly grade MCQ with numeric index answer', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ 
          type: 'mcq', 
          prompt: 'What is 2+2?', 
          options: ['3', '4', '5', '6'], 
          correctAnswer: 1 // Index of '4'
        }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      // Test correct answer by index
      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[0].id,
        value: '1'
      });

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(1);
      expect(response.body.details[0]).toMatchObject({
        questionId: questions[0].id,
        correct: true,
        expected: '4'
      });
    });

    test('should correctly grade MCQ with text answer', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ 
          type: 'mcq', 
          prompt: 'What color is the sky?', 
          options: ['Red', 'Blue', 'Green', 'Yellow'], 
          correctAnswer: 1
        }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      // Test correct answer by option text
      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[0].id,
        value: 'Blue'
      });

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(1);
      expect(response.body.details[0]).toMatchObject({
        questionId: questions[0].id,
        correct: true,
        expected: 'Blue'
      });
    });

    test('should handle case-insensitive text matching for MCQ', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ 
          type: 'mcq', 
          prompt: 'Select the programming language', 
          options: ['JavaScript', 'Python', 'Java'], 
          correctAnswer: 0
        }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      // Test with different case
      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[0].id,
        value: 'JAVASCRIPT'
      });

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(1);
      expect(response.body.details[0].correct).toBe(true);
    });

    test('should handle whitespace normalization for MCQ text', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ 
          type: 'mcq', 
          prompt: 'Choose the correct answer', 
          options: ['Option A', 'Option B', 'Option C'], 
          correctAnswer: 1
        }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      // Test with extra whitespace
      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[0].id,
        value: '  option   b  '
      });

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(1);
      expect(response.body.details[0].correct).toBe(true);
    });

    test('should mark incorrect MCQ answers as wrong', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ 
          type: 'mcq', 
          prompt: 'What is 5+5?', 
          options: ['8', '9', '10', '11'], 
          correctAnswer: 2
        }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      // Wrong index
      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[0].id,
        value: '0'
      });

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(0);
      expect(response.body.details[0]).toMatchObject({
        questionId: questions[0].id,
        correct: false,
        expected: '10'
      });
    });

    test('should handle MCQ with correctAnswer as text', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ 
          type: 'mcq', 
          prompt: 'Best programming language?', 
          options: ['C++', 'JavaScript', 'Python'], 
          correctAnswer: 'Python' // Text instead of index
        }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      // Answer with index
      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[0].id,
        value: '2'
      });

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(1);
      expect(response.body.details[0].correct).toBe(true);
    });

    test('should handle unanswered MCQ questions', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ 
          type: 'mcq', 
          prompt: 'Unanswered question', 
          options: ['A', 'B', 'C'], 
          correctAnswer: 0
        }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      // Don't answer the question
      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(0);
      expect(response.body.details[0]).toMatchObject({
        questionId: questions[0].id,
        correct: false,
        expected: 'A'
      });
    });
  });

  describe('Short Answer Question Grading', () => {
    test('should correctly grade exact match short, async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ 
          type: 'short', 
          prompt: 'What is the capital of France?', 
          correctAnswer: 'Paris'
        }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[0].id,
        value: 'Paris'
      });

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(1);
      expect(response.body.details[0]).toMatchObject({
        questionId: questions[0].id,
        correct: true,
        expected: 'Paris'
      });
    });

    test('should handle case-insensitive short answer matching', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ 
          type: 'short', 
          prompt: 'Name a programming language', 
          correctAnswer: 'JavaScript'
        }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[0].id,
        value: 'JAVASCRIPT'
      });

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(1);
      expect(response.body.details[0].correct).toBe(true);
    });

    test('should handle whitespace normalization for short answers', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ 
          type: 'short', 
          prompt: 'What is machine learning?', 
          correctAnswer: 'artificial intelligence'
        }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[0].id,
        value: '  artificial    intelligence  '
      });

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(1);
      expect(response.body.details[0].correct).toBe(true);
    });

    test('should mark incorrect short answers as wrong', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ 
          type: 'short', 
          prompt: 'What is 10 + 10?', 
          correctAnswer: '20'
        }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[0].id,
        value: '30'
      });

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(0);
      expect(response.body.details[0]).toMatchObject({
        questionId: questions[0].id,
        correct: false,
        expected: '20'
      });
    });

    test('should handle unanswered short answer questions', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ 
          type: 'short', 
          prompt: 'Unanswered short question', 
          correctAnswer: 'answer'
        }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(0);
      expect(response.body.details[0]).toMatchObject({
        questionId: questions[0].id,
        correct: false,
        expected: 'answer'
      });
    });

    test('should handle empty correct answer', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ 
          type: 'short', 
          prompt: 'Empty answer question', 
          correctAnswer: ''
        }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[0].id,
        value: ''
      });

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(1);
      expect(response.body.details[0].correct).toBe(true);
    });
  });

  describe('Code Question Grading', () => {
    test('should not auto-grade code questions', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ 
          type: 'code', 
          prompt: 'Write a function that adds two numbers'
        }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[0].id,
        value: 'function add(a, b) { return a + b; }'
      });

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(0); // Code questions don't contribute to score
      expect(response.body.details[0]).toMatchObject({
        questionId: questions[0].id,
        correct: false // Always false for code questions
      });
      expect(response.body.details[0].expected).toBeUndefined();
    });

    test('should handle unanswered code questions', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [{ 
          type: 'code', 
          prompt: 'Write a recursive factorial function'
        }]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(0);
      expect(response.body.details[0]).toMatchObject({
        questionId: questions[0].id,
        correct: false
      });
    });
  });

  describe('Mixed Question Types Grading', () => {
    test('should correctly calculate score for mixed question types', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [
          { type: 'mcq', prompt: 'MCQ 1', options: ['A', 'B'], correctAnswer: 0 },
          { type: 'mcq', prompt: 'MCQ 2', options: ['X', 'Y'], correctAnswer: 1 },
          { type: 'short', prompt: 'Short 1', correctAnswer: 'answer1' },
          { type: 'short', prompt: 'Short 2', correctAnswer: 'answer2' },
          { type: 'code', prompt: 'Code 1' },
          { type: 'code', prompt: 'Code 2' }
        ]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      // Answer some correctly, some incorrectly
      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[0].id,
        value: '0' // Correct
      });

      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[1].id,
        value: '0' // Incorrect (should be 1)
      });

      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[2].id,
        value: 'answer1' // Correct
      });

      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[3].id,
        value: 'wrong' // Incorrect
      });

      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[4].id,
        value: 'some code' // Code - not graded
      });

      // Leave code question 2 unanswered

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(2); // 1 MCQ + 1 short correct
      expect(response.body.details).toHaveLength(6);
      
      expect(response.body.details[0].correct).toBe(true);  // MCQ 1
      expect(response.body.details[1].correct).toBe(false); // MCQ 2
      expect(response.body.details[2].correct).toBe(true);  // Short 1
      expect(response.body.details[3].correct).toBe(false); // Short 2
      expect(response.body.details[4].correct).toBe(false); // Code 1
      expect(response.body.details[5].correct).toBe(false); // Code 2
    });

    test('should handle quiz with only code questions', async () => {
      const req = makeRequest(app);
      
      const { quiz, questions } = await createQuizWithQuestions(app, 
        { isPublished: true }, 
        [
          { type: 'code', prompt: 'Code Question 1' },
          { type: 'code', prompt: 'Code Question 2' }
        ]
      );

      const attemptResponse = await req.post('/attempts').send({ quizId: quiz.id });
      const attemptId = attemptResponse.body.id;

      await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: questions[0].id,
        value: 'print("Hello World")'
      });

      const response = await req.post(`/attempts/${attemptId}/submit`);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(0); // No auto-gradable questions
      expect(response.body.details).toHaveLength(2);
      expect(response.body.details.every(d => d.correct === false)).toBe(true);
    });
  });
});