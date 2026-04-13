import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { error: Error | null };

/**
 * Catches Convex subscription / render failures so the tab shows guidance instead of a white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const msg = this.state.error.message;
      return (
        <div className="min-h-screen bg-[#070b1e] text-slate-200 flex items-center justify-center p-8">
          <div className="max-w-lg rounded-2xl border border-red-500/30 bg-red-500/10 p-8 space-y-4">
            <h1 className="text-xl font-bold text-red-200">Something went wrong</h1>
            <pre className="text-xs whitespace-pre-wrap text-red-100/90 font-mono">{msg}</pre>
            <p className="text-sm text-slate-400">
              If this mentions Convex, start the backend first: from the project root run{" "}
              <code className="text-indigo-300">npm run dev:full</code> or in two terminals{" "}
              <code className="text-indigo-300">npm run convex:dev</code> then{" "}
              <code className="text-indigo-300">npm run dev</code>. Ensure{" "}
              <code className="text-indigo-300">frontend/.env.local</code> matches your{" "}
              <code className="text-indigo-300">CONVEX_URL</code> in the root{" "}
              <code className="text-indigo-300">.env.local</code>.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
            >
              Dismiss (may error again)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
