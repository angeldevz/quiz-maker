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
  Typography,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getQuizzById, publishQuiz } from "@utils/api";
import { Quiz } from "@utils/quiz";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { LoadingState } from "../../components/LoadingState";

interface Props {
  quizId: number;
}

export function Summary({ quizId }: Props) {
  const hasPublished = useRef(false);
  const { mutate } = useMutation({
    mutationFn: ({ quizId }: { quizId: number }) => publishQuiz(quizId),
    onSuccess: () => {},
    onError: () => {},
  });
  const { data, isLoading } = useQuery<Quiz>({
    queryKey: ["quiz", quizId],
    queryFn: () => getQuizzById(quizId),
  });

  useEffect(() => {
    if (!quizId || hasPublished.current) {
      return;
    }

    hasPublished.current = true;
    mutate({ quizId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, hasPublished]);

  if (isLoading || !data) {
    return <LoadingState>Loading the questions...</LoadingState>;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexFlow: "column",
        gap: 2,
      }}
    >
      <Typography variant="h4">Questions:</Typography>
      {data.questions.map((item) => (
        <Slide key={item.id} in direction="left">
          <Card>
            <CardHeader title={item.prompt} />
            <CardContent>
              {item.type === "mcq" ? (
                <RadioGroup value={item.correctAnswer}>
                  {item.options.map((option) => (
                    <FormControlLabel
                      key={option}
                      control={
                        <Radio name={`question-${item.id}`} value={option} />
                      }
                      label={option}
                    />
                  ))}
                </RadioGroup>
              ) : (
                <TextField
                  label="Answer"
                  fullWidth
                  value={item.correctAnswer}
                  InputProps={{ readOnly: true }}
                />
              )}
            </CardContent>
          </Card>
        </Slide>
      ))}
      <Button LinkComponent={Link} href={"/quiz-player"}>
        Take a quiz
      </Button>
    </Box>
  );
}
