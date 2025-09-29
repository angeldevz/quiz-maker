"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  Radio,
  RadioGroup,
  Slide,
  TextField,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { submitAnswer } from "@utils/api";
import { AnswerForm, Question } from "@utils/quiz";
import { normalize } from "@utils/text";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ErrorAlert } from "../../../components/ErrorAlert";
import { LoadingState } from "../../../components/LoadingState";

interface Props {
  attemptId: number;
  question: Question;
  submitQuestion: (_: AnswerForm) => void;
}
export function ShowQuestion({ attemptId, question, submitQuestion }: Props) {
  const { handleSubmit, register } = useForm<AnswerForm>();
  const [error, setError] = useState<Error | null>(null);

  const { isPending, mutate } = useMutation({
    mutationFn: (data: AnswerForm) => submitAnswer(attemptId, data),
    onSuccess: (_, data) => submitQuestion(data),
    onError: (error) => {
      setError(error);
    },
  });

  function onSubmit(data: AnswerForm) {
    const answer = normalize(data.value);
    if (!answer) {
      setError(new Error("Answer is required"));
      return;
    }
    mutate({ questionId: question.id, value: answer });
  }

  if (isPending) {
    return <LoadingState>Submitting your answer...</LoadingState>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box
        sx={{
          display: "flex",
          flexFlow: "column",
          gap: 2,
        }}
      >
        <ErrorAlert error={error} />

        <Slide in direction="left" unmountOnExit>
          <Card>
            <CardHeader
              title={`Question #${question.id}: ${question.prompt}`}
            />
            <CardContent>
              {question.type === "mcq" ? (
                <RadioGroup autoFocus>
                  {question.options.map((option) => (
                    <FormControlLabel
                      required
                      key={option}
                      control={
                        <Radio value={option} {...register("value", {})} />
                      }
                      label={option}
                    />
                  ))}
                </RadioGroup>
              ) : (
                <TextField
                  label="Your answer"
                  fullWidth
                  required
                  autoFocus
                  {...register("value")}
                  multiline
                  minRows={5}
                  sx={{
                    textarea: {
                      resize: "both",
                    },
                  }}
                />
              )}
            </CardContent>
          </Card>
        </Slide>
        <Button
          variant="contained"
          type="submit"
          sx={{ alignSelf: "flex-start" }}
        >
          Submit
        </Button>
      </Box>
    </form>
  );
}
