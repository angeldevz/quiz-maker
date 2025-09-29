import { AnswerForm, Question, Quiz, QuizForm } from "@utils/quiz";
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

export async function publishQuiz(quizId: number) {
  try {
    return await api.patch(`/quizzes/${quizId}`, {
      isPublished: true,
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
  try {
    return await api.post(`/quizzes/${id}/questions`, question);
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      const err = error as AxiosError<MyErrorData>;
      throw new Error(err.response?.data.error);
    }

    throw new Error("An unexpected error occurred");
  }
}

export async function initiateQuiz(quizId: number) {
  try {
    return await api.post(`/attempts`, { quizId });
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      const err = error as AxiosError<MyErrorData>;
      throw new Error(err.response?.data.error);
    }

    throw new Error("An unexpected error occurred");
  }
}

export async function submitAnswer(quizId: number, answer: AnswerForm) {
  try {
    return await api.post(`/attempts/${quizId}/answer`, answer);
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      const err = error as AxiosError<MyErrorData>;
      throw new Error(err.response?.data.error);
    }

    throw new Error("An unexpected error occurred");
  }
}

export async function submitQuiz(quizId: number, attempId: number) {
  try {
    return await api.post(`/attempts/${attempId}/submit`, { quizId });
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      const err = error as AxiosError<MyErrorData>;
      throw new Error(err.response?.data.error);
    }

    throw new Error("An unexpected error occurred");
  }
}

export async function logEvent(attempId: number, event: string) {
  try {
    return await api.post(`/attempts/${attempId}/events`, { event });
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      const err = error as AxiosError<MyErrorData>;
      throw new Error(err.response?.data.error);
    }

    throw new Error("An unexpected error occurred");
  }
}
