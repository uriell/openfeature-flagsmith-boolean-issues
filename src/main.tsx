import React from "react";
import ReactDOM from "react-dom/client";
import { OpenFeature, OpenFeatureProvider } from "@openfeature/react-sdk";

import { Provider } from "./provider.ts";
import App from "./App.tsx";

const rootElement = ReactDOM.createRoot(document.getElementById("root")!);

if (!import.meta.env.VITE_FLAGSMITH_SDK_KEY) {
  const errorMessage =
    "Create a .env file with a valid VITE_FLAGSMITH_SDK_KEY.";

  rootElement.render(<h1 style={{ color: "white" }}>{errorMessage}</h1>);
  throw new Error(errorMessage);
}

await import("./index.css");

OpenFeature.setProvider(
  new Provider({
    environmentID: import.meta.env.VITE_FLAGSMITH_SDK_KEY,
  })
);

rootElement.render(
  <React.StrictMode>
    <OpenFeatureProvider>
      <App />
    </OpenFeatureProvider>
  </React.StrictMode>
);
