'use client';

import { Component, useEffect, useId, useRef, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { Alert, Button, Checkbox, Field, Icon, Input, type Tone } from './primitives.js';
import { Link, Stack, Text, type LinkProps } from './structure.js';
import { AuthLayout } from './workspace.js';

/* Presentation-only authentication flows. Applications keep requests, sessions, routing, CSRF and OIDC redirects,
 * and supply every message; these components never decide whether a credential is valid. */

export interface PasswordPolicy { minLength: number; maxLength: number; hint?: string }
export const defaultPasswordPolicy: PasswordPolicy = { minLength: 12, maxLength: 128 };

export type AuthFieldName = 'email' | 'password' | 'token' | 'name' | 'workspaceName';
export type AuthFieldErrors = Partial<Record<AuthFieldName, string>>;
/** Values read from the submitted form, including hidden fields. Checkbox fields are present only when checked. */
export type AuthFormValues = Record<string, string>;
export interface AuthNotice { tone: Tone; text: string }
/** Either a callback that receives the current email, or a destination. */
export type AuthAction = { onClick: (email: string) => void; href?: never } | { href: string; onClick?: never };

export interface AuthFormBaseProps {
  /** Brand content, normally `AppBrand`. */
  brand: ReactNode;
  /** Side panel, normally `AuthStory`. */
  aside?: ReactNode;
  footer?: ReactNode;
  /** Accessible name for the whole screen. */
  label?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  /** Controlled mode: receives the form values and the browser does not navigate. Omit it to post natively to `action`. */
  onSubmit?: (values: AuthFormValues) => void | Promise<void>;
  action?: string;
  method?: 'get' | 'post';
  /** Extra values such as a CSRF token, posted with the form. */
  hiddenFields?: Record<string, string>;
  /** Disables the form, shows a loading submit button and ignores repeated submits. */
  busy?: boolean;
  busyLabel?: string;
  /** Form-level failure. Focus moves to it when it changes after a submit. */
  error?: string;
  notice?: AuthNotice;
  fieldErrors?: AuthFieldErrors;
  linkComponent?: LinkProps['component'];
}

interface AuthFormFrameProps extends AuthFormBaseProps {
  submitLabel: string;
  children: ReactNode;
  after?: ReactNode;
  below?: ReactNode;
}

function readValues(form: HTMLFormElement): AuthFormValues {
  const values: AuthFormValues = {};
  for (const [name, value] of new FormData(form)) if (typeof value === 'string') values[name] = value;
  return values;
}
const emailOf = (button: HTMLElement) => {
  const form = (button as HTMLButtonElement).form;
  const value = form ? new FormData(form).get('email') : null;
  return typeof value === 'string' ? value : '';
};

function AuthFormFrame({ brand, aside, footer, label, eyebrow, title, description, onSubmit, action, method = 'post', hiddenFields, busy = false, busyLabel, error, notice, fieldErrors, submitLabel, children, after, below }: AuthFormFrameProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);
  const pending = useRef(false);
  const fieldKey = JSON.stringify(fieldErrors ?? {});

  useEffect(() => {
    if (!submitted.current || busy) return;
    const root = formRef.current;
    const target = error ? root?.querySelector<HTMLElement>('.t98-auth-error') : root?.querySelector<HTMLElement>('[aria-invalid=true]');
    target?.focus();
  }, [error, fieldKey, busy]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (busy || pending.current) { event.preventDefault(); return; }
    submitted.current = true;
    if (!onSubmit) return;
    event.preventDefault();
    pending.current = true;
    try { await onSubmit(readValues(event.currentTarget)); } finally { pending.current = false; }
  }

  return <AuthLayout label={label} brand={brand} aside={aside} footer={footer}>
    <header className="t98-auth-heading">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="t98-auth-title">{title}</h1>
      {description && <p>{description}</p>}
    </header>
    <form ref={formRef} aria-busy={busy || undefined} onSubmit={handleSubmit} action={onSubmit ? undefined : action} method={onSubmit ? undefined : method}>
      {hiddenFields && Object.entries(hiddenFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      {notice && <Alert className="t98-auth-feedback" tone={notice.tone} title={notice.text} />}
      {error && <Alert className="t98-auth-feedback t98-auth-error" tone="danger" title={error} tabIndex={-1} />}
      <fieldset className="t98-auth-fieldset" disabled={busy}>
        {children}
        <Button type="submit" className="t98-auth-submit" loading={busy}>{busy && busyLabel ? busyLabel : submitLabel}</Button>
        {after}
      </fieldset>
    </form>
    {below}
  </AuthLayout>;
}

function AuthActionControl({ action, label, linkComponent, variant }: { action: AuthAction; label: string; linkComponent?: LinkProps['component']; variant: 'ghost' | 'secondary' }) {
  if (action.href !== undefined) return <Link href={action.href} variant="standalone" component={linkComponent}>{label}</Link>;
  const { onClick } = action;
  return <Button type="button" variant={variant} size="sm" onClick={(event: MouseEvent<HTMLButtonElement>) => onClick(emailOf(event.currentTarget))}>{label}</Button>;
}

export interface SignInFlowProps extends AuthFormBaseProps {
  defaultValues?: { email?: string };
  /** Only `maxLength` applies to a current password. */
  passwordPolicy?: Pick<PasswordPolicy, 'maxLength'>;
  submitLabel?: string;
  forgotPassword?: AuthAction & { label?: string };
  cancel?: { label: string } & ({ onClick: () => void; href?: never } | { href: string; onClick?: never });
  /** Sign-on provider buttons shown below the form, normally `OidcProviderButtons`. */
  providers?: ReactNode;
}
/** Email and password sign-in. The application authenticates; this renders the screen. */
export function SignInFlow({ defaultValues, passwordPolicy, submitLabel = 'Sign in', busyLabel = 'Signing in…', forgotPassword, cancel, providers, linkComponent, fieldErrors, ...frame }: SignInFlowProps) {
  const id = useId();
  const maxLength = passwordPolicy?.maxLength ?? defaultPasswordPolicy.maxLength;
  return <AuthFormFrame {...frame} fieldErrors={fieldErrors} linkComponent={linkComponent} submitLabel={submitLabel} busyLabel={busyLabel} below={providers}
    after={cancel && <div className="t98-auth-aux">{cancel.href !== undefined ? <Link href={cancel.href} variant="standalone" component={linkComponent}>{cancel.label}</Link> : <Button type="button" variant="secondary" onClick={cancel.onClick}>{cancel.label}</Button>}</div>}>
    <Field label="Email address" htmlFor={`${id}-email`} error={fieldErrors?.email}>
      <Input name="email" type="email" autoComplete="username" required maxLength={254} defaultValue={defaultValues?.email} />
    </Field>
    <Field label="Password" htmlFor={`${id}-password`} error={fieldErrors?.password}>
      <Input name="password" type="password" autoComplete="current-password" required maxLength={maxLength} />
    </Field>
    {forgotPassword && <div className="t98-auth-inline-action"><AuthActionControl action={forgotPassword} label={forgotPassword.label ?? 'Forgot password?'} linkComponent={linkComponent} variant="ghost" /></div>}
  </AuthFormFrame>;
}

export interface FirstUserSetupFlowProps extends AuthFormBaseProps {
  defaultValues?: { name?: string; email?: string; workspaceName?: string };
  passwordPolicy?: PasswordPolicy;
  tokenLength?: { min?: number; max?: number };
  tokenHint?: string;
  /** Show a workspace name field. */
  workspaceName?: boolean;
  /** Checkbox for sample content; `false` or omitted hides it. */
  sampleOptIn?: { label: string; defaultChecked?: boolean } | false;
  signInInstead?: AuthAction & { label?: string };
  submitLabel?: string;
}
/** Owner account creation for a new installation, gated by a setup token the application verifies. */
export function FirstUserSetupFlow({ defaultValues, passwordPolicy = defaultPasswordPolicy, tokenLength, tokenHint, workspaceName = false, sampleOptIn = false, signInInstead, submitLabel = 'Create owner account', busyLabel = 'Creating account…', linkComponent, fieldErrors, ...frame }: FirstUserSetupFlowProps) {
  const id = useId();
  return <AuthFormFrame {...frame} fieldErrors={fieldErrors} linkComponent={linkComponent} submitLabel={submitLabel} busyLabel={busyLabel}
    after={signInInstead && <div className="t98-auth-aux"><AuthActionControl action={signInInstead} label={signInInstead.label ?? 'Sign in instead'} linkComponent={linkComponent} variant="ghost" /></div>}>
    <Field label="Your name" htmlFor={`${id}-name`} error={fieldErrors?.name}>
      <Input name="name" autoComplete="name" required maxLength={120} defaultValue={defaultValues?.name} />
    </Field>
    <Field label="Setup token" htmlFor={`${id}-token`} description={tokenHint} error={fieldErrors?.token}>
      <Input name="token" type="password" autoComplete="off" required minLength={tokenLength?.min} maxLength={tokenLength?.max} spellCheck={false} />
    </Field>
    <Field label="Email address" htmlFor={`${id}-email`} error={fieldErrors?.email}>
      <Input name="email" type="email" autoComplete="username" required maxLength={254} defaultValue={defaultValues?.email} />
    </Field>
    <Field label="Password" htmlFor={`${id}-password`} description={passwordPolicy.hint ?? `Use at least ${passwordPolicy.minLength} characters.`} error={fieldErrors?.password}>
      <Input name="password" type="password" autoComplete="new-password" required minLength={passwordPolicy.minLength} maxLength={passwordPolicy.maxLength} />
    </Field>
    {workspaceName && <Field label="Workspace name" htmlFor={`${id}-workspace`} error={fieldErrors?.workspaceName}>
      <Input name="workspaceName" autoComplete="organization" required maxLength={120} defaultValue={defaultValues?.workspaceName} />
    </Field>}
    {sampleOptIn && <div className="t98-auth-choice"><Checkbox name="sample" value="true" label={sampleOptIn.label} defaultChecked={sampleOptIn.defaultChecked} /></div>}
  </AuthFormFrame>;
}

export interface OidcProvider { id: string; name: string; href?: string }
export interface OidcProviderButtonsProps {
  /** `null` while unknown. An empty list renders nothing. */
  providers: readonly OidcProvider[] | null;
  loading?: boolean;
  loadingLabel?: string;
  /** Failure loading providers, supplied by the application. */
  error?: string;
  /** Called for a provider without `href`; the application starts the redirect. */
  onStart?: (id: string) => void;
  onRetry?: () => void;
  retryLabel?: string;
  /** Id of the provider being started; it shows loading and the others are disabled. */
  pending?: string | null;
  dividerLabel?: string;
  labelFor?: (provider: OidcProvider) => string;
}
/** Sign-on provider choices below a divider. Providers with `href` are native links. */
export function OidcProviderButtons({ providers, loading = false, loadingLabel = 'Loading sign-in options…', error, onStart, onRetry, retryLabel = 'Try again', pending = null, dividerLabel = 'or continue with', labelFor = provider => `Continue with ${provider.name}` }: OidcProviderButtonsProps) {
  const divider = <div className="or-divider"><span>{dividerLabel}</span></div>;
  if (loading && !providers?.length) return <div className="t98-auth-providers">{divider}<div className="t98-auth-state" role="status"><span className="t98-spinner" aria-hidden="true" /><span>{loadingLabel}</span></div></div>;
  if (error) return <div className="t98-auth-providers">{divider}<Alert tone="danger" title={error} actions={onRetry && <Button type="button" variant="secondary" size="sm" onClick={onRetry}>{retryLabel}</Button>} /></div>;
  if (!providers?.length) return null;
  return <div className="t98-auth-providers">{divider}
    <Stack as="ul" gap={2} aria-label="Sign-in providers">
      {providers.map(provider => <Stack as="li" gap={0} key={provider.id}>
        {provider.href !== undefined
          ? <a className="t98-button t98-button--secondary t98-auth-provider" href={provider.href}>{labelFor(provider)}</a>
          : <Button type="button" variant="secondary" className="t98-auth-provider" loading={pending === provider.id} disabled={pending != null && pending !== provider.id} onClick={() => onStart?.(provider.id)}>{labelFor(provider)}</Button>}
      </Stack>)}
    </Stack>
  </div>;
}

export interface AuthStoryProps {
  label?: string;
  eyebrow: string;
  title: string;
  /** Final words of the title, in the accent color. */
  emphasis?: string;
  lead: string;
  /** Decorative chips; `icon` is an Icon name. */
  channels?: { icon: string; label: string }[];
  footnote: string;
}
/** Side-panel story for `aside`. The title is styled text; the screen's only h1 is in the form. */
export function AuthStory({ label, eyebrow, title, emphasis, lead, channels, footnote }: AuthStoryProps) {
  return <>
    <div role={label ? 'group' : undefined} aria-label={label}>
      <span className="eyebrow">{eyebrow}</span>
      <p className="auth-story-title">{title}{emphasis && <> <em>{emphasis}</em></>}</p>
      <p className="auth-story-summary">{lead}</p>
      {channels?.length ? <div className="auth-channels" aria-hidden="true">{channels.map(channel => <span key={channel.label}><Icon name={channel.icon} />{channel.label}</span>)}</div> : null}
    </div>
    <small className="auth-story-footnote">{footnote}</small>
  </>;
}

export type AppStateKind = 'loading' | 'error' | 'boundary';
export interface AppStateScreenProps {
  state: AppStateKind;
  brand: ReactNode;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}
const stateCopy: Record<AppStateKind, { title: string; message: string; retryLabel: string }> = {
  loading: { title: 'Loading', message: 'Loading your workspace…', retryLabel: '' },
  error: { title: 'Could not load', message: 'The request did not complete.', retryLabel: 'Try again' },
  boundary: { title: 'This screen stopped working', message: 'An unexpected error interrupted this screen.', retryLabel: 'Reload' },
};
/** Full-screen loading and failure states shown before the application shell is available. */
export function AppStateScreen({ state, brand, title, message, onRetry, retryLabel }: AppStateScreenProps) {
  const copy = stateCopy[state];
  return <AuthLayout brand={brand} title={title ?? copy.title}>
    {state === 'loading'
      ? <div className="t98-auth-state" role="status"><span className="t98-spinner" aria-hidden="true" /><Text as="span">{message ?? copy.message}</Text></div>
      : <Stack gap={4}>
        <Alert tone="danger" title={message ?? copy.message} />
        {onRetry && <Button type="button" onClick={onRetry}>{retryLabel ?? copy.retryLabel}</Button>}
      </Stack>}
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
    return <AppStateScreen brand={null} onRetry={onReload ?? (() => location.reload())} {...fallback} state="boundary" />;
  }
}
