import { useRef, type ComponentProps } from 'react';
import { Alert, Text, type TextProps } from '@ten98/ui';

/* Compile-time contracts of the public API. Nothing here runs: `pnpm run typecheck` compiles this file against the source and
 * `pnpm run typecheck:fixtures` against the built declarations. A line marked @ts-expect-error must fail to compile, so the
 * check also fails when a contract is loosened. */

// Text: dateTime is typed only with as="time".
export const dated = <Text as="time" dateTime="2026-10-20T09:30:00Z" tone="muted" size="sm">20 Oct 2026, 09:30</Text>;
export const undated = <Text as="time">Today</Text>;
// @ts-expect-error dateTime belongs to as="time"
export const onSpan = <Text as="span" dateTime="2026-10-20">20 Oct 2026</Text>;
// @ts-expect-error the default element is a paragraph
export const onDefault = <Text dateTime="2026-10-20">20 Oct 2026</Text>;
// @ts-expect-error an `as` that could be any element cannot take dateTime
export const onAnyElement = (as: NonNullable<TextProps['as']>) => <Text as={as} dateTime="2026-10-20">20 Oct 2026</Text>;
// Every other element keeps its props.
export const label = <Text as="label" htmlFor="name" weight="medium">Name</Text>;
export const anyElement = (as: NonNullable<TextProps['as']>) => <Text as={as} size="sm" truncate title="Full value">Value</Text>;

// Alert: the ref is the root div, so an app can focus the alert itself.
export function AlertRef() {
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  return <>
    <Alert ref={root} tabIndex={-1} tone="danger" title="The report did not load" />
    {/* @ts-expect-error the ref is the root element, a div */}
    <Alert ref={button} />
  </>;
}
// ComponentProps keeps working and carries the ref.
export const alertProps: ComponentProps<typeof Alert> = { tone: 'warning', title: 'Heads up', tabIndex: -1, ref: null };
