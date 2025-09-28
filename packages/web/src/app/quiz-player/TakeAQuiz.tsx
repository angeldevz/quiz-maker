"use client";
import { Alert, Box } from "@mui/material";
import { useState } from "react";
import { QuizList } from "./QuizList";
import { ShowQuestions } from "./ShowQuestions";

export function TakeAQuiz() {
  const [quizId, setQuizId] = useState<number | null>();
  const [error, setError] = useState<Error | null>(null);

  function takeAnotherExam() {
    setQuizId(null);
  }

  return (
    <Box sx={{ display: "flex", flexFlow: "column", gap: 4 }}>
      {error && (
        <Alert variant="filled" color="error">
          {error.message}
        </Alert>
      )}
      {quizId ? (
        <ShowQuestions
          quizId={quizId}
          takeAnotherExam={takeAnotherExam}
          setError={setError}
        />
      ) : (
        <QuizList setQuizId={setQuizId} setError={setError} />
      )}
    </Box>
  );
}
