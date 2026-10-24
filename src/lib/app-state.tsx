'use client';

/* Full-screen loading and failure states. They live apart from the sign-in flows so an app that renders them at startup
 * and lazy-loads its sign-in screen keeps those flows out of its startup chunk (bundlers split by module). */
import { Component, type ReactNode } from 'react';
import { Alert, Button } from './primitives.js';
import { Stack, Text } from './structure.js';
import { AuthLayout, type AuthSurface } from './workspace.js';

export type AppStateKind = 'loading' | 'error' | 'boundary' | 'unconfirmed' | 'not-found';
export interface AppStateScreenProps {
  state: AppStateKind;
  brand: ReactNode;
  /** Default `card` matches the sign-in screens; `plain` keeps the open column. */
  surface?: AuthSurface;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** `not-found`: where "Go to home" leads; without it the action uses `onRetry`. */
  homeHref?: string;
}
const stateCopy: Record<AppStateKind, { title: string; message: string; retryLabel: string }> = {
  loading: { title: 'Loading', message: 'Loading your workspace…', retryLabel: '' },
  error: { title: 'Could not load', message: 'The request did not complete.', retryLabel: 'Try again' },
  boundary: { title: 'This screen stopped working', message: 'An unexpected error interrupted this screen.', retryLabel: 'Reload' },
  unconfirmed: { title: 'Result not confirmed', message: 'The request may or may not have completed. Reload to check the current state before you try again.', retryLabel: 'Reload' },
  'not-found': { title: 'Page not found', message: 'This page does not exist or has moved.', retryLabel: 'Go to home' },
};
/** Full-screen loading and failure states shown before the application shell is available. */
export function AppStateScreen({ state, brand, surface, title, message, onRetry, retryLabel, homeHref }: AppStateScreenProps) {
  const copy = stateCopy[state];
  return <AuthLayout label={title ?? copy.title} brand={brand} surface={surface} title={title ?? copy.title}>
    <Stack gap={4}>
      {/* Loading and not-found share one status node, so replacing loading with not-found changes the text inside a live
          region that already exists and is announced. A missing page is not a failure, so it is not an alert. */}
      {state === 'loading' || state === 'not-found'
        ? <div className={state === 'loading' ? 't98-auth-state' : undefined} role="status">
          {state === 'loading' && <span className="t98-spinner" aria-hidden="true" />}<Text as="span">{message ?? copy.message}</Text>
        </div>
        : <Alert tone={state === 'unconfirmed' ? 'warning' : 'danger'} role="alert" title={message ?? copy.message} />}
      {state === 'loading' ? null : state === 'not-found' && homeHref
          ? <Button href={homeHref}>{retryLabel ?? copy.retryLabel}</Button>
          : onRetry && <Button type="button" onClick={onRetry}>{retryLabel ?? copy.retryLabel}</Button>}
    </Stack>
  </AuthLayout>;
}

export interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: Partial<AppStateScreenProps>;
  /** Defaults to reloading the page. */
  onReload?: () => void;
  /** Report the failure; the boundary itself logs nothing. */
  onError?: (error: Error) => void;
}
/** Catches render failures below it and shows the boundary state with a reload action. */
export class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { this.props.onError?.(error); }
  render() {
    if (!this.state.failed) return this.props.children;
    const { fallback, onReload } = this.props;
    // A custom onReload recovers in place, so clear the failure and render the children again.
    const retry = onReload ? () => { this.setState({ failed: false }); onReload(); } : () => location.reload();
    return <AppStateScreen brand={null} onRetry={retry} {...fallback} state="boundary" />;
  }
}
