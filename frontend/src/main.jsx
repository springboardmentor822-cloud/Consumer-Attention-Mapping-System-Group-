import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App";

import AuthProvider from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { CameraProvider } from "./context/CameraContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <CameraProvider>
          <App />
        </CameraProvider>
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>
);