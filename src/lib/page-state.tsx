'use client';

/* Page states shown inside the application shell's content area, after the shell exists. The full-screen states for
 * before the shell exists are AppStateScreen in app-state.tsx. */
import { useEffect, useId, useRef } from 'react';
import { Alert, Button } from './primitives.js';
import { Heading, Inline, Link, Stack } from './structure.js';

export interface RouteErrorScreenProps {
  /** The text shown about the failure, already safe to show (for example `publicErrorMessage(error)` from
   * `@ten98/runtime/start`). It is the only text taken from the failure; a value that is not a non-empty string shows the
   * default message instead. A reference number in it stays selectable, so it can be copied. */
  message: string;
  /** The page's h1. Defaults to "This page stopped working". */
  title?: string;
  /** Shows the retry button, for example the router's `reset`. */
  onRetry?: () => void;
  /** Retry button text. Defaults to "Try again". */
  retryLabel?: string;
  /** Shows a "Go to home" link to this address. */
  homeHref?: string;
}

const routeErrorCopy = { title: 'This page stopped working', message: 'An unexpected error interrupted this page.', retryLabel: 'Try again', home: 'Go to home' };

/** A route's failure, shown in the shell's content area in place of the page: an h1 that takes focus, a danger alert with
 * the message, and optional retry and home actions. Pass it as the router's default error component. */
export function RouteErrorScreen({ message, title = routeErrorCopy.title, onRetry, retryLabel = routeErrorCopy.retryLabel, homeHref }: RouteErrorScreenProps) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  // The page that had focus is gone, so focus moves to the heading that replaces it.
  useEffect(() => { heading.current?.focus(); }, []);
  // Only a string is shown. Any other value (an error object passed by mistake) is never converted or inspected.
  const text = typeof message === 'string' && message.trim() !== '' ? message : routeErrorCopy.message;
  return <Stack as="section" gap={4} className="t98-page-state" aria-labelledby={`${id}-title`}>
    <Heading level={1} size="xl" id={`${id}-title`} ref={heading} tabIndex={-1} className="t98-page-state-title">{title}</Heading>
    <Alert tone="danger" role="alert" title={text} />
    {(onRetry || homeHref) && <Inline gap={3}>
      {onRetry && <Button type="button" onClick={onRetry}>{retryLabel}</Button>}
      {homeHref && <Link variant="standalone" href={homeHref}>{routeErrorCopy.home}</Link>}
    </Inline>}
  </Stack>;
}
