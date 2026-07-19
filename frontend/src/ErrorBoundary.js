import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <h1>Something went wrong</h1>
          <strong>{this.state.error.toString()}</strong>
          {this.state.info && <pre>{this.state.info.componentStack}</pre>}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
