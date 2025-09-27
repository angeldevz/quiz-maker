const { setupTestDb, cleanupTestDb, makeRequest, createTestQuiz, createTestQuestion, clearDatabase } = require('./test-utils');

let app;

describe('Integration Tests - Complete Workflows', () => {
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

  describe('Quiz Creation to Completion Workflow', () => {
    test('should handle complete quiz creation and taking workflow', async () => {
      const req = makeRequest(app);

      // Step 1: Create a quiz
      const quizData = createTestQuiz({
        title: 'Complete Integration Test Quiz',
        description: 'A comprehensive quiz for testing the full workflow',
        timeLimitSeconds: 1800,
        isPublished: false // Start unpublished
      });

      const quizResponse = await req.post('/quizzes').send(quizData);
      expect(quizResponse.status).toBe(201);
      const quizId = quizResponse.body.id;

      // Step 2: Add various types of questions
      const mcqQuestionResponse = await req.post(`/quizzes/${quizId}/questions`).send({
        type: 'mcq',
        prompt: 'What is the capital of Japan?',
        options: ['Tokyo', 'Osaka', 'Kyoto', 'Hiroshima'],
        correctAnswer: 0,
        position: 1
      });
      expect(mcqQuestionResponse.status).toBe(201);

      const shortQuestionResponse = await req.post(`/quizzes/${quizId}/questions`).send({
        type: 'short',
        prompt: 'What does HTTP stand for?',
        correctAnswer: 'HyperText Transfer Protocol',
        position: 2
      });
      expect(shortQuestionResponse.status).toBe(201);

      const codeQuestionResponse = await req.post(`/quizzes/${quizId}/questions`).send({
        type: 'code',
        prompt: 'Write a function that reverses a string',
        position: 3
      });
      expect(codeQuestionResponse.status).toBe(201);

      // Step 3: Update quiz details
      const updatedQuizResponse = await req.patch(`/quizzes/${quizId}`).send({
        title: 'Updated Integration Test Quiz',
        timeLimitSeconds: 2400
      });
      expect(updatedQuizResponse.status).toBe(200);
      expect(updatedQuizResponse.body.title).toBe('Updated Integration Test Quiz');

      // Step 4: Try to start attempt on unpublished quiz (should fail)
      let attemptResponse = await req.post('/attempts').send({ quizId });
      expect(attemptResponse.status).toBe(400);
      expect(attemptResponse.body.error).toBe('Quiz is not published');

      // Step 5: Publish the quiz
      const publishResponse = await req.patch(`/quizzes/${quizId}`).send({
        isPublished: true
      });
      expect(publishResponse.status).toBe(200);
      expect(publishResponse.body.isPublished).toBe(true);

      // Step 6: Start attempt on published quiz
      attemptResponse = await req.post('/attempts').send({ quizId });
      expect(attemptResponse.status).toBe(201);
      const attemptId = attemptResponse.body.id;

      // Verify attempt structure
      expect(attemptResponse.body).toMatchObject({
        id: attemptId,
        quizId: quizId,
        submittedAt: null,
        answers: [],
        quiz: {
          title: 'Updated Integration Test Quiz',
          timeLimitSeconds: 2400,
          questions: expect.arrayContaining([
            expect.objectContaining({ type: 'mcq', position: 1 }),
            expect.objectContaining({ type: 'short', position: 2 }),
            expect.objectContaining({ type: 'code', position: 3 })
          ])
        }
      });

      // Verify correct answers are hidden
      attemptResponse.body.quiz.questions.forEach(q => {
        expect(q.correctAnswer).toBeUndefined();
      });

      // Step 7: Answer questions
      const mcqQuestionId = mcqQuestionResponse.body.id;
      const shortQuestionId = shortQuestionResponse.body.id;
      const codeQuestionId = codeQuestionResponse.body.id;

      // Answer MCQ correctly
      let answerResponse = await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: mcqQuestionId,
        value: '0' // Tokyo
      });
      expect(answerResponse.status).toBe(200);

      // Answer short question correctly
      answerResponse = await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: shortQuestionId,
        value: 'HyperText Transfer Protocol'
      });
      expect(answerResponse.status).toBe(200);

      // Answer code question
      answerResponse = await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: codeQuestionId,
        value: 'function reverse(str) { return str.split("").reverse().join(""); }'
      });
      expect(answerResponse.status).toBe(200);

      // Step 8: Update an answer
      answerResponse = await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: shortQuestionId,
        value: 'hypertext transfer protocol' // Different case
      });
      expect(answerResponse.status).toBe(200);

      // Step 9: Submit attempt
      const submitResponse = await req.post(`/attempts/${attemptId}/submit`);
      expect(submitResponse.status).toBe(200);
      expect(submitResponse.body).toMatchObject({
        score: 2, // MCQ + Short correct, Code not auto-graded
        details: [
          { questionId: mcqQuestionId, correct: true, expected: 'Tokyo' },
          { questionId: shortQuestionId, correct: true, expected: 'HyperText Transfer Protocol' },
          { questionId: codeQuestionId, correct: false } // Code not graded
        ]
      });

      // Step 10: Verify attempt cannot be modified after submission
      const postSubmitAnswerResponse = await req.post(`/attempts/${attemptId}/answer`).send({
        questionId: mcqQuestionId,
        value: '1'
      });
      expect(postSubmitAnswerResponse.status).toBe(400);
      expect(postSubmitAnswerResponse.body.error).toBe('Attempt already submitted');

      // Step 11: Verify cannot submit again
      const doubleSubmitResponse = await req.post(`/attempts/${attemptId}/submit`);
      expect(doubleSubmitResponse.status).toBe(400);
      expect(doubleSubmitResponse.body.error).toBe('Attempt already submitted');
    });

    test('should handle quiz with question reordering', async () => {
      const req = makeRequest(app);

      // Create quiz
      const quizResponse = await req.post('/quizzes').send(createTestQuiz({ isPublished: true }));
      const quizId = quizResponse.body.id;

      // Add questions out of order
      const q3Response = await req.post(`/quizzes/${quizId}/questions`).send({
        type: 'short',
        prompt: 'Third question',
        correctAnswer: 'third',
        position: 3
      });

      const q1Response = await req.post(`/quizzes/${quizId}/questions`).send({
        type: 'short',
        prompt: 'First question',
        correctAnswer: 'first',
        position: 1
      });

      const q2Response = await req.post(`/quizzes/${quizId}/questions`).send({
        type: 'short',
        prompt: 'Second question',
        correctAnswer: 'second',
        position: 2
      });

      // Reorder a question
      await req.patch(`/questions/${q3Response.body.id}`).send({
        position: 0 // Move to beginning
      });

      // Get quiz and verify order
      const quizDetailResponse = await req.get(`/quizzes/${quizId}`);
      expect(quizDetailResponse.status).toBe(200);
      
      const questions = quizDetailResponse.body.questions;
      expect(questions[0].prompt).toBe('Third question'); // Position 0
      expect(questions[1].prompt).toBe('First question');  // Position 1
      expect(questions[2].prompt).toBe('Second question'); // Position 2

      // Start attempt and verify question order
      const attemptResponse = await req.post('/attempts').send({ quizId });
      const attemptQuestions = attemptResponse.body.quiz.questions;
      
      expect(attemptQuestions[0].prompt).toBe('Third question');
      expect(attemptQuestions[1].prompt).toBe('First question');
      expect(attemptQuestions[2].prompt).toBe('Second question');
    });

    test('should handle question deletion during quiz construction', async () => {
      const req = makeRequest(app);

      // Create quiz
      const quizResponse = await req.post('/quizzes').send(createTestQuiz());
      const quizId = quizResponse.body.id;

      // Add multiple questions
      const q1Response = await req.post(`/quizzes/${quizId}/questions`).send(
        createTestQuestion('mcq', { prompt: 'Question 1' })
      );

      const q2Response = await req.post(`/quizzes/${quizId}/questions`).send(
        createTestQuestion('short', { prompt: 'Question 2' })
      );

      const q3Response = await req.post(`/quizzes/${quizId}/questions`).send(
        createTestQuestion('code', { prompt: 'Question 3' })
      );

      // Delete middle question
      const deleteResponse = await req.delete(`/questions/${q2Response.body.id}`);
      expect(deleteResponse.status).toBe(204);

      // Verify quiz only has 2 questions
      const quizDetailResponse = await req.get(`/quizzes/${quizId}`);
      expect(quizDetailResponse.body.questions).toHaveLength(2);
      expect(quizDetailResponse.body.questions.map(q => q.prompt)).toEqual([
        'Question 1', 'Question 3'
      ]);

      // Publish and attempt the quiz
      await req.patch(`/quizzes/${quizId}`).send({ isPublished: true });
      
      const attemptResponse = await req.post('/attempts').send({ quizId });
      expect(attemptResponse.body.quiz.questions).toHaveLength(2);
    });
  });

  describe('Multiple Attempts and Users Simulation', () => {
    test('should handle multiple concurrent attempts on same quiz', async () => {
      const req = makeRequest(app);

      // Create and publish quiz
      const { quiz, questions } = await createQuizWithQuestions(req, 
        { isPublished: true },
        [
          { type: 'mcq', prompt: 'MCQ Question', options: ['A', 'B'], correctAnswer: 0 },
          { type: 'short', prompt: 'Short Question', correctAnswer: 'answer' }
        ]
      );

      // Start multiple attempts
      const attempt1Response = await req.post('/attempts').send({ quizId: quiz.id });
      const attempt2Response = await req.post('/attempts').send({ quizId: quiz.id });
      const attempt3Response = await req.post('/attempts').send({ quizId: quiz.id });

      const attempt1Id = attempt1Response.body.id;
      const attempt2Id = attempt2Response.body.id;
      const attempt3Id = attempt3Response.body.id;

      // Answer differently for each attempt
      // Attempt 1: All correct
      await req.post(`/attempts/${attempt1Id}/answer`).send({
        questionId: questions[0].id,
        value: '0'
      });
      await req.post(`/attempts/${attempt1Id}/answer`).send({
        questionId: questions[1].id,
        value: 'answer'
      });

      // Attempt 2: Partially correct
      await req.post(`/attempts/${attempt2Id}/answer`).send({
        questionId: questions[0].id,
        value: '1' // Wrong
      });
      await req.post(`/attempts/${attempt2Id}/answer`).send({
        questionId: questions[1].id,
        value: 'answer'
      });

      // Attempt 3: No answers (leave empty)

      // Submit all attempts
      const submit1Response = await req.post(`/attempts/${attempt1Id}/submit`);
      const submit2Response = await req.post(`/attempts/${attempt2Id}/submit`);
      const submit3Response = await req.post(`/attempts/${attempt3Id}/submit`);

      // Verify scores
      expect(submit1Response.body.score).toBe(2); // All correct
      expect(submit2Response.body.score).toBe(1); // Partial
      expect(submit3Response.body.score).toBe(0); // No answers
    });

    async function createQuizWithQuestions(req, quizData, questionsData) {
      const quizResponse = await req.post('/quizzes').send(createTestQuiz(quizData));
      const quiz = quizResponse.body;
      
      const questions = [];
      for (const questionData of questionsData) {
        const questionResponse = await req.post(`/quizzes/${quiz.id}/questions`)
          .send(createTestQuestion(questionData.type, questionData));
        questions.push(questionResponse.body);
      }
      
      return { quiz, questions };
    }
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle 404 routes gracefully', async () => {
      const req = makeRequest(app);

      const response = await req.get('/nonexistent');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Not found'
      });
    });

    test('should handle malformed JSON in requests', async () => {
      const request = require('supertest');
      
      const response = await request(app)
        .post('/quizzes')
        .set('Authorization', `Bearer test-token`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });

    test('should handle very large request body within limits', async () => {
      const req = makeRequest(app);

      // Create a large but valid question with long prompt
      const largePrompt = 'A'.repeat(10000); // 10KB prompt
      
      const quizResponse = await req.post('/quizzes').send(createTestQuiz());
      const quizId = quizResponse.body.id;

      const questionResponse = await req.post(`/quizzes/${quizId}/questions`).send({
        type: 'code',
        prompt: largePrompt
      });

      expect(questionResponse.status).toBe(201);
      expect(questionResponse.body.prompt).toBe(largePrompt);
    });

    test('should maintain data consistency during rapid operations', async () => {
      const req = makeRequest(app);

      // Create quiz
      const quizResponse = await req.post('/quizzes').send(createTestQuiz({ isPublished: true }));
      const quizId = quizResponse.body.id;

      // Add question
      const questionResponse = await req.post(`/quizzes/${quizId}/questions`).send(
        createTestQuestion('short', { correctAnswer: 'test' })
      );
      const questionId = questionResponse.body.id;

      // Rapid fire operations
      const operations = [
        req.post('/attempts').send({ quizId }),
        req.post('/attempts').send({ quizId }),
        req.patch(`/questions/${questionId}`).send({ correctAnswer: 'updated' }),
        req.post('/attempts').send({ quizId })
      ];

      const results = await Promise.all(operations);
      
      // All operations should succeed
      results.forEach((result, index) => {
        if (index === 2) { // PATCH operation
          expect(result.status).toBe(200);
        } else { // POST /attempts operations
          expect(result.status).toBe(201);
        }
      });
    });
  });
});