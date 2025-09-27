import { Box, Container, Typography } from "@mui/material";
import { TakeAQuiz } from "./TakeAQuiz";

export default function Page() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ display: "flex", flexFlow: "column", gap: 4, width: "100%" }}>
        <Typography variant="h2">Quiz Player</Typography>
        <TakeAQuiz />
      </Box>
    </Container>
  );
}
