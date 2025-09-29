"use client";
import { Box, Button, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { initiateQuiz } from "@utils/api";
import { AnswerAttempt, AnswerForm, Attempt } from "@utils/quiz";
import { useAntiCheat } from "@utils/useAntiCheat";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorAlert } from "../../../components/ErrorAlert";
import { LoadingState } from "../../../components/LoadingState";
import { ShowQuestion } from "./ShowQuestion";
import { ShowSummary } from "./ShowSummary";

interface Props {
  quizId: number;
}
export function ShowQuiz({ quizId }: Props) {
  const cheatStats = useAntiCheat();
  const [attempt, setAttempt] = useState<Attempt>();
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [answers, setAnswers] = useState<AnswerAttempt[]>([]);
  const {
    isPending,
    mutate,
    error: apiError,
  } = useMutation({
    mutationKey: ["quiz-attempt", quizId],
    mutationFn: ({ quizId }: { quizId: number }) => initiateQuiz(quizId),
    onSuccess: (attempt) => {
      setAttempt(attempt);
      cheatStats.startTracking(attempt.id);
      if (attempt.quiz.questions.length === 0) {
        setError(new Error("There's no questions on the selected quiz."));
        return;
      }
    },
    onError: (error) => {
      setError(error);
    },
  });

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (apiError) {
      setError(apiError);
    }
  }, [isPending, apiError]);

  useEffect(() => {
    if (!quizId) {
      return;
    }

    mutate({ quizId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  function submitQuestion(answer: AnswerForm) {
    if (!attempt) {
      return;
    }

    const question = attempt.quiz.questions[questionIndex];
    setAnswers((prev) => [...prev, { ...question, ...answer }]);

    if (questionIndex < attempt.quiz.questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      cheatStats.stopTracking();
      setShowSummary(true);
    }
  }

  if (isPending) {
    return <LoadingState>Submitting the quiz...</LoadingState>;
  }

  if (showSummary && attempt) {
    return (
      <Box
        sx={{
          display: "flex",
          flexFlow: "column",
          gap: 2,
        }}
      >
        <ShowSummary
          attempt={attempt}
          answers={answers}
          cheatStats={cheatStats}
        />
        <Button LinkComponent={Link} href="/quiz-player">
          Take another exam
        </Button>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          flexFlow: "column",
          gap: 2,
        }}
      >
        <ErrorAlert
          error={error ?? new Error("There was a problem loading your quiz")}
        />
      </Box>
    );
  }

  if (!attempt) {
    return;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexFlow: "column",
        gap: 2,
      }}
    >
      <ErrorAlert error={error} />
      <Typography variant="h3">
        Quiz #{attempt.quiz.id} : {attempt.quiz.title}
      </Typography>
      <Typography variant="subtitle1">{attempt.quiz.description}</Typography>
      {attempt.quiz && (
        <ShowQuestion
          key={questionIndex}
          attemptId={attempt.id}
          question={attempt.quiz.questions[questionIndex]}
          submitQuestion={submitQuestion}
        />
      )}
    </Box>
  );
}
