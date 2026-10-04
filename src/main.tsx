import React from "react";
import ReactDOM from "react-dom/client";
import { GameProvider } from "./app/GameProvider";
import App from "./app/App";
import "./styles.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>,
);
