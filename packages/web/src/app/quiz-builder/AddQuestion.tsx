import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  Card,
  Collapse,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Slide,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { createQuestions } from "@utils/api";
import { Question, QuestionForm, Quiz, QuizType } from "@utils/quiz";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AddMultipleChoice } from "./AddMultipleChoice";

const quizTypeOptions: Record<QuizType, string> = {
  short: "Short Answer",
  mcq: "Multiple Choice",
  code: "Code snippet",
};

interface Props {
  quiz: Quiz;
  finalize: () => void;
}
export function AddQuestion({ quiz, finalize }: Props) {
  //form
  const [type, setType] = useState<QuizType>("short");
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<QuestionForm>();
  const [options, setOptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: Question) => createQuestions(quiz.id, data),
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      reset();
      setOptions([]);

      if (done) {
        finalize();
      }
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  useEffect(() => {
    setError(null);
  }, [options]);

  function onChange(event: SelectChangeEvent) {
    setType(event.target.value as QuizType);
  }

  function onSubmit(data: QuestionForm) {
    setSuccess(false);
    setError(null);

    if (type === "mcq" && options.length <= 1) {
      setError("Please create at least 2 options");
      return;
    }
    const question = { ...data, options } as Question;
    mutation.mutate(question);
  }

  function save() {
    setDone(true);
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexFlow: "column",
        gap: 4,
      }}
    >
      <Typography variant="h3">Quiz ID: {quiz.id}</Typography>
      <Slide direction="up" in={true} mountOnEnter unmountOnExit>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Collapse in={success}>
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
              <strong>&quot;{quiz.title}&quot;</strong>. Keep adding questions
              or create a new Quiz.
            </Alert>
          </Collapse>
          <FormControl
            sx={{
              display: "flex",
              flexFlow: "column",
              gap: 4,
            }}
            error={!!error}
            variant="standard"
          >
            <Card
              sx={{
                display: "flex",
                flexFlow: "column",
                gap: 2,
                p: 4,
                borderRadius: 4,
              }}
            >
              <Typography variant="subtitle1">Add a Question</Typography>

              <FormControl>
                <InputLabel id="type-label">Question Type</InputLabel>
                <Select
                  labelId="type-label"
                  id="type-select"
                  label="Question Type"
                  value={type}
                  {...register("type", { onChange, required: true })}
                >
                  {Object.keys(quizTypeOptions).map((quizType) => (
                    <MenuItem key={quizType} value={quizType}>
                      {quizTypeOptions[quizType as QuizType]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField required label="Question" {...register("prompt")} />

              {type === "mcq" ? (
                <AddMultipleChoice
                  options={options}
                  setOptions={setOptions}
                  register={register}
                  fieldError={errors.correctAnswer}
                />
              ) : type === "code" ? (
                <TextField
                  label="Code Snippet"
                  {...register("code")}
                  multiline
                  minRows={5}
                  sx={{
                    textarea: {
                      resize: "both",
                    },
                  }}
                />
              ) : (
                <TextField
                  required
                  label="Answer"
                  {...register("correctAnswer")}
                />
              )}
              {error && <FormHelperText>{error}</FormHelperText>}
            </Card>

            <Box
              sx={{
                display: "flex",
                flexFlow: "row",
                flexWrap: "wrap-reverse",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Button variant="outlined" type="submit">
                Add question
              </Button>
              <Button variant="contained" type="submit" onClick={save}>
                Save
              </Button>
            </Box>
          </FormControl>
        </form>
      </Slide>
    </Box>
  );
}
