"use client";
import {
  Box,
  Button,
  Card,
  FormHelperText,
  Slide,
  TextField,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createQuiz } from "../../api/quiz";
import { Quiz, QuizForm } from "../../types/quiz";
import { AddQuestion } from "./AddQuestion";
import { Summary } from "./Summary";

export function CreateQuiz() {
  const { handleSubmit, register } = useForm<QuizForm>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const mutation = useMutation({
    mutationFn: createQuiz,
    onSuccess: (data) => {
      setQuiz(data);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  function onSubmit(data: QuizForm) {
    mutation.mutate(data);
  }

  function finalize() {
    setShowSummary(true);
  }

  if (showSummary && quiz) {
    return <Summary quizId={quiz.id} />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexFlow: "column",
        gap: 4,
        justifyContent: "space-between",
      }}
    >
      <Slide in={!quiz} unmountOnExit>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card
            sx={{
              display: "flex",
              flexFlow: "column",
              gap: 4,
              p: 4,
              borderRadius: 4,
            }}
          >
            <TextField
              required
              label="Title"
              placeholder="Your quiz title"
              {...register("title")}
            />
            <TextField
              required
              label="Description"
              placeholder="Your quiz topic"
              {...register("description")}
            />
            <Button
              variant="contained"
              sx={{ alignSelf: "start" }}
              type="submit"
            >
              Create Questions
            </Button>
          </Card>
          <FormHelperText error={!!error}>{error}</FormHelperText>
        </form>
      </Slide>
      {quiz?.id && <AddQuestion quiz={quiz} finalize={finalize} />}
    </Box>
  );
}
