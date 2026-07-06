import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '12px' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
