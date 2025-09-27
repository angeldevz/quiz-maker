import { Question, Quiz, QuizForm } from "../types/quiz";
import api from "../utils/axios";

export async function getQuizzes(): Promise<Quiz[]> {
  return await api.get("/quizzes");
}

export async function getQuizzById(id: number): Promise<Quiz> {
  return await api.get(`/quizzes/${id}`);
}

export async function createQuiz({ title, description }: QuizForm) {
  return await api.post("/quizzes", {
    title,
    description,
    timeLimitSeconds: 300,
    isPublished: true,
  });
}

export async function createQuestions(id: number, question: Question) {
  return await api.post(`/quizzes/${id}/questions`, question);
}
