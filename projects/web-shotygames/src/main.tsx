import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const params = new URLSearchParams(window.location.search);
["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((key) => {
  const val = params.get(key);
  if (val) localStorage.setItem(key, val);
});

createRoot(document.getElementById("root")!).render(<App />);
