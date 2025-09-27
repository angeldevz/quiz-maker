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

interface Props {
  quizId: number;
}

interface AnswerForm {
  answer: string;
}

export function ShowQuestions({ quizId }: Props) {
  const cheatStats = useAntiCheat();
  const { handleSubmit, register } = useForm<AnswerForm>();

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  const resetExam = useCallback(() => {
    setCurrent(0);
    setAnswers([]);
    setShowSummary(false);
  }, []);

  const { data, isLoading } = useQuery<Quiz>({
    queryKey: ["quiz", quizId],
    queryFn: () => getQuizzById(quizId),
  });

  useEffect(() => {
    if (isLoading || !data?.questions) {
      return;
    }

    resetExam();
  }, [data, isLoading, resetExam]);

  if (isLoading || !data) {
    return (
      <Box>
        <CircularProgress />
        Loading the questions....
      </Box>
    );
  }

  function previousItem() {
    setCurrent((prev) => prev - 1);
  }

  function nextItem() {
    setCurrent((prev) => prev + 1);
  }

  function saveAnswer(answer: string) {
    const answeredQuestions = [...answers];
    answeredQuestions[current] = answer;
    setAnswers(answeredQuestions);
  }

  function onSubmit({ answer }: AnswerForm) {
    if (!data) {
      return;
    }

    saveAnswer(answer);

    if (current === data.questions.length - 1) {
      setShowSummary(true);
    } else {
      nextItem();
    }
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    saveAnswer(event.target.value);
  }

  if (showSummary) {
    return (
      <Summary
        questions={data.questions}
        answers={answers}
        retake={resetExam}
        cheatStats={cheatStats}
      />
    );
  }

  const currentQuestion = data.questions[current];
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box
        sx={{
          display: "flex",
          flexFlow: "column",
          gap: 4,
        }}
      >
        <Typography variant="h3">{data.title}</Typography>
        <Typography variant="subtitle1">{data.description}</Typography>

        <Slide in direction="left" unmountOnExit>
          <Card>
            <CardHeader title={currentQuestion.prompt} />
            <CardContent>
              {currentQuestion.type === "mcq" ? (
                <RadioGroup value={answers[current] || ""} onChange={onChange}>
                  {currentQuestion.options.map((option) => (
                    <FormControlLabel
                      key={option}
                      control={
                        <Radio
                          required
                          value={option}
                          {...register("answer")}
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
                  defaultValue={answers[current] ?? ""}
                  {...register("answer")}
                />
              )}
            </CardContent>
          </Card>
        </Slide>
        <Box
          sx={{
            display: "flex",
            flexFlow: "row",
            justifyContent: "space-between",
          }}
        >
          {current !== 0 && (
            <Button variant="outlined" onClick={previousItem}>
              Previous
            </Button>
          )}

          <Button variant="contained" sx={{ ml: "auto" }} type="submit">
            {current === data.questions.length - 1 ? "Submit" : "Next"}
          </Button>
        </Box>
      </Box>
    </form>
  );
}
