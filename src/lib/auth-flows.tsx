'use client';

import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Alert, Button, Checkbox, Field, Icon, Input, type Tone } from './primitives.js';
import { DescriptionList, Heading, Link, Stack, Text, type LinkProps } from './structure.js';
import { AuthLayout, type AuthSurface } from './workspace.js';
import { FlowActionControl, FlowFrame, HiddenInputs, useFlowDate, passwordHint, useSingleSubmit, type LabelledAction } from './flow-frame.js';

/* Presentation-only authentication flows. Applications keep requests, sessions, routing, CSRF and OIDC redirects,
 * and supply every message; these components never decide whether a credential is valid. */

export interface PasswordPolicy { minLength: number; maxLength: number; hint?: string }
export const defaultPasswordPolicy: PasswordPolicy = { minLength: 12, maxLength: 128 };

export type AuthFieldName = 'email' | 'password' | 'token' | 'name' | 'workspaceName' | 'code' | 'confirmation';
export type AuthFieldErrors = Partial<Record<AuthFieldName, string>>;
/** Raw values read from the submitted form, including hidden fields. Flows convert them to their own typed values. */
export type AuthFormValues = Record<string, string>;
export interface AuthNotice { tone: Tone; text: string }
/** Either a callback that receives the current email, or a destination. */
export type AuthAction = { onClick: (email: string) => void; href?: never } | { href: string; onClick?: never };

export interface AuthFormBaseProps<Values = AuthFormValues> {
  /** Brand content, normally `AppBrand`. */
  brand: ReactNode;
  /** Side panel, normally `AuthStory`. */
  aside?: ReactNode;
  /** `card` shows the form as a bordered card, also beside an `aside`. Defaults to `card` without an `aside`, `plain` with one. */
  surface?: AuthSurface;
  footer?: ReactNode;
  /** Accessible name for the whole screen. */
  label?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  /** Controlled mode: receives this flow's typed values and the browser does not navigate. `hiddenFields` are not included. Omit it to post natively to `action`. */
  onSubmit?: (values: Values) => void | Promise<void>;
  action?: string;
  method?: 'get' | 'post';
  /** Extra values such as a CSRF token, posted with the form. */
  hiddenFields?: Record<string, string>;
  /** Disables the form, shows a loading submit button and ignores repeated submits. */
  busy?: boolean;
  busyLabel?: string;
  /** Form-level failure. Focus moves to it when it changes after a submit. */
  error?: string;
  /** The outcome of the last request is unknown, for example after a timeout. Shown as a warning alert, distinct from `error`; say what to check and not to assume the request failed or succeeded. */
  unconfirmed?: string;
  notice?: AuthNotice;
  fieldErrors?: AuthFieldErrors;
  linkComponent?: LinkProps['component'];
}

export interface SignInValues { email: string; password: string }
/** `token` is present only when the flow asks for a setup token (`setupToken`, the default). */
export interface FirstUserSetupValues { name: string; token?: string; email: string; password: string; workspaceName?: string; sample: boolean }
export interface TwoFactorValues { code: string; mode: 'authenticator' | 'recovery' }
export interface RecoveryRequestValues { email: string }
export interface RecoveryResetValues { password: string; confirmation: string; token?: string }
export interface InvitationValues { name?: string; password?: string; token?: string }
/** `sample` is present only when the flow offers `sampleOptIn`. */
export interface WorkspaceCreateValues { name: string; sample?: boolean }

/** Wraps a typed handler for the frame, which reads raw form values. */
const typed = <Values,>(onSubmit: ((values: Values) => void | Promise<void>) | undefined, convert: (raw: AuthFormValues) => Values) => onSubmit && ((raw: AuthFormValues) => onSubmit(convert(raw)));
const text = (raw: AuthFormValues, name: string) => raw[name] ?? '';
const optional = (raw: AuthFormValues, name: string) => raw[name] === undefined ? {} : { [name]: raw[name] };

interface AuthFormFrameProps extends Omit<AuthFormBaseProps, 'onSubmit'> {
  onSubmit?: (values: AuthFormValues) => void | Promise<void>;
  /** Posted and submitted like hiddenFields but kept in the values, for example a token the flow documents as a value. */
  valueFields?: Record<string, string>;
  /** Omit it for a screen without a form: the children render below the heading with the notice and error. */
  submitLabel?: string;
  /** Runs before a submit is accepted. Return false to keep the browser from posting; the flow shows its own message. */
  validate?: (values: AuthFormValues) => boolean;
  children: ReactNode;
  after?: ReactNode;
  below?: ReactNode;
}

