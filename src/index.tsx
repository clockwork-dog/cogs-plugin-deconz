import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CogsConnectionProvider } from "@clockworkdog/cogs-client-react";

function Root() {
  return (
    <CogsConnectionProvider>
      <App />
    </CogsConnectionProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<Root />);
