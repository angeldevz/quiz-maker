"use client";
import { Box } from "@mui/material";
import { useState } from "react";
import { QuizList } from "./QuizList";
import { ShowQuestions } from "./ShowQuestions";

export function TakeAQuiz() {
  const [quizId, setQuizId] = useState<number>();

  return (
    <Box sx={{ width: "100%" }}>
      {quizId ? (
        <ShowQuestions quizId={quizId} />
      ) : (
        <QuizList setQuizId={setQuizId} />
      )}
    </Box>
  );
}
