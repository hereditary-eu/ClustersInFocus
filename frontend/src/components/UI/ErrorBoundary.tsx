import { Component, ErrorInfo, ReactNode } from "react";
import { toast } from "../../stores/useToastStore";
import styles from "./ErrorBoundary.module.css";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    toast.error(`Something went wrong: ${error.message}. Please try refreshing the page.`, 8000);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.errorBoundary}>
          <div className={styles.content}>
            <h2 className={styles.title}>Something went wrong</h2>
            <p className={styles.message}>We encountered an unexpected error. Please try refreshing the page.</p>
            <details className={styles.details}>
              <summary>Technical details</summary>
              <pre className={styles.stack}>{this.state.error?.stack}</pre>
            </details>
            <button
              className={styles.refreshButton}
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
