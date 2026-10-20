'use client';

import type { ComponentType, HTMLAttributes, ImgHTMLAttributes, LiHTMLAttributes, OptgroupHTMLAttributes, OptionHTMLAttributes, ReactNode } from 'react';
import { cx } from './primitives.js';

/* Layout and text primitives let applications compose screens without authoring elements or styles.
 * Spacing, size and tone props accept design-token steps only, so a screen cannot introduce ad-hoc values. */

export type Space = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;
export type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type Justify = 'start' | 'center' | 'end' | 'between';
type BlockTag = 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'nav' | 'main' | 'form' | 'fieldset' | 'ul' | 'ol' | 'li' | 'dl' | 'figure';

interface BoxProps extends Omit<HTMLAttributes<HTMLElement>, 'style'> {
  as?: BlockTag;
  gap?: Space;
  align?: Align;
  /** Native form attributes, applied when `as="form"`. */
  action?: string;
  method?: 'get' | 'post' | 'dialog';
  noValidate?: boolean;
  /** Native fieldset attribute, applied when `as="fieldset"`. */
  disabled?: boolean;
}

function layoutClasses(base: string, gap: Space | undefined, align: Align | undefined) {
  return cx(base, gap != null && `t98-gap-${gap}`, align && `t98-align-${align}`);
}

/** Vertical rhythm: children stacked with one token gap. */
export function Stack({ as: Tag = 'div', gap = 4, align, className, ...props }: BoxProps) {
  return <Tag {...props} className={cx(layoutClasses('t98-stack', gap, align), className)} />;
}

export interface InlineProps extends BoxProps { justify?: Justify; wrap?: boolean }
/** Horizontal run that wraps by default, for actions, badges and metadata. */
export function Inline({ as: Tag = 'div', gap = 2, align = 'center', justify, wrap = true, className, ...props }: InlineProps) {
  return <Tag {...props} className={cx(layoutClasses('t98-inline', gap, align), justify && `t98-justify-${justify}`, !wrap && 't98-nowrap', className)} />;
}

export interface GridProps extends BoxProps {
  /** Fixed column count from desktop width; collapses to one column on narrow screens. `auto` fills columns of at least `minItemWidth`. */
  columns?: 1 | 2 | 3 | 4 | 6 | 'auto';
  minItemWidth?: 'sm' | 'md' | 'lg';
}
export function Grid({ as: Tag = 'div', gap = 4, align, columns = 'auto', minItemWidth = 'md', className, ...props }: GridProps) {
  return <Tag {...props} className={cx(layoutClasses('t98-grid', gap, align), `t98-grid--${columns}`, columns === 'auto' && `t98-grid--min-${minItemWidth}`, className)} />;
}

