import { Box, CircularProgress } from "@mui/material";
import { PropsWithChildren } from "react";

export function LoadingState({ children }: PropsWithChildren) {
  return (
    <Box sx={{ display: "flex", flexFlow: "column", gap: 4 }}>
      <CircularProgress />
      {children}
    </Box>
  );
}
