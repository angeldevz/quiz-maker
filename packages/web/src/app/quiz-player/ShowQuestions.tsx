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

export interface Answer {
  value: string;
  idx?: number;
}
interface AnswerForm {
  answer: string;
}

export function ShowQuestions({ quizId }: Props) {
  const cheatStats = useAntiCheat();
  const { handleSubmit, register, reset } = useForm<AnswerForm>();

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  const resetExam = useCallback(() => {
    setCurrent(0);
    setAnswers([]);
    setShowSummary(false);
    reset();
  }, [reset]);

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

  const currentQuestion = data.questions[current];

  function previousItem() {
    setCurrent((prev) => prev - 1);
    reset();
  }

  function nextItem() {
    setCurrent((prev) => prev + 1);
    reset();
  }

  function saveAnswer(answer: Answer) {
    const answeredQuestions = [...answers];
    answeredQuestions[current] = answer;
    console.log(answeredQuestions);
    setAnswers(answeredQuestions);
  }

  function onSubmit({ answer }: AnswerForm) {
    if (!data) {
      return;
    }

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
      <Summary
        questions={data.questions}
        answers={answers}
        retake={resetExam}
        cheatStats={cheatStats}
      />
    );
  }

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
                <RadioGroup
                  value={answers[current]?.value || ""}
                  onChange={onChange}
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
                  defaultValue={answers[current] ?? ""}
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
