/**
 * Error Boundary Component
 * React错误边界 - 捕获组件树中的JavaScript错误
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertIcon, RefreshIcon } from './icons';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * 捕获子组件树中的JavaScript错误,记录错误日志,并显示备用UI
 *
 * 使用示例:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新state使下一次渲染能够显示降级后的UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 可以将错误日志上报给服务器
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 更新state以包含错误信息
    this.setState({
      errorInfo,
    });

    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback,使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>
              <AlertIcon size={64} />
            </div>

            <h1 className={styles.errorTitle}>出错了</h1>

            <p className={styles.errorMessage}>
              应用程序遇到了意外错误。您可以尝试刷新页面或重启应用。
            </p>

            {this.state.error && (
              <details className={styles.errorDetails}>
                <summary className={styles.errorSummary}>错误详情</summary>
                <div className={styles.errorContent}>
                  <p className={styles.errorName}>{this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <pre className={styles.errorStack}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className={styles.errorActions}>
              <button
                className={styles.resetButton}
                onClick={this.handleReset}
              >
                <RefreshIcon size={18} />
                <span>重试</span>
              </button>

              <button
                className={styles.reloadButton}
                onClick={() => window.location.reload()}
              >
                <RefreshIcon size={18} />
                <span>刷新页面</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook版本的Error Boundary (简化版)
 * 注意:这不能捕获事件处理器和异步代码中的错误
 *
 * 使用示例:
 * ```tsx
 * const { error, resetError } = useErrorHandler();
 * ```
 */
export function useErrorHandler() {
  const [error] = React.useState<Error | null>(null);

  // 在开发环境中,抛出错误让Error Boundary捕获
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  // 简化版Hook - 仅用于触发Error Boundary
  return { error };
}

export default ErrorBoundary;
