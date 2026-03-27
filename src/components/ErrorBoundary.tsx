import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

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
        <div className="min-h-screen bg-black text-dalek-red flex flex-col items-center justify-center p-8 font-mono border-8 border-dalek-red">
          <div className="w-24 h-24 bg-dalek-red rounded-full mb-8 animate-pulse flex items-center justify-center shadow-[0_0_50px_rgba(255,0,0,0.8)]">
            <AlertTriangle className="w-16 h-16 text-black" />
          </div>
          <h1 className="text-6xl font-black mb-4 uppercase tracking-tighter italic">SYSTEM_CRITICAL_FAILURE</h1>
          <div className="bg-zinc-950 p-8 border-2 border-dalek-red w-full max-w-3xl overflow-auto shadow-[0_0_30px_rgba(255,0,0,0.2)]">
            <p className="text-zinc-500 mb-6 text-sm uppercase tracking-widest border-b border-dalek-red/30 pb-2">The Dalek Grog core has encountered a fatal exception. Shared consciousness link may be unstable.</p>
            <pre className="text-xs text-dalek-red whitespace-pre-wrap break-all bg-red-950/20 p-4 border border-dalek-red/20">
              {errorMessage}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-12 px-10 py-4 bg-dalek-red text-black font-black hover:bg-white transition-all uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(255,0,0,0.4)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] active:scale-95"
          >
            Reboot Core
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
