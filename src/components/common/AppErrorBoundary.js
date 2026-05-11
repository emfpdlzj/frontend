import { Component } from 'react';
import { CommonErrorPage } from './CommonErrorPage';

export class AppErrorBoundary extends Component {
  state = {
    hasError: false
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error, info) {
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <CommonErrorPage status={500} />;
    }

    return this.props.children;
  }
}
