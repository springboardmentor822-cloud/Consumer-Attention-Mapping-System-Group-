import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      // Without this, every query defaults to staleTime: 0, so simply
      // navigating away and back to a dashboard (unmount + remount of the
      // same useQuery) re-fetches instantly even if the data is a second
      // old - the browser back button, a re-render-triggered remount, or
      // React.StrictMode's intentional double-invoke in dev all trigger
      // this. Every screen's own refetchInterval (5s-30s, set per hook)
      // still fires on schedule regardless of staleTime - this only
      // prevents the *extra*, redundant fetch a fresh mount would otherwise
      // add on top of that schedule.
      staleTime: 3000,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster position="top-right" toastOptions={{ style: { background: "#111827", color: "#e5e7eb", border: "1px solid #263244" } }} />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
