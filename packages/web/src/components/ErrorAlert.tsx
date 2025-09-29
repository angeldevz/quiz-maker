import ErrorIcon from "@mui/icons-material/Error";
import { Alert } from "@mui/material";

interface Props {
  error: Error | null;
}
export function ErrorAlert({ error }: Props) {
  if (!error) {
    return;
  }
  return (
    <Alert variant="filled" color="error" icon={<ErrorIcon />}>
      {error.message}
    </Alert>
  );
}
