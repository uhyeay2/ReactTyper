import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import * as Sentry from "@sentry/react";
import { store } from "@/app/store";
import { ThemeProvider } from "@/features/theme/providers/ThemeProvider";
import { App } from "./App";
import "./index.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  environment: import.meta.env.MODE,
  enabled: Boolean(import.meta.env.VITE_SENTRY_DSN),
  tracesSampleRate: import.meta.env.MODE === "production" ? 0.2 : 1.0,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </Provider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
