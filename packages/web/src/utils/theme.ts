"use client";
import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "dark",
  },
  typography: {
    h1: { fontSize: "2.5rem", fontWeight: "600" },
    h2: { fontSize: "2rem", fontWeight: "400" },
    h3: { fontSize: "1.8rem", fontWeight: "300" },
    h4: { fontSize: "1.6rem" },
    h5: { fontSize: "1.2rem" },
    h6: { fontSize: "1rem" },
    subtitle1: { fontSize: ".8rem" },
    subtitle2: { fontSize: ".8rem" },
  },
});

export default theme;
