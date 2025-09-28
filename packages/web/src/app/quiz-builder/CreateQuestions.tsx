import CloseIcon from "@mui/icons-material/Close";
import { Alert, Box, Button, IconButton } from "@mui/material";
import { Quiz } from "@utils/quiz";
import { useState } from "react";
import { CreateQuestion } from "./CreateQuestion";
import { Summary } from "./Summary";

interface Props {
  quiz: Quiz;
}
export function CreateQuestions({ quiz }: Props) {
  //form
  const [success, setSuccess] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  function finalize() {
    setShowSummary(true);
  }

  function addQuestion() {
    setSuccess(false);
  }

  function showSuccess() {
    setSuccess(true);
  }

  if (showSummary) {
    return <Summary quizId={quiz.id} />;
  }

  if (success) {
    return (
      <Box
        sx={{
          display: "flex",
          flexFlow: "column",
          gap: 4,
        }}
      >
        <Alert
          variant="filled"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setSuccess(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          Question was successfully added to Quiz{" "}
          <strong>&quot;{quiz.title}&quot;</strong>. Keep adding questions or
          create a new Quiz.
        </Alert>
        <Box
          sx={{
            display: "flex",
            flexFlow: "row",
            flexWrap: "wrap-reverse",
            gap: 2,
            ml: "auto",
          }}
        >
          <Button variant="outlined" type="submit" onClick={addQuestion}>
            Add another question
          </Button>
          <Button variant="contained" type="submit" onClick={finalize}>
            Finalize quiz
          </Button>
        </Box>
      </Box>
    );
  }

  return <CreateQuestion quiz={quiz} showSuccess={showSuccess} />;
}