function readValues(form: HTMLFormElement): AuthFormValues {
  const values: AuthFormValues = {};
  for (const [name, value] of new FormData(form)) if (typeof value === 'string') values[name] = value;
  return values;
}
function AuthFormFrame({ brand, aside, surface, footer, label, eyebrow, title, description, onSubmit, action, method = 'post', hiddenFields, valueFields, busy = false, busyLabel, error, unconfirmed, notice, fieldErrors, submitLabel, validate, children, after, below }: AuthFormFrameProps) {
  const once = useSingleSubmit();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (busy) { event.preventDefault(); return; }
    const values = readValues(event.currentTarget);
    for (const name of Object.keys(hiddenFields ?? {})) delete values[name];
    if (validate && !validate(values)) { event.preventDefault(); return; }
    if (!onSubmit) return;
    event.preventDefault();
    await once(() => onSubmit(values));
  }

  const hasForm = submitLabel !== undefined;
  return <AuthLayout label={label ?? title} brand={brand} aside={aside} surface={surface} footer={footer}>
    <header className="t98-auth-heading">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="t98-auth-title">{title}</h1>
      {description && <p>{description}</p>}
    </header>
    <FlowFrame busy={busy} error={error} unconfirmed={unconfirmed} notice={notice} fieldErrors={fieldErrors} onSubmit={hasForm ? handleSubmit : undefined}
      action={onSubmit ? undefined : action} method={onSubmit ? undefined : method} hiddenFields={{ ...hiddenFields, ...valueFields }}>
      {hasForm
        ? <>
          {children}
          <Button type="submit" className="t98-auth-submit" loading={busy}>{busy && busyLabel ? busyLabel : submitLabel}</Button>
          {after}
        </>
        : <Stack gap={4}>{children}</Stack>}
    </FlowFrame>
    {below}
  </AuthLayout>;
}

