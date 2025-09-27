"use client";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardHeader,
  CircularProgress,
  FormControl,
  Grow,
  List,
  ListItem,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { getQuizzes } from "../../api/quiz";

interface Props {
  setQuizId: (_: number) => void;
}

interface FormProps {
  quizId: number;
}
export function QuizList({ setQuizId }: Props) {
  const { handleSubmit, register } = useForm<FormProps>();
  const { data, isLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: getQuizzes,
  });

  function onSubmit(data: FormProps) {
    setQuizId(data.quizId);
  }

  if (isLoading || !data) {
    return (
      <Box>
        <CircularProgress />
        Loading quizzes...
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexFlow: "column", gap: 4 }}>
      <Typography variant="subtitle1">
        Select a quiz to take or enter the quiz id
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormControl sx={{ display: "flex", flexFlow: "row", gap: 2 }}>
          <TextField label="Enter quiz Id" required {...register("quizId")} />
          <Button variant="outlined" type="submit">
            Take the quiz
          </Button>
        </FormControl>
      </form>
      <List
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        }}
      >
        {data.map((item) => (
          <ListItem key={item.id}>
            <Grow in={true} timeout={200}>
              <Card
                variant="elevation"
                sx={{
                  width: "100%",
                  height: "100%",
                  p: 2,
                  rounded: 8,
                  display: "flex",
                  flexFlow: "column",
                  gap: 2,
                  boxShadow: "primary.main",
                }}
              >
                <CardHeader title={item.title} subheader={item.description} />
                <CardActions sx={{ alignSelf: "center" }}>
                  <Button
                    variant="contained"
                    onClick={() => setQuizId(item.id)}
                  >
                    Take this quiz
                  </Button>
                </CardActions>
              </Card>
            </Grow>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
