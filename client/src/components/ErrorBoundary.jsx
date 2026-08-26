
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught App Error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
          <div className="max-w-md w-full bg-white border border-slate-300 rounded-lg shadow-lg p-6 text-center space-y-4">
            <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
            <p className="text-sm text-slate-600">
              An unexpected error occurred in the application.
            </p>
            {this.state.error?.message && (
              <div className="bg-slate-100 text-slate-800 text-xs font-mono p-3 rounded text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-sm transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;