export interface SignInFlowProps extends AuthFormBaseProps<SignInValues> {
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
export function SignInFlow({ defaultValues, passwordPolicy, submitLabel = 'Sign in', busyLabel = 'Signing in…', forgotPassword, cancel, providers, linkComponent, fieldErrors, onSubmit, ...frame }: SignInFlowProps) {
  const id = useId();
  const maxLength = passwordPolicy?.maxLength ?? defaultPasswordPolicy.maxLength;
  return <AuthFormFrame {...frame} onSubmit={typed(onSubmit, raw => ({ email: text(raw, 'email'), password: text(raw, 'password') }))} fieldErrors={fieldErrors} linkComponent={linkComponent} submitLabel={submitLabel} busyLabel={busyLabel} below={providers}
    after={cancel && <div className="t98-auth-aux">{cancel.href !== undefined ? <Link href={cancel.href} variant="standalone" component={linkComponent}>{cancel.label}</Link> : <Button type="button" variant="secondary" onClick={cancel.onClick}>{cancel.label}</Button>}</div>}>
    <Field label="Email address" htmlFor={`${id}-email`} error={fieldErrors?.email}>
      <Input name="email" type="email" autoComplete="username" required maxLength={254} defaultValue={defaultValues?.email} />
    </Field>
    <Field label="Password" htmlFor={`${id}-password`} error={fieldErrors?.password}>
      <Input name="password" type="password" autoComplete="current-password" required maxLength={maxLength} />
    </Field>
    {forgotPassword && <div className="t98-auth-inline-action"><FlowActionControl action={forgotPassword} label={forgotPassword.label ?? 'Forgot password?'} linkComponent={linkComponent} variant="ghost" /></div>}
  </AuthFormFrame>;
}

export interface FirstUserSetupFlowProps extends AuthFormBaseProps<FirstUserSetupValues> {
  defaultValues?: { name?: string; email?: string; workspaceName?: string };
  passwordPolicy?: PasswordPolicy;
  /** `false` drops the setup-token field: the first person to sign up becomes the owner. Defaults to `true`. */
  setupToken?: boolean;
  tokenLength?: { min?: number; max?: number };
  tokenHint?: string;
  /** Show a workspace name field. */
  workspaceName?: boolean;
  /** `false` makes the workspace name optional, for example when it is prefilled with a default such as "My workspace". */
  workspaceNameRequired?: boolean;
  /** Checkbox for sample content; `false` or omitted hides it. */
  sampleOptIn?: { label: string; defaultChecked?: boolean } | false;
  signInInstead?: AuthAction & { label?: string };
  submitLabel?: string;
}
/** Owner account creation for a new installation: optionally gated by a setup token the application verifies, or, with
 * `setupToken={false}`, the first sign-up becomes the owner. */
export function FirstUserSetupFlow({ defaultValues, passwordPolicy = defaultPasswordPolicy, setupToken = true, tokenLength, tokenHint, workspaceName = false, workspaceNameRequired = true, sampleOptIn = false, signInInstead, submitLabel = 'Create owner account', busyLabel = 'Creating account…', linkComponent, fieldErrors, onSubmit, ...frame }: FirstUserSetupFlowProps) {
  const id = useId();
  return <AuthFormFrame {...frame} onSubmit={typed(onSubmit, raw => ({ name: text(raw, 'name'), ...(setupToken ? { token: text(raw, 'token') } : {}), email: text(raw, 'email'), password: text(raw, 'password'), ...(workspaceName ? optional(raw, 'workspaceName') : {}), sample: raw.sample === 'true' }))} fieldErrors={fieldErrors} linkComponent={linkComponent} submitLabel={submitLabel} busyLabel={busyLabel}
    after={signInInstead && <div className="t98-auth-aux"><FlowActionControl action={signInInstead} label={signInInstead.label ?? 'Sign in instead'} linkComponent={linkComponent} variant="ghost" /></div>}>
    <Field label="Your name" htmlFor={`${id}-name`} error={fieldErrors?.name}>
      <Input name="name" autoComplete="name" required maxLength={120} defaultValue={defaultValues?.name} />
    </Field>
    {setupToken && <Field label="Setup token" htmlFor={`${id}-token`} description={tokenHint} error={fieldErrors?.token}>
      <Input name="token" type="password" autoComplete="off" required minLength={tokenLength?.min} maxLength={tokenLength?.max} spellCheck={false} />
    </Field>}
    <Field label="Email address" htmlFor={`${id}-email`} error={fieldErrors?.email}>
      <Input name="email" type="email" autoComplete="username" required maxLength={254} defaultValue={defaultValues?.email} />
    </Field>
    <Field label="Password" htmlFor={`${id}-password`} description={passwordHint(passwordPolicy)} error={fieldErrors?.password}>
      <Input name="password" type="password" autoComplete="new-password" required minLength={passwordPolicy.minLength} maxLength={passwordPolicy.maxLength} />
    </Field>
    {workspaceName && <Field label="Workspace name" htmlFor={`${id}-workspace`} error={fieldErrors?.workspaceName}>
      <Input name="workspaceName" autoComplete="organization" required={workspaceNameRequired} maxLength={120} defaultValue={defaultValues?.workspaceName} />
    </Field>}
    {sampleOptIn && <div className="t98-auth-choice"><Checkbox name="sample" value="true" label={sampleOptIn.label} defaultChecked={sampleOptIn.defaultChecked} /></div>}
  </AuthFormFrame>;
}

const actionRow = (items: ReactNode[]) => {
  const shown = items.filter(Boolean);
  return shown.length ? <div className="t98-auth-aux">{shown}</div> : null;
};

export type TwoFactorMode = 'authenticator' | 'recovery';
export interface TwoFactorMessages {
  /** `{length}` is replaced with the code length. */
  authenticatorLabel: string; authenticatorDescription: string; recoveryLabel: string; recoveryDescription: string;
  /** Toggle button text: names the mode the person switches to. */
  useRecovery: string; useAuthenticator: string;
}
const twoFactorMessages: TwoFactorMessages = {
  authenticatorLabel: 'Authentication code', authenticatorDescription: 'Enter the {length}-digit code from your authenticator app.',
  recoveryLabel: 'Recovery code', recoveryDescription: 'Enter one of your saved recovery codes. Each code works once.',
  useRecovery: 'Use a recovery code', useAuthenticator: 'Use your authenticator app',
};
export interface TwoFactorChallengeFlowProps extends AuthFormBaseProps<TwoFactorValues> {
  /** The application owns the mode; the flow clears the code whenever it changes. */
  mode: TwoFactorMode;
  onModeChange: (mode: TwoFactorMode) => void;
  codeLength?: Partial<Record<TwoFactorMode, number>>;
  messages?: Partial<TwoFactorMessages>;
  submitLabel?: string;
  cancel?: LabelledAction;
}
/** Second-step sign-in with an authenticator or recovery code. The application verifies the code. */
export function TwoFactorChallengeFlow({ mode, onModeChange, codeLength, messages, submitLabel = 'Verify', busyLabel = 'Verifying…', cancel, linkComponent, fieldErrors, onSubmit, ...frame }: TwoFactorChallengeFlowProps) {
  const id = useId();
  const copy = { ...twoFactorMessages, ...messages };
  const recovery = mode === 'recovery';
  const length = codeLength?.[mode] ?? (recovery ? 21 : 6);
  return <AuthFormFrame {...frame} onSubmit={typed(onSubmit, raw => ({ code: text(raw, 'code'), mode }))} valueFields={{ mode }} fieldErrors={fieldErrors} linkComponent={linkComponent} submitLabel={submitLabel} busyLabel={busyLabel}
    after={actionRow([
      <Button key="mode" type="button" variant="ghost" size="sm" onClick={() => onModeChange(recovery ? 'authenticator' : 'recovery')}>{recovery ? copy.useAuthenticator : copy.useRecovery}</Button>,
      cancel && <FlowActionControl key="cancel" action={cancel} label={cancel.label ?? 'Back to sign in'} linkComponent={linkComponent} variant="ghost" />,
    ])}>
    <Field label={recovery ? copy.recoveryLabel : copy.authenticatorLabel} htmlFor={`${id}-code`} description={(recovery ? copy.recoveryDescription : copy.authenticatorDescription).replace('{length}', String(length))} error={fieldErrors?.code}>
      <Input key={mode} name="code" autoComplete="one-time-code" inputMode={recovery ? 'text' : 'numeric'} maxLength={length} required spellCheck={false} autoCapitalize="off" />
    </Field>
  </AuthFormFrame>;
}

export interface PasswordRecoveryMessages {
  loading: string; disabled: string; error: string; sent: string; invalid: string; resetIntro: string; mismatch: string;
}
const recoveryMessages: PasswordRecoveryMessages = {
  loading: 'Checking whether password reset is available…', disabled: 'Password reset is not available for this installation.', error: 'Password reset availability could not be checked.',
  sent: 'If an account exists for that email address, a reset link is on its way.', invalid: 'This reset link has expired or was already used.',
  resetIntro: 'Choose a new password for your account.', mismatch: 'The passwords do not match.',
};
interface PasswordRecoveryBaseProps extends Omit<AuthFormBaseProps, 'onSubmit'> {
  /** Reset stage: the reset token, held in memory by the application. It is posted as the hidden field `token`; the flow never reads or changes the address. */
  token?: string;
  /** Request stage: whether the application offers password reset. Omit it when known to be enabled. */
  availability?: 'loading' | 'enabled' | 'disabled' | 'error';
  /** Request stage: replaces the form with a confirmation. */
  sent?: boolean;
  /** Reset stage: the link is unusable, so the form is hidden. */
  invalid?: boolean;
  onRequestNewLink?: () => void;
  requestNewLinkLabel?: string;
  defaultValues?: { email?: string };
  passwordPolicy?: PasswordPolicy;
  messages?: Partial<PasswordRecoveryMessages>;
  submitLabel?: string;
  backToSignIn: LabelledAction;
}
export type PasswordRecoveryFlowProps = PasswordRecoveryBaseProps & (
  | { stage: 'request'; onSubmit?: (values: RecoveryRequestValues) => void | Promise<void> }
  | { stage: 'reset'; onSubmit?: (values: RecoveryResetValues) => void | Promise<void> }
);
/** Password reset request and new-password screens. The application sends links and checks tokens. */
export function PasswordRecoveryFlow({ stage, token, availability = 'enabled', sent = false, invalid = false, onRequestNewLink, requestNewLinkLabel = 'Request a new link', defaultValues, passwordPolicy = defaultPasswordPolicy, messages, submitLabel, busyLabel, backToSignIn, linkComponent, fieldErrors, onSubmit, ...frame }: PasswordRecoveryFlowProps) {
  const id = useId();
  const [mismatch, setMismatch] = useState(false);
  const copy = { ...recoveryMessages, ...messages };
  const backControl = <FlowActionControl key="back" action={backToSignIn} label={backToSignIn.label ?? 'Back to sign in'} linkComponent={linkComponent} variant="ghost" />;
  const back = actionRow([backControl]);
  const message = (tone: Tone, text: string, actions?: ReactNode) => <Stack gap={4}><Alert tone={tone} title={text} />{actions}{back}</Stack>;
  const common = { ...frame, linkComponent, onSubmit: stage === 'request' ? typed(onSubmit as ((values: RecoveryRequestValues) => void | Promise<void>) | undefined, raw => ({ email: text(raw, 'email') })) : typed(onSubmit as ((values: RecoveryResetValues) => void | Promise<void>) | undefined, raw => ({ password: text(raw, 'password'), confirmation: text(raw, 'confirmation'), ...optional(raw, 'token') })), valueFields: token && stage === 'reset' ? { token } : undefined };
  if (stage === 'request' && availability === 'loading') return <AuthFormFrame {...common}><div className="t98-auth-state" role="status"><span className="t98-spinner" aria-hidden="true" /><span>{copy.loading}</span></div>{back}</AuthFormFrame>;
  if (stage === 'request' && availability !== 'enabled') return <AuthFormFrame {...common}>{message(availability === 'error' ? 'danger' : 'info', availability === 'error' ? copy.error : copy.disabled)}</AuthFormFrame>;
  if (stage === 'request' && sent) return <AuthFormFrame {...common}>{message('success', copy.sent)}</AuthFormFrame>;
  if (stage === 'reset' && invalid) return <AuthFormFrame {...common}>{message('danger', copy.invalid, onRequestNewLink && <Button type="button" onClick={onRequestNewLink}>{requestNewLinkLabel}</Button>)}</AuthFormFrame>;
  if (stage === 'request') return <AuthFormFrame {...common} fieldErrors={fieldErrors} submitLabel={submitLabel ?? 'Send reset link'} busyLabel={busyLabel ?? 'Sending…'} after={back}>
    <Field label="Email address" htmlFor={`${id}-email`} error={fieldErrors?.email}>
      <Input name="email" type="email" autoComplete="username" required maxLength={254} defaultValue={defaultValues?.email} />
    </Field>
  </AuthFormFrame>;
  // Presentation-only check so a typo is caught before a request; the application still validates the password.
  const confirmationError = fieldErrors?.confirmation ?? (mismatch ? copy.mismatch : undefined);
  const clearMismatch = () => setMismatch(false);
  // The same mismatch also appears as the form-level alert, which takes focus after a submit like any other failure.
  // An error from the app is newer information, so it wins over the local mismatch message.
  return <AuthFormFrame {...common} error={frame.error ?? (mismatch ? copy.mismatch : undefined)} fieldErrors={{ ...fieldErrors, confirmation: confirmationError }} submitLabel={submitLabel ?? 'Reset password'} busyLabel={busyLabel ?? 'Resetting…'}
    after={actionRow([onRequestNewLink && <Button key="new-link" type="button" variant="ghost" size="sm" onClick={onRequestNewLink}>{requestNewLinkLabel}</Button>, backControl])}
    validate={values => { const same = values.password === values.confirmation; setMismatch(!same); return same; }}>
    <Text tone="muted" size="sm">{copy.resetIntro}</Text>
    <Field label="New password" htmlFor={`${id}-password`} description={passwordHint(passwordPolicy)} error={fieldErrors?.password}>
      <Input name="password" type="password" autoComplete="new-password" required minLength={passwordPolicy.minLength} maxLength={passwordPolicy.maxLength} onChange={clearMismatch} />
    </Field>
    <Field label="Confirm new password" htmlFor={`${id}-confirmation`} error={confirmationError}>
      <Input name="confirmation" type="password" autoComplete="new-password" required maxLength={passwordPolicy.maxLength} onChange={clearMismatch} />
    </Field>
  </AuthFormFrame>;
}

export type InvitationState = 'loading' | 'details' | 'signin-required' | 'mismatch' | 'unavailable' | 'accepted';
export interface InvitationDetails { workspaceName: string; email: string; role: string; expiresAt: string | Date }
export interface InvitationMessages { loading: string; mismatch: string; accepted: string; signInRequired: string; workspaceTerm: string; emailTerm: string; roleTerm: string; expiresTerm: string }
const invitationMessages: InvitationMessages = {
  loading: 'Loading the invitation…', mismatch: 'Signed in as {signedIn}; this invitation is for {invited}.', accepted: 'You joined {workspace}.',
  signInRequired: 'Sign in as {invited} to join {workspace}.',
  workspaceTerm: 'Workspace', emailTerm: 'Invited email', roleTerm: 'Role', expiresTerm: 'Expires',
};
export interface InvitationAcceptFlowProps extends AuthFormBaseProps<InvitationValues> {
  state: InvitationState;
  /** Invitation token, held in memory by the application. It is posted as the hidden field `token` and included in the onSubmit values; the flow never reads or changes the address. */
  token?: string;
  invitation?: InvitationDetails;
  /** Formats the expiry; pass a locale-aware formatter (the default is a medium English date in UTC). */
  formatDate?: (value: string | Date) => string;
  /** The role's display name, for example "Editor" for `editor`. Defaults to the raw role. */
  roleLabel?: (role: string) => string;
  /** Email of the current session, if any. */
  signedInEmail?: string;
  /** An account already exists for the invited email. */
  accountExists?: boolean;
  /** Sign-on providers shown when nobody is signed in. */
  providers?: ReactNode;
  onSignIn?: () => void;
  onSwitchAccount?: () => void;
  onRetry?: () => void;
  /** Label of the sign-in action. Defaults to "Sign in instead" beside the account form and "Sign in to join" when sign-in is required. */
  signInLabel?: string;
  /** Where to go after joining. */
  continueAction?: LabelledAction;
  passwordPolicy?: PasswordPolicy;
  messages?: Partial<InvitationMessages>;
  cancel?: LabelledAction;
}
/** Workspace invitation screens for every step of acceptance. The application validates the invitation and the session. */
export function InvitationAcceptFlow({ state, token, invitation, formatDate: ownFormatDate, roleLabel = role => role, signedInEmail, accountExists = false, providers, onSignIn, signInLabel, onSwitchAccount, onRetry, continueAction, passwordPolicy = defaultPasswordPolicy, messages, cancel, busyLabel, linkComponent, fieldErrors, onSubmit, ...frame }: InvitationAcceptFlowProps) {
  const formatDate = useFlowDate(ownFormatDate);
  const id = useId();
  const copy = { ...invitationMessages, ...messages };
  const fill = (text: string) => text.replace('{signedIn}', signedInEmail ?? '').replace('{invited}', invitation?.email ?? '').replace('{workspace}', invitation?.workspaceName ?? '');
  const effective = state === 'details' && !signedInEmail && accountExists ? 'signin-required' : state;
  const busy = frame.busy ?? false;
  const summary = invitation && <DescriptionList items={[
    { key: 'workspace', term: copy.workspaceTerm, description: invitation.workspaceName },
    { key: 'email', term: copy.emailTerm, description: invitation.email },
    { key: 'role', term: copy.roleTerm, description: roleLabel(invitation.role) },
    { key: 'expires', term: copy.expiresTerm, description: formatDate(invitation.expiresAt) },
  ]} />;
  const exit = cancel && <FlowActionControl key="exit" action={cancel} label={cancel.label ?? 'Cancel'} linkComponent={linkComponent} variant="ghost" />;
  const base = { ...frame, linkComponent, onSubmit: typed(onSubmit, raw => ({ ...optional(raw, 'name'), ...optional(raw, 'password'), ...optional(raw, 'token') })), valueFields: token ? { token } : undefined };

  if (effective === 'loading') return <AuthFormFrame {...base}><div className="t98-auth-state" role="status"><span className="t98-spinner" aria-hidden="true" /><span>{copy.loading}</span></div></AuthFormFrame>;
  if (effective === 'unavailable') return <AuthFormFrame {...base}>
    {actionRow([onRetry && <Button key="retry" type="button" variant="secondary" size="sm" onClick={onRetry}>Try again</Button>, exit])}
  </AuthFormFrame>;
  if (effective === 'accepted') return <AuthFormFrame {...base}>
    <Alert tone="success" title={fill(copy.accepted)} />
    {continueAction && actionRow([<FlowActionControl key="go" action={continueAction} label={continueAction.label ?? 'Open workspace'} linkComponent={linkComponent} variant="secondary" />])}
  </AuthFormFrame>;
  if (effective === 'mismatch') return <AuthFormFrame {...base}>
    {summary}
    <Alert tone="warning" title={fill(copy.mismatch)} />
    {actionRow([onSwitchAccount && <Button key="switch" type="button" onClick={onSwitchAccount} disabled={busy}>Switch account</Button>, exit])}
  </AuthFormFrame>;
  if (effective === 'signin-required') return <AuthFormFrame {...base} below={providers}>
    {summary}
    <Text tone="muted" size="sm">{fill(copy.signInRequired)}</Text>
    <Button type="button" loading={busy} onClick={onSignIn}>{signInLabel ?? 'Sign in to join'}</Button>
    {actionRow([exit])}
  </AuthFormFrame>;
  const joining = Boolean(signedInEmail);
  return <AuthFormFrame {...base} fieldErrors={fieldErrors} submitLabel={joining ? 'Join workspace' : 'Create account and join'} busyLabel={busyLabel ?? (joining ? 'Joining…' : 'Creating account…')} below={joining ? undefined : providers}
    after={actionRow([!joining && onSignIn && <Button key="signin" type="button" variant="ghost" size="sm" onClick={onSignIn}>{signInLabel ?? 'Sign in instead'}</Button>, exit])}>
    {summary}
    {!joining && <>
      <Field label="Your name" htmlFor={`${id}-name`} error={fieldErrors?.name}>
        <Input name="name" autoComplete="name" required maxLength={120} />
      </Field>
      <Field label="Password" htmlFor={`${id}-password`} description={passwordHint(passwordPolicy)} error={fieldErrors?.password}>
        <Input name="password" type="password" autoComplete="new-password" required minLength={passwordPolicy.minLength} maxLength={passwordPolicy.maxLength} />
      </Field>
    </>}
  </AuthFormFrame>;
}

export type WorkspaceSignOut = { label?: string } & ({ onClick: () => void; action?: never; method?: never; hiddenFields?: never } | { action: string; method?: 'post'; hiddenFields?: Record<string, string>; onClick?: never });
export interface WorkspaceOnboardingProps extends Omit<AuthFormBaseProps<WorkspaceCreateValues>, 'title'> {
  title?: string;
  /** The signed-in account's email. */
  email: string;
  subheading?: string;
  help?: string;
  defaultValues?: { name?: string };
  /** Label of the name field, for example "Project name" for a create-first-project step. Defaults to "Workspace name". */
  nameLabel?: string;
  /** Field error for a name of only spaces. Defaults to "Enter a workspace name." built from nameLabel; set it for other wording or languages. */
  nameBlankMessage?: string;
  /** A checkbox inside the form, for example "Add sample data"; its value is submitted as `sample`. `false` or omitted hides it. */
  sampleOptIn?: { label: string; defaultChecked?: boolean } | false;
  submitLabel?: string;
  onRefresh?: () => void;
  refreshLabel?: string;
  signOut?: WorkspaceSignOut;
  /** Link to account settings, shown with Refresh and Sign out. */
  account?: AuthAction & { label: string };
  /** Shows a secondary button beside the submit button, for example "Skip for now" on a create-first-project step. */
  onSkip?: () => void;
  skipLabel?: string;
  /** Extra content below the actions, for example pending invitations. */
  children?: ReactNode;
}
/** Shown to a signed-in account that has no workspace access yet: create one, refresh access or sign out. */
export function WorkspaceOnboarding({ title = 'Workspace access', email, subheading = 'Create a workspace', help, defaultValues, nameLabel = 'Workspace name', nameBlankMessage = `Enter a ${nameLabel.toLowerCase()}.`, sampleOptIn = false, onSkip, skipLabel = 'Skip for now', submitLabel = 'Create workspace', busyLabel = 'Creating workspace…', onRefresh, refreshLabel = 'Refresh access', signOut, account, children, fieldErrors, onSubmit, ...frame }: WorkspaceOnboardingProps) {
  const id = useId();
  const signOutLabel = signOut?.label ?? 'Sign out';
  // A name of only spaces gets the same field error as in the create flows, instead of reaching the server.
  const [blank, setBlank] = useState(false);
  return <AuthFormFrame {...frame} onSubmit={typed(onSubmit, raw => ({ name: text(raw, 'name').trim(), ...(sampleOptIn ? { sample: raw.sample === 'true' } : {}) }))}
    validate={raw => { const ok = Boolean(text(raw, 'name').trim()); setBlank(!ok); if (!ok) document.getElementById(`${id}-name`)?.focus(); return ok; }} title={title} description={`Signed in as ${email}`} fieldErrors={fieldErrors} submitLabel={submitLabel} busyLabel={busyLabel}
    after={onSkip && actionRow([<Button key="skip" type="button" variant="ghost" size="sm" onClick={onSkip}>{skipLabel}</Button>])}
    below={(onRefresh || signOut || account || children) && <Stack gap={4}>
      {(onRefresh || signOut || account) && <div className="t98-auth-aux">
        {onRefresh && <Button type="button" variant="secondary" size="sm" onClick={onRefresh}>{refreshLabel}</Button>}
        {account && <FlowActionControl action={account} label={account.label} linkComponent={frame.linkComponent} variant="ghost" />}
        {signOut && (signOut.action !== undefined
          ? <form action={signOut.action} method="post">
            <HiddenInputs fields={signOut.hiddenFields} />
            <Button type="submit" variant="ghost" size="sm">{signOutLabel}</Button>
          </form>
          : <Button type="button" variant="ghost" size="sm" onClick={signOut.onClick}>{signOutLabel}</Button>)}
      </div>}
      {children}
    </Stack>}>
    <Heading level={2} className="t98-auth-subheading">{subheading}</Heading>
    {help && <Text tone="muted" size="sm">{help}</Text>}
    <Field label={nameLabel} htmlFor={`${id}-name`} error={fieldErrors?.name ?? fieldErrors?.workspaceName ?? (blank ? nameBlankMessage : undefined)}>
      <Input name="name" autoComplete="organization" required maxLength={120} defaultValue={defaultValues?.name} />
    </Field>
    {sampleOptIn && <div className="t98-auth-choice"><Checkbox name="sample" value="true" label={sampleOptIn.label} defaultChecked={sampleOptIn.defaultChecked} /></div>}
  </AuthFormFrame>;
}

export interface OidcProvider { id: string; name: string; href?: string }
export interface OidcProviderButtonsProps {
  /** `null` while unknown. An empty list renders nothing. */
  providers: readonly OidcProvider[] | null;
  loading?: boolean;
  loadingLabel?: string;
  /** Failure loading or starting a provider, supplied by the application. With providers listed it shows below the buttons, which stay usable. */
  error?: string;
  /** Called for a provider without `href`; the application starts the redirect. */
  onStart?: (id: string) => void;
  onRetry?: () => void;
  retryLabel?: string;
  /** Id of the provider being started; it shows loading and the others are disabled. */
  pending?: string | null;
  /** Status announced while a provider is being started. */
  pendingLabel?: string;
  dividerLabel?: string;
  labelFor?: (provider: OidcProvider) => string;
}
/** Sign-on provider choices below a divider. Providers with `href` are native links. */
export function OidcProviderButtons({ providers, loading = false, loadingLabel = 'Loading sign-in options…', error, onStart, onRetry, retryLabel = 'Try again', pending = null, pendingLabel = 'Contacting the provider…', dividerLabel = 'or continue with', labelFor = provider => `Continue with ${provider.name}` }: OidcProviderButtonsProps) {
  const divider = <div className="or-divider"><span>{dividerLabel}</span></div>;
  if (loading && !providers?.length) return <div className="t98-auth-providers">{divider}<div className="t98-auth-state" role="status"><span className="t98-spinner" aria-hidden="true" /><span>{loadingLabel}</span></div></div>;
  const listed = Boolean(providers?.length);
  if (!listed && !error) return null;
  const failure = error && <Alert tone="danger" title={error} actions={!listed && onRetry ? <Button type="button" variant="secondary" size="sm" onClick={onRetry}>{retryLabel}</Button> : undefined} />;
  if (!listed) return <div className="t98-auth-providers">{divider}{failure}</div>;
  return <div className="t98-auth-providers">{divider}
    <Stack as="ul" gap={2} aria-label="Sign-in providers">
      {providers!.map(provider => <Stack as="li" gap={0} key={provider.id}>
        {provider.href !== undefined
          ? <a className="t98-button t98-button--secondary t98-auth-provider" href={provider.href}>{labelFor(provider)}</a>
          : <Button type="button" variant="secondary" className="t98-auth-provider" loading={pending === provider.id} disabled={pending != null && pending !== provider.id} onClick={() => onStart?.(provider.id)}>{labelFor(provider)}</Button>}
      </Stack>)}
    </Stack>
    {pending != null && <div className="t98-auth-state" role="status"><span className="t98-spinner" aria-hidden="true" /><span>{pendingLabel}</span></div>}
    {failure}
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
