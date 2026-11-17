import React, { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/nunito/latin-ext-700.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/nunito/latin-ext-900.css";
import "@fontsource/nunito/latin-900.css";
import App from "./App";
import "./styles.css";
import { primeAudio } from "./audio";
document.addEventListener("pointerdown", primeAudio, { once: true });
document.addEventListener("keydown", primeAudio, { once: true });
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  render() {
    return this.state.error ? (
      <main className="page paper">
        <h1>Výprava si dala pauzu.</h1>
        <p>
          Something went wrong. Your saved progress is still on this device.
        </p>
        <button onClick={() => location.reload()}>Obnovit hru / Reload</button>
        <details>
          <summary>Podrobnosti / Details</summary>
          {this.state.error}
        </details>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
if ("serviceWorker" in navigator && import.meta.env.PROD)
  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {});
  });
