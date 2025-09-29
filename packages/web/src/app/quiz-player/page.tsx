import { Box, Container, Typography } from "@mui/material";
import { QuizList } from "./List";
import { SearchQuiz } from "./SearchQuiz";

export default function Page() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ display: "flex", flexFlow: "column", gap: 4, width: "100%" }}>
        <Typography variant="h2">Quiz Player</Typography>
        <SearchQuiz />
        <QuizList />
      </Box>
    </Container>
  );
}
