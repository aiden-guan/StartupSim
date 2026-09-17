import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { validateCatalogs } from "./data/validate";
import "./index.css";
import { App } from "./ui/App";

validateCatalogs();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
