import { Component } from 'react';

// React only supports error boundaries as class components; this is the one
// class in the app. It replaces a blank screen with a way to recover.
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('Unexpected rendering error', error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="centered">
        <h1>Something went wrong</h1>
        <p>The page hit an unexpected problem. Reloading usually fixes it.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload the page
        </button>
      </main>
    );
  }
}
