import { Component, type ReactNode } from 'react';
import { Layout } from './Layout';
import { LoadError } from './LoadError';

/**
 * If a page's file cannot be downloaded (no internet, or an old file after an update),
 * show "This lesson couldn't load…" with a Retry button instead of a blank screen.
 */
export class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed)
      return (
        <Layout>
          <LoadError onRetry={() => window.location.reload()} />
        </Layout>
      );
    return this.props.children;
  }
}
