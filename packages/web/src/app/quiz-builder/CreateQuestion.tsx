import {
  Button,
  Card,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { createQuestions } from "@utils/api";
import { Question, QuestionForm, Quiz, QuizType } from "@utils/quiz";
import { normalize } from "@utils/text";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AddMultipleChoice } from "./AddMultipleChoice";

const quizTypeOptions: Record<QuizType, string> = {
  short: "Short Answer",
  mcq: "Multiple Choice",
  code: "Code snippet",
};

interface Props {
  quiz: Quiz;
  showSuccess: () => void;
}
export function CreateQuestion({ quiz, showSuccess }: Props) {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<QuestionForm>();

  const [type, setType] = useState<QuizType>("short");
  const [options, setOptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: Question) => createQuestions(quiz.id, data),
    onSuccess: showSuccess,
    onError: (error) => {
      setError(error.message);
    },
  });

  function onSubmit(data: QuestionForm) {
    setError(null);

    const normalizedData = {
      ...data,
      prompt: normalize(data.prompt),
      correctAnswer: normalize(data.correctAnswer),
    };

    if (!normalizedData.prompt || !normalizedData.correctAnswer) {
      setError("Prompt and correct answer are required for each question.");
      return;
    }

    if (type === "mcq" && options.length <= 1) {
      setError("Please create at least 2 options");
      return;
    }
    const question = { ...data, options } as Question;
    mutation.mutate(question);
  }

  function onChange(event: SelectChangeEvent) {
    setType(event.target.value as QuizType);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
            <TextField required label="Answer" {...register("correctAnswer")} />
          )}
          {error && <FormHelperText>{error}</FormHelperText>}
        </Card>
        <Button variant="contained" type="submit" sx={{ alignSelf: "start" }}>
          Save
        </Button>
      </FormControl>
    </form>
  );
}
