import { Question, Quiz, QuizForm } from "@utils/quiz";
import { AxiosError } from "axios";
import api from "./axios";

interface MyErrorData {
  error: string;
}

export async function getQuizzes(): Promise<Quiz[]> {
  try {
    return await api.get("/quizzes");
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      const err = error as AxiosError<MyErrorData>;
      throw new Error(err.response?.data.error);
    }

    throw new Error("An unexpected error occurred");
  }
}

export async function getQuizzById(id: number): Promise<Quiz> {
  try {
    return await api.get(`/quizzes/${id}`);
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      const err = error as AxiosError<MyErrorData>;
      throw new Error(err.response?.data.error);
    }

    throw new Error("An unexpected error occurred");
  }
}

export async function createQuiz({ title, description }: QuizForm) {
  try {
    return await api.post("/quizzes", {
      title,
      description,
    });
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      const err = error as AxiosError<MyErrorData>;
      throw new Error(err.response?.data.error);
    }

    throw new Error("An unexpected error occurred");
  }
}

export async function createQuestions(id: number, question: Question) {
  return await api.post(`/quizzes/${id}/questions`, question);
}
