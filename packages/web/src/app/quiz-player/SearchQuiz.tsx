"use client";
import { Box, Button, FormControl, TextField, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getQuizzById } from "@utils/api";
import { Quiz } from "@utils/quiz";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ErrorAlert } from "../../components/ErrorAlert";
import { LoadingState } from "../../components/LoadingState";

interface FormProps {
  quizId: number;
}

export function SearchQuiz() {
  const router = useRouter();
  const { handleSubmit, register } = useForm<FormProps>();

  const [quizId, setQuizId] = useState<number>();
  const [error, setError] = useState<Error | null>(null);

  const {
    data,
    isLoading,
    error: apiError,
    isEnabled,
  } = useQuery<Quiz>({
    queryKey: ["quiz", quizId],
    queryFn: ({ queryKey }) => {
      const [_, id] = queryKey as [string, number];
      return getQuizzById(id);
    },
    retry: 0,
    enabled: !!quizId,
  });

  useEffect(() => {
    if (isLoading || !isEnabled) {
      return;
    }

    if (apiError) {
      setError(apiError);
      return;
    }

    if (!data || data?.questions.length === 0) {
      setError(new Error("There's no questions on the selected quiz."));
      return;
    }

    router.push(`quiz-player/${data?.id}`);
  }, [isEnabled, data, isLoading, apiError, router]);

  function onSubmit(formData: FormProps) {
    setQuizId(formData.quizId);
  }

  if (isLoading) {
    return <LoadingState>Searching the quiz...</LoadingState>;
  }

  return (
    <Box sx={{ display: "flex", flexFlow: "column", gap: 2 }}>
      <ErrorAlert error={error} />
      <Typography variant="subtitle1">
        Select a quiz to take or enter the quiz id
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormControl sx={{ display: "flex", flexFlow: "row", gap: 2 }}>
          <TextField label="Enter quiz Id" required {...register("quizId")} />
          <Button variant="outlined" type="submit">
            Search quiz
          </Button>
        </FormControl>
      </form>
    </Box>
  );
}
