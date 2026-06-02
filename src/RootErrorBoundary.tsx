import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[AnimaStage] Root render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#0a0b0e] text-zinc-100 flex flex-col items-center justify-center gap-4 px-6 text-center font-sans">
          <p className="text-lg font-bold text-red-300">Something went wrong loading the studio</p>
          <p className="text-sm text-zinc-500 max-w-md font-mono break-all">{this.state.error.message}</p>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
            onClick={() => window.location.assign('./app')}
          >
            Reload studio
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
