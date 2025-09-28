"use client";
import {
  Box,
  Button,
  Card,
  FormHelperText,
  Slide,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { createQuiz } from "@utils/api";
import { Quiz, QuizForm } from "@utils/quiz";
import { normalize } from "@utils/text";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CreateQuestions } from "./CreateQuestions";

export function CreateQuiz() {
  const { handleSubmit, register } = useForm<QuizForm>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    const normalizedData = {
      title: normalize(data.title),
      description: normalize(data.description),
    };

    if (!normalizedData.title || !normalizedData.description) {
      setError("Title and description are required to create a quiz.");
      return;
    }
    mutation.mutate(normalizedData);
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
      {quiz?.id && (
        <Box
          sx={{
            display: "flex",
            flexFlow: "column",
            gap: 2,
          }}
        >
          <Typography variant="h4">
            #{quiz.id}: {quiz.title}
          </Typography>
          <Typography variant="subtitle2">{quiz.description}</Typography>
          <CreateQuestions quiz={quiz} />
        </Box>
      )}
    </Box>
  );
}
