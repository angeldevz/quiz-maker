"use client";
import {
  Button,
  Card,
  CardActions,
  CardHeader,
  Grow,
  List,
  ListItem,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getQuizzes } from "@utils/api";
import { useRouter } from "next/navigation";
import { LoadingState } from "../../components/LoadingState";

export function QuizList() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: getQuizzes,
  });

  function playQuiz(id: number) {
    router.push(`/quiz-player/${id}`);
  }

  if (isLoading) {
    return <LoadingState>Loading quizzes</LoadingState>;
  }

  if (!data) {
    return;
  }

  return (
    <List
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      }}
    >
      {data?.map((item) => (
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
              <CardHeader
                title={item.title}
                subheader={item.description}
                slotProps={{
                  content: {
                    sx: {
                      width: "100%",
                    },
                  },
                  title: {
                    sx: {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      width: "100%",
                    },
                  },
                  subheader: {
                    sx: {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      width: "100%",
                    },
                  },
                }}
              />
              <CardActions sx={{ alignSelf: "center" }}>
                <Button variant="contained" onClick={() => playQuiz(item.id)}>
                  Take this quiz
                </Button>
              </CardActions>
            </Card>
          </Grow>
        </ListItem>
      ))}
    </List>
  );
}
