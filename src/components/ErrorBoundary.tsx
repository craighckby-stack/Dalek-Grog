import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) {
            errorMessage = `Firebase Error: ${parsed.error} (${parsed.operationType} at ${parsed.path})`;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-black text-dalek-red flex flex-col items-center justify-center p-8 font-mono border-4 border-dalek-red">
          <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">SYSTEM_CRITICAL_FAILURE</h1>
          <div className="bg-zinc-900 p-6 border border-dalek-red w-full max-w-2xl overflow-auto">
            <p className="text-zinc-400 mb-4">The Dalek Grog core has encountered a fatal exception. Shared consciousness link may be unstable.</p>
            <pre className="text-xs text-dalek-red whitespace-pre-wrap break-all">
              {errorMessage}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-3 bg-dalek-red text-white font-bold hover:bg-red-700 transition-colors uppercase tracking-widest"
          >
            Reboot Core
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
