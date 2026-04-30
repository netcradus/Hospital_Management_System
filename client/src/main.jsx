import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <App />
            <Toaster position="top-right" richColors />
          </SubscriptionProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </BrowserRouter>
);
