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
import Link from "next/link";

interface Props {
  quizId: number;
}

export function Summary({ quizId }: Props) {
  const { data, isLoading } = useQuery<Quiz>({
    queryKey: ["quiz", quizId],
    queryFn: () => getQuizzById(quizId),
  });

  if (isLoading || !data) {
    return (
      <Box>
        <CircularProgress />
        Loading the questions...
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexFlow: "column",
        gap: 4,
      }}
    >
      <Typography variant="h3">
        Quiz #{quizId}:{data.title}
      </Typography>
      <Typography variant="subtitle1">{data.description}</Typography>

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
              ) : item.type === "code" ? (
                <TextField
                  label="Answer"
                  fullWidth
                  value={"any code"}
                  InputProps={{ readOnly: true }}
                />
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
