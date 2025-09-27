const { db, migrate } = require('./db');

function main() {
  migrate();

  // Clear all tables
  db.exec(`DELETE FROM attempt_answers; DELETE FROM attempts; DELETE FROM questions; DELETE FROM quizzes;`);

  // Insert a sample quiz
  const insertQuiz = db.prepare(`INSERT INTO quizzes (title, description, time_limit_seconds, is_published) VALUES (?,?,?,?)`);
  const info = insertQuiz.run('JavaScript Basics', 'A tiny quiz on core JS', 300, 1);
  const quizId = info.lastInsertRowid;

  // Insert questions with positions
  const insertQ = db.prepare(`
    INSERT INTO questions (quiz_id, type, prompt, options_json, correct_answer, position)
    VALUES (?,?,?,?,?,?)
  `);

  // MCQ
  insertQ.run(
    quizId,
    'mcq',
    'Which of the following is NOT a primitive type in JavaScript?',
    JSON.stringify(['string', 'number', 'boolean', 'array']),
    '3', // index of 'array'
    0
  );

  // Short
  insertQ.run(
    quizId,
    'short',
    'What keyword declares a block-scoped variable introduced in ES6?',
    null,
    'let',
    1
  );

  // Code
  insertQ.run(
    quizId,
    'code',
    'Write a function `sum(a,b)` that returns a + b.',
    null,
    null,
    2
  );

  console.log(`Seeded quiz ${quizId} with 3 questions.`);
}

main();
