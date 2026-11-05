import { Component, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="app-error">
          <h1>This workspace could not be displayed</h1>
          <p>
            Saved projects remain in this browser. Reload to try again. Unsaved
            edits may be lost.
          </p>
          <button
            className="primary-button"
            onClick={() => window.location.reload()}
          >
            Reload workspace
          </button>
        </main>
      );
    return this.props.children;
  }
}
