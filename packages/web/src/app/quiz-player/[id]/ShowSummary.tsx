import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { submitQuiz } from "@utils/api";
import { AnswerAttempt, Attempt } from "@utils/quiz";
import { CheatStats } from "@utils/useAntiCheat";
import { Fragment, useEffect, useState } from "react";
import { ErrorAlert } from "../../../components/ErrorAlert";
import { LoadingState } from "../../../components/LoadingState";
import { Stats } from "./Stats";

interface Details {
  questionId: number;
  correct: boolean;
  expected: string;
}

interface SubmitAttempt {
  quizId: number;
  attemptId: number;
}

type Summary = Details & AnswerAttempt;

interface Props {
  attempt: Attempt;
  answers: AnswerAttempt[];
  cheatStats: CheatStats;
}
export function ShowSummary({ answers, attempt, cheatStats }: Props) {
  const [score, setScore] = useState(0);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const {
    isPending,
    mutate,
    error: apiError,
  } = useMutation({
    mutationFn: ({ quizId, attemptId }: SubmitAttempt) =>
      submitQuiz(quizId, attemptId),
    onSuccess: (data) => {
      setScore(data.score);
      answers.map((question) => {
        const details = data.details.find(
          (item: Details) => item.questionId === question.questionId
        );
        summary.push({
          ...question,
          ...details,
        });
      });

      setSummary(summary);
    },
    onError: (error) => {
      setError(error);
    },
  });

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (apiError) {
      setError(apiError);
    }
  }, [isPending, apiError]);

  useEffect(() => {
    if (!attempt.quiz.id || !attempt.id) {
      return;
    }

    mutate({ quizId: attempt.quiz.id, attemptId: attempt.id });
  }, [attempt, mutate]);

  if (isPending && !summary) {
    return <LoadingState>Loading the results...</LoadingState>;
  }

  if (error) {
    return <ErrorAlert error={error} />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexFlow: "column",
        gap: 2,
      }}
    >
      <ErrorAlert error={error} />
      <Box
        sx={{
          display: "flex",
          flexFlow: "row",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography variant="subtitle1">
          Overall Score: <strong>{score}</strong>
        </Typography>
        <Stats type="Tab Switches" events={cheatStats.switchTabsEvents} />
        <Stats type="Paste Events" events={cheatStats.pasteEvents} />
      </Box>
      <Divider />

      <Typography variant="h3">Summary</Typography>
      <List>
        {summary.map((item) => (
          <Fragment key={item.questionId}>
            <ListItem>
              <ListItemText>
                <Box sx={{ display: "flex", flexFlow: "column", gap: 1 }}>
                  <span>{item.prompt}</span>
                  {item.correct ? (
                    <span className="text-green-400">
                      Your answer is CORRECT: {item.expected}
                    </span>
                  ) : (
                    <>
                      <span className="text-red-400">
                        Your answer is INCORRECT: {item.value}
                      </span>
                      <span className="text-green-400">
                        Correct answer is: {item.expected}
                      </span>
                    </>
                  )}
                </Box>
              </ListItemText>
            </ListItem>
            <Divider component="li" />
          </Fragment>
        ))}
      </List>
    </Box>
  );
}
