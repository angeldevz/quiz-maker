"use client";
import {
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { Fragment, useEffect, useState } from "react";
import { Question } from "../../types/quiz";
import { CheatStats } from "../../utils/useAntiCheat";

interface Summary {
  id: number;
  prompt: string;
  correctAnswer: string;
  yourAnswer: string;
  isCorrect: boolean;
}

interface Props {
  questions: Question[];
  answers: string[];
  retake: () => void;
  cheatStats: CheatStats;
}

export function Summary({ questions, answers, retake, cheatStats }: Props) {
  const [summary, setSummary] = useState<Summary[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    let correct = 0;
    const summary: Summary[] = [];
    questions.map((question, index) => {
      const correctAnswer =
        typeof question.correctAnswer === "string"
          ? question.correctAnswer.toLowerCase()
          : question.correctAnswer;
      const yourAnswer =
        typeof answers[index] === "string"
          ? answers[index].toLowerCase()
          : answers[index];

      const isCorrect = correctAnswer === yourAnswer;
      if (isCorrect) {
        correct++;
      }
      summary.push({
        id: question.id,
        prompt: question.prompt,
        correctAnswer,
        yourAnswer,
        isCorrect,
      });
    });
    setOverallScore(correct);
    setSummary(summary);
  }, [questions, answers]);

  return (
    <Box
      sx={{
        display: "flex",
        flexFlow: "column",
        gap: 4,
      }}
    >
      <List>
        <ListItemText>
          Overall Score: <strong>{overallScore}</strong>
        </ListItemText>
        <ListItemText>
          Anti-cheat summary:{" "}
          <strong>
            {cheatStats.switchTabsEvents} tab switch(es),{" "}
            {cheatStats.pasteEvents} paste(s)
          </strong>
        </ListItemText>
      </List>

      <Divider />
      <Box
        sx={{
          display: "flex",
          flexFlow: "column",
          gap: 2,
        }}
      >
        <Typography variant="h3">Summary</Typography>
        <List>
          {summary.map((item) => (
            <Fragment key={item.id}>
              <ListItem>
                <ListItemText>
                  <Box sx={{ display: "flex", flexFlow: "column", gap: 1 }}>
                    <span>{item.prompt}</span>
                    {item.isCorrect ? (
                      <span className="text-green-400">
                        Your Answer: {item.yourAnswer}
                      </span>
                    ) : (
                      <>
                        <span className="text-red-400">
                          Your Answer: {item.yourAnswer}
                        </span>
                        <span className="text-green-400">
                          Correct Answer: {item.correctAnswer}
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
        <Button onClick={retake}>Retake exam</Button>
      </Box>
    </Box>
  );
}
