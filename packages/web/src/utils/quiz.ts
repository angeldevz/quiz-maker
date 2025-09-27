export type QuizType = "mcq" | "short";

export interface BaseQuestion {
  id: number;
  type: QuizType;
  prompt: string;
  code?: string;
  correctAnswer: string;
}

export interface MultipleChoice extends BaseQuestion {
  type: "mcq";
  options: string[];
}

export interface ShortAnswer extends BaseQuestion {
  type: "short";
}

export type Question = MultipleChoice | ShortAnswer;

// to fix the react-hook-form register issue

export interface Quiz {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

export interface QuizForm {
  title: string;
  description: string;
}

export type QuestionForm = {
  type: QuizType;
  prompt: string;
  correctAnswer: string;
  code?: string;
  options?: string[];
};
