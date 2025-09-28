import { Box, Container, Typography } from "@mui/material";
import { CreateQuiz } from "./CreateQuiz";

export default function Page() {
  return (
    <Container maxWidth="md" sx={{ width: "90%" }}>
      <Box sx={{ display: "flex", flexFlow: "column", gap: 4 }}>
        <Typography variant="h2">Quiz Builder</Typography>
        <CreateQuiz />
      </Box>
    </Container>
  );
}
