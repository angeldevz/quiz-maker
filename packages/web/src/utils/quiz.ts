export type QuizType = "mcq" | "short" | "code";

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

export interface CodeSnippet extends BaseQuestion {
  type: "code";
}

export type Question = MultipleChoice | ShortAnswer | CodeSnippet;

export interface Quiz {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

export interface Attempt {
  id: number;
  quiz: Quiz;
}

export interface QuizForm {
  title: string;
  description: string;
}

export type QuestionForm = {
  type: QuizType;
  prompt: string;
  correctAnswer: string;
  options?: string[];
};

export type AnswerForm = {
  questionId: number;
  value: string;
};

export type AnswerAttempt = Question & AnswerForm;
