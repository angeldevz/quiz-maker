import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { QuestionForm } from "@utils/quiz";
import { KeyboardEvent, useRef, useState } from "react";
import { FieldError, UseFormRegister } from "react-hook-form";

type Props = {
  options: string[];
  setOptions: (_: string[]) => void;
  //es
  register: UseFormRegister<QuestionForm>;
  fieldError?: FieldError;
};

export function AddMultipleChoice({
  options,
  setOptions,
  register,
  fieldError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function add() {
    if (!inputRef.current) {
      return;
    }
    setError(null);
    const value = inputRef.current.value;
    if (!value) {
      setError("Option value is required");
      return;
    }

    if (options.includes(value)) {
      setError("You cannot add the same option");
      return;
    }
    setOptions([...options, value]);
    inputRef.current.value = "";
    inputRef.current.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!inputRef.current) {
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      add();
    }
  }

  return (
    <Box sx={{ display: "flex", flexFlow: "column", gap: 2 }}>
      <FormControl required error={!!fieldError}>
        <FormLabel id="option-label">
          Multiple Choice Options (select the correct answer before saving)
        </FormLabel>
        <RadioGroup aria-labelledby="option-label">
          {options.map((option) => (
            <FormControlLabel
              key={option}
              value={option}
              control={
                <Radio {...register("correctAnswer", { required: true })} />
              }
              label={option}
            />
          ))}
        </RadioGroup>
      </FormControl>
      <TextField
        label={`Option ${options.length + 1}`}
        inputRef={inputRef}
        onKeyDown={handleKeyDown}
      />
      {error && <FormHelperText error={true}>{error}</FormHelperText>}
      <Button
        type="button"
        variant="outlined"
        onClick={add}
        sx={{ alignSelf: "start" }}
      >
        Add option
      </Button>
    </Box>
  );
}