/** Field layout for forms: responsive columns with the shared form spacing. */
export function FormGrid({ className, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'style'>) {
  return <div {...props} className={cx('t98-form-grid', className)} />;
}

/** Wrapping action row placed after the controls it submits. */
export function FormActions({ className, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'style'>) {
  return <div {...props} className={cx('t98-form-actions', className)} />;
}

export type TextTone = 'default' | 'muted' | 'accent' | 'success' | 'warning' | 'danger';
export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'style'> {
  as?: 'p' | 'span' | 'div' | 'strong' | 'em' | 'small' | 'code' | 'time' | 'dt' | 'dd' | 'figcaption' | 'label';
  size?: TextSize;
  tone?: TextTone;
  weight?: 'regular' | 'medium' | 'semibold';
  align?: 'start' | 'center' | 'end';
  mono?: boolean;
  /** Numerals keep equal widths so values align in columns. */
  numeric?: boolean;
  /** Single line with an ellipsis; supply the full value in `title` when it can be cut. */
  truncate?: boolean;
  dateTime?: string;
  htmlFor?: string;
}
export function Text({ as: Tag = 'p', size, tone = 'default', weight, align, mono, numeric, truncate, className, ...props }: TextProps) {
  return <Tag {...props} className={cx('t98-text', size && `t98-text--${size}`, tone !== 'default' && `t98-text-tone-${tone}`, weight && `t98-weight-${weight}`, align && `t98-text-align-${align}`, mono && 't98-mono', numeric && 't98-numeric', truncate && 't98-truncate', className)} />;
}

export interface HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'style'> {
  /** Document outline level. Choose it from the page structure, not the desired size. */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}
const headingSize = { 1: '2xl', 2: 'xl', 3: 'lg', 4: 'md', 5: 'sm', 6: 'sm' } as const;
export function Heading({ level, size = headingSize[level], className, ...props }: HeadingProps) {
  const Tag = `h${level}` as const;
  return <Tag {...props} className={cx('t98-heading', `t98-heading--${size}`, className)} />;
}

/** Text only screen readers announce, for icon-only context or table captions. */
export function VisuallyHidden({ as: Tag = 'span', ...props }: Omit<HTMLAttributes<HTMLElement>, 'className' | 'style'> & { as?: 'span' | 'div' | 'h2' | 'h3' | 'caption' }) {
  return <Tag {...props} className="t98-visually-hidden" />;
}

export interface LinkProps extends Omit<HTMLAttributes<HTMLAnchorElement>, 'style'> {
  href: string;
  variant?: 'inline' | 'standalone' | 'quiet';
  target?: '_blank' | '_self';
  rel?: string;
  download?: boolean | string;
  /** A router link component (for example TanStack Router `Link`) that renders an anchor and accepts `href`/`className`. */
  component?: ComponentType<{ href: string; className?: string; children?: ReactNode }>;
}
/** Navigation link. External new-tab links get `noopener noreferrer` unless `rel` is given. */
export function Link({ variant = 'inline', component: Component, className, target, rel, ...props }: LinkProps) {
  const classes = cx('t98-link', `t98-link--${variant}`, className);
  const safeRel = rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined);
  if (Component) return <Component {...props} className={classes} />;
  return <a {...props} target={target} rel={safeRel} className={classes} />;
}

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'style' | 'alt'> {
  /** Required; use an empty string only for decorative images. */
  alt: string;
  fit?: 'cover' | 'contain';
  aspect?: 'auto' | 'square' | 'video' | 'portrait';
  rounded?: boolean;
}
export function Image({ fit = 'cover', aspect = 'auto', rounded = true, loading = 'lazy', decoding = 'async', className, ...props }: ImageProps) {
  return <img {...props} loading={loading} decoding={decoding} className={cx('t98-image', `t98-image--${fit}`, aspect !== 'auto' && `t98-aspect-${aspect}`, rounded && 't98-image--rounded', className)} />;
}

/** Choice inside `Select`. */
export function Option(props: Omit<OptionHTMLAttributes<HTMLOptionElement>, 'className' | 'style'>) {
  return <option {...props} />;
}
export function OptionGroup(props: Omit<OptgroupHTMLAttributes<HTMLOptGroupElement>, 'className' | 'style'> & { label: string }) {
  return <optgroup {...props} />;
}

export interface DescriptionItem { term: ReactNode; description: ReactNode; key?: string }
/** Label/value pairs for identity, settings or review details. `columns` places pairs side by side on wide screens. */
export function DescriptionList({ items, columns = 1, className, ...props }: Omit<HTMLAttributes<HTMLDListElement>, 'style' | 'children'> & { items: DescriptionItem[]; columns?: 1 | 2 | 3 }) {
  return <dl {...props} className={cx('t98-description-list', `t98-description-list--${columns}`, className)}>
    {items.map((item, index) => <div key={item.key ?? index}><dt>{item.term}</dt><dd>{item.description}</dd></div>)}
  </dl>;
}

/** Prose list with visible markers. For unmarked layout lists use `Stack as="ul"` with `Stack as="li"` items. */
export function List({ ordered = false, gap = 1, className, ...props }: Omit<HTMLAttributes<HTMLUListElement | HTMLOListElement>, 'style'> & { ordered?: boolean; gap?: Space }) {
  const Tag = ordered ? 'ol' : 'ul';
  return <Tag {...props} className={cx('t98-list', `t98-gap-${gap}`, className)} />;
}
export function ListItem({ className, ...props }: Omit<LiHTMLAttributes<HTMLLIElement>, 'style'>) {
  return <li {...props} className={cx('t98-list-item', className)} />;
}

/** Short report filters: fields share a row up to 18rem each; other children (results, notes) take the full width. */
export function FeatureControls({ className, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'style'>) {
  return <div {...props} className={cx('t98-feature-controls', className)} />;
}
