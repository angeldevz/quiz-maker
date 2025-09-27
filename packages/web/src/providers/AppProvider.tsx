import { PropsWithChildren } from "react";
import { AppThemeProvider } from "./AppThemeProvider";
import { QueryProvider } from "./QueryProvider";

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <AppThemeProvider>
      <QueryProvider>{children}</QueryProvider>
    </AppThemeProvider>
  );
}
