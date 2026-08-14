import React, { Component } from "react";

export default class ComponentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Component error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div className="bg-[#0F172A]/80 border border-rose-500/20 rounded-xl p-4 text-center space-y-2 my-2 font-mono flex flex-col items-center justify-center min-h-[120px]">
          <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5 justify-center">
            <span>⚠️</span>
            <span>Component temporarily unavailable</span>
          </div>
          {isDev && this.state.error && (
            <div className="w-full text-left bg-slate-950 p-2 rounded text-[9px] text-slate-400 overflow-auto max-h-[80px] border border-rose-500/10">
              <span className="text-rose-400 font-extrabold">{this.state.error.name}: {this.state.error.message}</span>
              <pre className="mt-1 font-mono text-[8px] whitespace-pre-wrap leading-tight">{this.state.error.stack}</pre>
            </div>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
