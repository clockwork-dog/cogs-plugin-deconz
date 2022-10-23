import React from "react";
import {
  useCogsConnection,
  useIsConnected,
} from "@clockworkdog/cogs-client-react";
import Deconz from "./Deconz";

import "./App.css";

export default function App() {
  const connection = useCogsConnection();
  const isConnected = useIsConnected(connection);

  return (
    <div className="App">
      <p>COGS connected: {isConnected.toString()}</p>
      <Deconz />
    </div>
  );
}
