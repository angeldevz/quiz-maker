"use client";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { PropsWithChildren } from "react";
import theme from "../utils/theme";
import { CssBaseline, ThemeProvider } from "@mui/material";

export function AppThemeProvider({ children }: PropsWithChildren) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
