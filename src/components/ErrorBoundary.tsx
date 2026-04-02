import React from 'react';
import { Button } from '@/components/ui/button';

type ErrorBoundaryState = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('UI ErrorBoundary', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground">
          <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Halaman mengalami masalah. Silakan muat ulang untuk melanjutkan.
          </p>
          <Button onClick={this.handleReload}>Muat Ulang</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
