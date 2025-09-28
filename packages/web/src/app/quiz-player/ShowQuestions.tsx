"use client";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  Slide,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getQuizzById } from "@utils/api";
import { Quiz } from "@utils/quiz";
import { useAntiCheat } from "@utils/useAntiCheat";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Summary } from "./Summary";

export interface Answer {
  value: string;
  idx?: number;
}
interface AnswerForm {
  answer: string;
}
interface Props {
  quizId: number;
  takeAnotherExam: () => void;
  setError: (_: Error | null) => void;
}

export function ShowQuestions({ quizId, takeAnotherExam, setError }: Props) {
  const cheatStats = useAntiCheat();
  const { handleSubmit, register, reset, setFocus } = useForm<AnswerForm>();

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  const resetExam = useCallback(() => {
    setCurrent(0);
    setAnswers([]);
    setShowSummary(false);
    reset();
    cheatStats.resetStats();
  }, [reset]);

  const { data, isLoading, error } = useQuery<Quiz>({
    queryKey: ["quiz", quizId],
    queryFn: () => getQuizzById(quizId),
    retry: 0,
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (error) {
      setError(error);
      takeAnotherExam();
    } else if (!data || data.questions.length === 0) {
      setError(new Error("No questions found. Try another quiz."));
      takeAnotherExam();
    } else {
      setError(null);
      resetExam();
    }
  }, [data, isLoading, error, setError, resetExam, takeAnotherExam]);

  if (isLoading || !data || data.questions.length === 0) {
    return (
      <Box sx={{ display: "flex", flexFlow: "column", gap: 4 }}>
        <CircularProgress />
        Loading the questions....
      </Box>
    );
  }

  function previousItem() {
    setCurrent((prev) => prev - 1);
    reset();
    setTimeout(() => setFocus("answer"), 0);
  }

  function nextItem() {
    setCurrent((prev) => prev + 1);
    reset();
    setTimeout(() => setFocus("answer"), 0);
  }

  function saveAnswer(answer: Answer) {
    const answeredQuestions = [...answers];
    answeredQuestions[current] = answer;
    setAnswers(answeredQuestions);
  }

  function onSubmit({ answer }: AnswerForm) {
    if (!data) {
      return;
    }
    const currentQuestion = data.questions[current];

    //we already saved the mcq answer
    if (currentQuestion.type !== "mcq") {
      saveAnswer({ value: answer });
    }

    if (current === data.questions.length - 1) {
      setShowSummary(true);
    } else {
      nextItem();
    }
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    if (currentQuestion.type === "mcq") {
      const value = event.target.value;
      saveAnswer({
        value,
        idx: currentQuestion.options.indexOf(value),
      });
    }
  }

  if (showSummary) {
    return (
      <>
        <Summary
          questions={data.questions}
          answers={answers}
          cheatStats={cheatStats}
        />
        <Box
          sx={{
            display: "flex",
            flexFlow: "row",
            flexWrap: "wrap-reverse",
            gap: 2,
            ml: "auto",
          }}
        >
          <Button variant="outlined" onClick={resetExam}>
            Retake exam
          </Button>
          <Button variant="contained" onClick={takeAnotherExam}>
            Take another quiz
          </Button>
        </Box>
      </>
    );
  }

  const currentQuestion = data.questions[current];
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box
        sx={{
          display: "flex",
          flexFlow: "column",
          gap: 2,
        }}
      >
        <Typography variant="h3">
          #{data.id} : {data.title}
        </Typography>
        <Typography variant="subtitle1">{data.description}</Typography>

        <Slide in direction="left" unmountOnExit>
          <Card>
            <CardHeader title={currentQuestion.prompt} />
            <CardContent>
              {currentQuestion.type === "mcq" ? (
                <RadioGroup
                  value={answers[current]?.value || ""}
                  onChange={onChange}
                  autoFocus
                >
                  {currentQuestion.options.map((option) => (
                    <FormControlLabel
                      key={option}
                      control={
                        <Radio
                          required
                          value={option}
                          {...register("answer", {})}
                        />
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
                  defaultValue={answers[current]?.value ?? ""}
                  {...register("answer")}
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
        <Box
          sx={{
            display: "flex",
            flexFlow: "row",
            flexWrap: "wrap-reverse",
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <Button variant="outlined" onClick={takeAnotherExam}>
            Take another quiz
          </Button>
          <Box
            sx={{
              display: "flex",
              flexFlow: "row",
              justifyContent: "space-between",
              flexWrap: "wrap-reverse",
              gap: 2,
            }}
          >
            {current !== 0 && (
              <Button variant="outlined" onClick={previousItem}>
                Previous question
              </Button>
            )}

            <Button variant="contained" type="submit">
              {current === data.questions.length - 1 ? "Submit" : "Save Answer"}
            </Button>
          </Box>
        </Box>
      </Box>
    </form>
  );
}
