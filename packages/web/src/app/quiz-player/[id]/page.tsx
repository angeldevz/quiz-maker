import { Box, Container } from "@mui/material";

import { ShowQuiz } from "./ShowQuiz";

interface Props {
  params: Promise<{ id: string }>;
}
export default async function Page({ params }: Props) {
  const { id } = await params;

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: "flex", flexFlow: "column", gap: 4, width: "100%" }}>
        <ShowQuiz quizId={parseInt(id)} />
      </Box>
    </Container>
  );
}
