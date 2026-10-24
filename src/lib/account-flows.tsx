'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Alert, Badge, Button, Field, Input, Select, type SelectOption } from './primitives.js';
import { Combobox, CodeBlock, RadioGroup, StatusLine } from './controls.js';
import { DataTable, type DataColumn } from './patterns.js';
import { DescriptionList, FormActions, Heading, Image, Inline, Link, Stack, Text, type LinkProps } from './structure.js';
import { ConfirmDialog, CopyButton } from './workspace.js';
import { SettingsFlow, TargetConfirm, formText, formatFlowDate, passwordHint, staticTable, useSingleSubmit } from './flow-frame.js';
import { defaultPasswordPolicy, type OidcProvider, type PasswordPolicy } from './auth-flows.js';
import type { FlowState, Submit } from './settings-base.js';

/* Presentation-only account settings flows. Applications keep requests, authorization, secrets and sessions, and supply
 * every message; each value below is edited only here, so an application does not repeat these controls elsewhere. */

/* ---------------------------------------------------------------- Profile */

export type AccountTheme = 'system' | 'light' | 'dark';
/** `locale` and `timeZone` are present only when the flow offers them (see `localeOptions` and `timeZones`). */
export interface AccountProfileValues { name: string; theme: AccountTheme; locale?: string; timeZone?: string }
export interface AccountProfileMessages {
  name: string; email: string; emailChange: string; theme: string; themeSystem: string; themeLight: string; themeDark: string; locale: string; timeZone: string;
  timeZoneInvalid: string; detect: string; detected: string; detectFailed: string; save: string; saving: string;
}
const profileMessages: AccountProfileMessages = {
  name: 'Name', email: 'Email address', emailChange: 'Change email address', theme: 'Theme', themeSystem: 'Match system', themeLight: 'Light', themeDark: 'Dark', locale: 'Language and region',
  timeZone: 'Time zone', timeZoneInvalid: 'Choose a time zone from the list.', detect: 'Use my time zone', detected: 'Time zone set from this device.',
  detectFailed: 'This device did not report a supported time zone.', save: 'Save changes', saving: 'Saving…',
};
export interface AccountProfileFlowProps extends FlowState {
  /** Read-only: changing it is a separate, verified process the application owns. */
  email: string;
  emailHref?: string;
  defaultValues: AccountProfileValues;
  /** Omit when the application stores no language preference: the field is not rendered or submitted. */
  localeOptions?: SelectOption[];
  /** Omit when the application stores no time zone: the field, its validation and detection are not rendered or submitted. */
  timeZones?: string[];
  /** Returns the device time zone, or null when it cannot be determined. */
  onDetectTimeZone?: () => string | null;
  onSubmit: Submit<AccountProfileValues>;
  onDirtyChange?: (dirty: boolean) => void;
  title?: string;
  description?: string;
  messages?: Partial<AccountProfileMessages>;
  linkComponent?: LinkProps['component'];
}
/** Name, theme, language and time zone. The email is shown but never edited here. */
export function AccountProfileFlow({ email, emailHref, defaultValues, localeOptions, timeZones, onDetectTimeZone, onSubmit, onDirtyChange, title = 'Profile', description, messages, linkComponent, fieldErrors, ...state }: AccountProfileFlowProps) {
  const id = useId();
  const copy = { ...profileMessages, ...messages };
  const [values, setValues] = useState<AccountProfileValues>(defaultValues);
  const [zoneError, setZoneError] = useState<string>();
  const [detectStatus, setDetectStatus] = useState<{ tone: 'success' | 'warning'; text: string }>();
  const single = useSingleSubmit();
  const dirty = values.name !== defaultValues.name || values.theme !== defaultValues.theme || values.locale !== defaultValues.locale || values.timeZone !== defaultValues.timeZone;
  const lastDirty = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (lastDirty.current === dirty) return;
    lastDirty.current = dirty;
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  const set = <K extends keyof AccountProfileValues>(key: K, value: AccountProfileValues[K]) => setValues(current => ({ ...current, [key]: value }));
  function detect() {
    const zone = onDetectTimeZone?.() ?? null;
    if (zone && timeZones?.includes(zone)) { set('timeZone', zone); setZoneError(undefined); setDetectStatus({ tone: 'success', text: copy.detected }); }
    else setDetectStatus({ tone: 'warning', text: copy.detectFailed });
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (timeZones && !timeZones.includes(values.timeZone ?? '')) { setZoneError(copy.timeZoneInvalid); return; }
    setZoneError(undefined);
    // Only offered fields are submitted, so an application never receives values it has no home for.
    const submitted: AccountProfileValues = { name: values.name.trim(), theme: values.theme };
    if (localeOptions) submitted.locale = values.locale ?? '';
    if (timeZones) submitted.timeZone = values.timeZone ?? '';
    void single(() => onSubmit(submitted));
  }
  return <SettingsFlow {...state} title={title} description={description} onSubmit={submit} submitLabel={copy.save} busyLabel={state.busyLabel ?? copy.saving} submitDisabled={!dirty && !state.busy}>
    <Field label={copy.email} htmlFor={`${id}-email`}>
      <Input id={`${id}-email`} name="email" type="email" value={email} readOnly autoComplete="email" />
    </Field>
    {emailHref && <Link href={emailHref} variant="standalone" component={linkComponent}>{copy.emailChange}</Link>}
    <Field label={copy.name} htmlFor={`${id}-name`} error={fieldErrors?.name}>
      <Input id={`${id}-name`} name="name" autoComplete="name" required maxLength={120} value={values.name} onChange={event => set('name', event.target.value)} />
    </Field>
    <RadioGroup name="theme" legend={copy.theme} orientation="horizontal" value={values.theme} onValueChange={value => set('theme', value as AccountTheme)} error={fieldErrors?.theme}
      options={[{ value: 'system', label: copy.themeSystem }, { value: 'light', label: copy.themeLight }, { value: 'dark', label: copy.themeDark }]} />
    {localeOptions && <Field label={copy.locale} htmlFor={`${id}-locale`} error={fieldErrors?.locale}>
      <Select id={`${id}-locale`} name="locale" options={localeOptions} value={values.locale ?? ''} onChange={event => set('locale', event.target.value)} />
    </Field>}
    {timeZones && <Combobox name="timeZone" label={copy.timeZone} options={timeZones} value={values.timeZone ?? ''} onValueChange={value => { set('timeZone', value); setZoneError(undefined); }} allowCustom={false} required error={zoneError ?? fieldErrors?.timeZone} />}
    {timeZones && onDetectTimeZone && <Stack gap={2}>
      <Button type="button" variant="secondary" onClick={detect}>{copy.detect}</Button>
      {detectStatus && <StatusLine tone={detectStatus.tone}>{detectStatus.text}</StatusLine>}
    </Stack>}
  </SettingsFlow>;
}

/* --------------------------------------------------------------- Password */

export interface PasswordChangeValues { currentPassword: string; newPassword: string }
export interface PasswordChangeMessages {
  current: string; next: string; confirmation: string; mismatch: string; submit: string; submitting: string; noPassword: string; setPassword: string;
}
const passwordMessages: PasswordChangeMessages = {
  current: 'Current password', next: 'New password', confirmation: 'Confirm new password', mismatch: 'The passwords do not match.', submit: 'Change password', submitting: 'Changing…',
  noPassword: 'This account signs in with a linked provider and has no password.', setPassword: 'Set a password',
};
export interface PasswordChangeFlowProps extends FlowState {
  policy?: PasswordPolicy;
  /** False when the account has no password: the form is replaced with a link to where one is set. */
  hasPassword: boolean;
  setPasswordHref?: string;
  onSubmit: Submit<PasswordChangeValues>;
  title?: string;
  description?: string;
  messages?: Partial<PasswordChangeMessages>;
  linkComponent?: LinkProps['component'];
}
/** Change password. The application verifies the current password and applies the policy; the match check is only a typo guard. */
export function PasswordChangeFlow({ policy = defaultPasswordPolicy, hasPassword, setPasswordHref, onSubmit, title = 'Password', description, messages, linkComponent, fieldErrors, ...state }: PasswordChangeFlowProps) {
  const id = useId();
  const copy = { ...passwordMessages, ...messages };
  const [mismatch, setMismatch] = useState(false);
  const single = useSingleSubmit();
  if (!hasPassword) return <SettingsFlow {...state} title={title} description={description}>
    <Alert tone="info" title={copy.noPassword} />
    {setPasswordHref && <Link href={setPasswordHref} variant="standalone" component={linkComponent}>{copy.setPassword}</Link>}
  </SettingsFlow>;
  const confirmationError = fieldErrors?.confirmation ?? (mismatch ? copy.mismatch : undefined);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const read = (name: string) => formText(data, name);
    const newPassword = read('newPassword');
    if (newPassword !== read('confirmation')) { setMismatch(true); return; }
    setMismatch(false);
    void single(() => onSubmit({ currentPassword: read('currentPassword'), newPassword }));
  }
  return <SettingsFlow {...state} title={title} description={description} onSubmit={submit} submitLabel={copy.submit} busyLabel={state.busyLabel ?? copy.submitting}>
    <Field label={copy.current} htmlFor={`${id}-current`} error={fieldErrors?.currentPassword}>
      <Input id={`${id}-current`} name="currentPassword" type="password" autoComplete="current-password" required maxLength={policy.maxLength} />
    </Field>
    <Field label={copy.next} htmlFor={`${id}-new`} description={passwordHint(policy)} error={fieldErrors?.newPassword}>
      <Input id={`${id}-new`} name="newPassword" type="password" autoComplete="new-password" required minLength={policy.minLength} maxLength={policy.maxLength} onChange={() => setMismatch(false)} />
    </Field>
    <Field label={copy.confirmation} htmlFor={`${id}-confirmation`} error={confirmationError}>
      <Input id={`${id}-confirmation`} name="confirmation" type="password" autoComplete="new-password" required maxLength={policy.maxLength} onChange={() => setMismatch(false)} />
    </Field>
  </SettingsFlow>;
}

/* ------------------------------------------------------------ Two-factor */

export type TwoFactorSetupStage = 'off' | 'enrolling' | 'codes' | 'on';
/** `qrDataUrl` is optional: without it the flow shows the setup key and the `uri` (otpauth link), each with a copy action. */
export interface TwoFactorEnrolment { qrDataUrl?: string; manualKey: string; uri?: string }
export interface TwoFactorSetupMessages {
  statusOff: string; statusOn: string; password: string; start: string; starting: string; qrAlt: string; scan: string; manualKey: string; openApp: string;
  code: string; codeHint: string; verify: string; verifying: string; codesIntro: string; copyAll: string; download: string; downloadFailed: string; acknowledge: string;
  manage: string; regenerate: string; regenerateTitle: string; regenerateDescription: string; disable: string; disableTitle: string; disableDescription: string; passwordRequired: string;
  scanWithoutQr: string; setupLink: string; copyKey: string; copyLink: string; disableCode: string; disableCodeRequired: string;
}
const twoFactorMessages: TwoFactorSetupMessages = {
  statusOff: 'Two-factor authentication is off.', statusOn: 'Two-factor authentication is on.', password: 'Current password', start: 'Set up two-factor authentication', starting: 'Starting…',
  qrAlt: 'QR code to scan with your authenticator app', scan: 'Scan the code with your authenticator app, or enter the key by hand.', manualKey: 'Setup key', openApp: 'Open in authenticator app',
  code: 'Authentication code', codeHint: 'Enter the {length}-digit code shown in your app.', verify: 'Turn on', verifying: 'Verifying…',
  codesIntro: 'Save these recovery codes somewhere safe. Each works once if you lose your authenticator. They are not shown again.', copyAll: 'Copy all', download: 'Download', downloadFailed: 'The file could not be saved. Copy the codes instead.',
  acknowledge: 'I saved these codes', manage: 'Confirm with your password to change two-factor settings.', regenerate: 'Regenerate recovery codes', regenerateTitle: 'Regenerate recovery codes?',
  regenerateDescription: 'Your current recovery codes stop working as soon as new ones are created.', disable: 'Turn off two-factor authentication', disableTitle: 'Turn off two-factor authentication?',
  disableDescription: 'Your account will be protected by your password alone.', passwordRequired: 'Enter your current password.',
  scanWithoutQr: 'Enter the setup key in your authenticator app, or open the setup link on this device.', setupLink: 'Setup link', copyKey: 'Copy key', copyLink: 'Copy link',
  disableCode: 'Authenticator or recovery code', disableCodeRequired: 'Enter a code from your authenticator app or a recovery code.',
};

/**
 * Saves text as a file with the FileSaver.js (MIT, Eli Grey) approach: a Blob, an object URL and a download anchor
 * clicked programmatically, with the URL revoked afterwards so the Blob can be released.
 */
function saveTextFile(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.rel = 'noopener';
  anchor.hidden = true;
  // Some browsers ignore downloads from detached anchors, so attach it for the click, as FileSaver.js does.
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4e4);
}

export interface TwoFactorSetupFlowProps extends FlowState {
  stage: TwoFactorSetupStage;
  enrolment?: TwoFactorEnrolment;
  /** Shown only in the `codes` stage; the application must not resend them later. */
  recoveryCodes?: string[];
  codeLength?: number;
  downloadName?: string;
  onStart: Submit<{ password: string }>;
  onVerify: Submit<{ code: string }>;
  onAcknowledgeCodes: () => void | Promise<void>;
  onRegenerate: Submit<{ password: string }>;
  /** Receives `code` too when `disableRequiresCode` is set. */
  onDisable: Submit<{ password: string; code?: string }>;
  /** Asks for an authenticator or recovery code as well as the password before turning two-factor off. */
  disableRequiresCode?: boolean;
  title?: string;
  description?: string;
  messages?: Partial<TwoFactorSetupMessages>;
  linkComponent?: LinkProps['component'];
}
type TwoFactorAction = 'regenerate' | 'disable';
/** Two-factor enrolment and management. The application verifies passwords and codes and generates the secrets. */
export function TwoFactorSetupFlow({ stage, enrolment, recoveryCodes = [], codeLength = 6, downloadName = 'recovery-codes.txt', onStart, onVerify, onAcknowledgeCodes, onRegenerate, onDisable, disableRequiresCode = false, title = 'Two-factor authentication', description, messages, linkComponent, fieldErrors, ...state }: TwoFactorSetupFlowProps) {
  const id = useId();
  const copy = { ...twoFactorMessages, ...messages };
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string>();
  const [confirming, setConfirming] = useState<TwoFactorAction>();
  const [disableCode, setDisableCode] = useState('');
  const [codeError, setCodeError] = useState<string>();
  const [saveError, setSaveError] = useState(false);
  const single = useSingleSubmit();
  const read = (event: FormEvent<HTMLFormElement>, name: string) => formText(new FormData(event.currentTarget), name);
  const passwordField = <Field label={copy.password} htmlFor={`${id}-password`} error={passwordError ?? fieldErrors?.password}>
    <Input id={`${id}-password`} name="password" type="password" autoComplete="current-password" required value={password} onChange={event => { setPassword(event.target.value); setPasswordError(undefined); }} />
  </Field>;

  if (stage === 'off') return <SettingsFlow {...state} title={title} description={description} submitLabel={copy.start} busyLabel={state.busyLabel ?? copy.starting}
    onSubmit={event => { event.preventDefault(); void single(() => onStart({ password: read(event, 'password') })); }}>
    <Badge>{copy.statusOff}</Badge>
    {passwordField}
  </SettingsFlow>;

  if (stage === 'enrolling') return <SettingsFlow {...state} title={title} description={description} submitLabel={copy.verify} busyLabel={state.busyLabel ?? copy.verifying}
    onSubmit={event => { event.preventDefault(); void single(() => onVerify({ code: read(event, 'code').trim() })); }}>
    <Text tone="muted" size="sm">{enrolment && !enrolment.qrDataUrl ? copy.scanWithoutQr : copy.scan}</Text>
    {enrolment && <Stack gap={3}>
      {enrolment.qrDataUrl && <div className="t98-account-qr"><Image src={enrolment.qrDataUrl} alt={copy.qrAlt} fit="contain" aspect="square" loading="eager" /></div>}
      <Field label={copy.manualKey} htmlFor={`${id}-key`}>
        <Text as="code" id={`${id}-key`} mono className="t98-account-key">{enrolment.manualKey}</Text>
      </Field>
      <Inline>
        <CopyButton value={enrolment.manualKey} label={copy.copyKey} />
        {enrolment.uri && <Link href={enrolment.uri} variant="standalone" component={linkComponent}>{copy.openApp}</Link>}
      </Inline>
      {/* Without a QR image the link is the only way to hand the secret to another device, so it is shown and copyable. */}
      {!enrolment.qrDataUrl && enrolment.uri && <>
        <Field label={copy.setupLink} htmlFor={`${id}-uri`}>
          <Text as="code" id={`${id}-uri`} mono className="t98-account-key">{enrolment.uri}</Text>
        </Field>
        <Inline><CopyButton value={enrolment.uri} label={copy.copyLink} /></Inline>
      </>}
    </Stack>}
    <Field label={copy.code} htmlFor={`${id}-code`} description={copy.codeHint.replace('{length}', String(codeLength))} error={fieldErrors?.code}>
      <Input id={`${id}-code`} name="code" autoComplete="one-time-code" inputMode="numeric" pattern={`[0-9]{${codeLength}}`} maxLength={codeLength} required spellCheck={false} autoCapitalize="off" />
    </Field>
  </SettingsFlow>;

  if (stage === 'codes') {
    const text = recoveryCodes.join('\n');
    const download = () => {
      try { saveTextFile(downloadName, `${text}\n`); setSaveError(false); } catch { setSaveError(true); }
    };
    return <SettingsFlow {...state} title={title} description={description} extraActions={<Button type="button" onClick={() => void single(onAcknowledgeCodes)}>{copy.acknowledge}</Button>}>
      <Text tone="muted" size="sm">{copy.codesIntro}</Text>
      <CodeBlock code={text} label="Recovery codes" />
      <Inline>
        <CopyButton value={text} label={copy.copyAll} />
        <Button type="button" variant="secondary" size="sm" onClick={download}>{copy.download}</Button>
      </Inline>
      {saveError && <StatusLine tone="warning">{copy.downloadFailed}</StatusLine>}
    </SettingsFlow>;
  }

  const target = confirming === 'disable' ? { title: copy.disableTitle, description: copy.disableDescription, label: copy.disable, run: onDisable } : { title: copy.regenerateTitle, description: copy.regenerateDescription, label: copy.regenerate, run: onRegenerate };
  const ask = (action: TwoFactorAction) => {
    const missingCode = action === 'disable' && disableRequiresCode && !disableCode.trim();
    if (!password) setPasswordError(copy.passwordRequired);
    if (missingCode) setCodeError(copy.disableCodeRequired);
    if (!password || missingCode) return;
    setConfirming(action);
  };
  return <SettingsFlow {...state} title={title} description={description} onSubmit={event => event.preventDefault()}>
    <Badge tone="success">{copy.statusOn}</Badge>
    <Text tone="muted" size="sm">{copy.manage}</Text>
    {passwordField}
    {disableRequiresCode && <Field label={copy.disableCode} htmlFor={`${id}-disable-code`} error={codeError ?? fieldErrors?.code}>
      <Input id={`${id}-disable-code`} name="code" autoComplete="one-time-code" spellCheck={false} autoCapitalize="off" value={disableCode}
        onChange={event => { setDisableCode(event.target.value); setCodeError(undefined); }} />
    </Field>}
    <FormActions>
      <Button type="button" variant="secondary" onClick={() => ask('regenerate')}>{copy.regenerate}</Button>
      <Button type="button" variant="danger" onClick={() => ask('disable')}>{copy.disable}</Button>
    </FormActions>
    <ConfirmDialog open={confirming !== undefined} onOpenChange={open => { if (!open) setConfirming(undefined); }} title={target.title} description={target.description} confirmLabel={target.label} danger={confirming === 'disable'}
      onConfirm={() => confirming === 'disable' && disableRequiresCode ? onDisable({ password, code: disableCode.trim() }) : target.run({ password })} />
  </SettingsFlow>;
}

/* --------------------------------------------------------------- Sessions */

export interface AccountSession { id: string; device: string; location?: string; lastActiveAt: string | Date; current: boolean }
export interface SessionListMessages {
  device: string; location: string; lastActive: string; current: string; revoke: string; actions: string; empty: string;
  revokeTitle: string; revokeDescription: string; revokeOthers: string; revokeOthersTitle: string; revokeOthersDescription: string;
}
const sessionMessages: SessionListMessages = {
  device: 'Device', location: 'Location', lastActive: 'Last active', current: 'This device', revoke: 'Sign out', actions: 'Actions', empty: 'No active sessions.',
  revokeTitle: 'Sign out this session?', revokeDescription: 'The device is signed out the next time it contacts the server.',
  revokeOthers: 'Sign out all other sessions', revokeOthersTitle: 'Sign out all other sessions?', revokeOthersDescription: 'Every device except this one is signed out.',
};
export interface SessionListFlowProps extends FlowState {
  sessions: AccountSession[];
  onRevoke: Submit<{ id: string }>;
  onRevokeOthers: () => void | Promise<void>;
  formatDate?: (value: string | Date) => string;
  title?: string;
  description?: string;
  messages?: Partial<SessionListMessages>;
}
/** Active sessions with sign-out. The current session is marked and offers no revoke action. */
export function SessionListFlow({ sessions, onRevoke, onRevokeOthers, formatDate = formatFlowDate, title = 'Active sessions', description, messages, ...state }: SessionListFlowProps) {
  const copy = { ...sessionMessages, ...messages };
  const [target, setTarget] = useState<AccountSession>();
  const [others, setOthers] = useState(false);
  const locked = state.busy || state.disabled;
  const columns: DataColumn<AccountSession>[] = [
    { key: 'device', header: copy.device, rowHeader: true, wrap: true, render: row => <Inline gap={2}><span>{row.device}</span>{row.current && <Badge tone="success">{copy.current}</Badge>}</Inline> },
    { key: 'location', header: copy.location, wrap: true, render: row => row.location ?? '' },
    { key: 'lastActiveAt', header: copy.lastActive, render: row => <Text as="time" size="sm">{formatDate(row.lastActiveAt)}</Text> },
  ];
  return <SettingsFlow {...state} title={title} description={description} >
    <DataTable<AccountSession> ariaLabel={title} columns={columns} rows={sessions} rowKey={row => row.id} {...staticTable} emptyTitle={copy.empty}
      rowActionsLabel={copy.actions} rowActions={row => row.current ? null : <Button type="button" variant="secondary" size="sm" disabled={locked} aria-label={`${copy.revoke}: ${row.device}`} onClick={() => setTarget(row)}>{copy.revoke}</Button>} />
    <FormActions>
      <Button type="button" variant="danger" disabled={locked || sessions.every(session => session.current)} onClick={() => setOthers(true)}>{copy.revokeOthers}</Button>
    </FormActions>
    <TargetConfirm target={target} onClose={() => setTarget(undefined)} title={copy.revokeTitle} description={copy.revokeDescription} subject={row => row.device} confirmLabel={copy.revoke} onConfirm={row => onRevoke({ id: row.id })} />
    <ConfirmDialog open={others} onOpenChange={setOthers} title={copy.revokeOthersTitle} description={copy.revokeOthersDescription} confirmLabel={copy.revokeOthers} danger onConfirm={onRevokeOthers} />
  </SettingsFlow>;
}

/* ------------------------------------------------------ Linked identities */

export interface LinkedIdentity { id: string; providerName: string; email?: string; linkedAt: string | Date }
export interface PendingIdentityProof { providerName: string; issuer: string; subject: string; email?: string; expiresAt: string | Date }
export interface LinkedIdentitiesMessages {
  provider: string; email: string; linkedOn: string; actions: string; unlink: string; empty: string; password: string; passwordRequired: string; lastMethod: string;
  link: string; linkHeading: string; unlinkTitle: string; unlinkDescription: string; proofTitle: string; proofIntro: string; issuer: string; subject: string; expires: string; confirmProof: string; dismissProof: string;
}
const identityMessages: LinkedIdentitiesMessages = {
  provider: 'Provider', email: 'Email', linkedOn: 'Linked', actions: 'Actions', unlink: 'Unlink', empty: 'No linked sign-in providers.', password: 'Current password',
  passwordRequired: 'Enter your current password.', lastMethod: 'This is your only way to sign in. Set a password before unlinking it.',
  link: 'Link {provider}', linkHeading: 'Link another provider', unlinkTitle: 'Unlink this provider?', unlinkDescription: 'You can no longer sign in with it until you link it again.',
  proofTitle: 'Confirm {provider} account', proofIntro: 'Check these details belong to the account you want to link.', issuer: 'Issuer', subject: 'Subject', expires: 'Expires',
  confirmProof: 'Link this account', dismissProof: 'Cancel',
};
export interface LinkedIdentitiesFlowProps extends FlowState {
  identities: LinkedIdentity[];
  providers: OidcProvider[];
  /** Whether the account has a password; without one the last identity cannot be unlinked. */
  hasPassword: boolean;
  onLink: (providerId: string) => void;
  onUnlink: Submit<{ id: string; password: string }>;
  pendingProof?: PendingIdentityProof;
  onConfirmProof?: () => void | Promise<void>;
  onDismissProof?: () => void;
  formatDate?: (value: string | Date) => string;
  title?: string;
  description?: string;
  messages?: Partial<LinkedIdentitiesMessages>;
}
/** Linked sign-in providers. The application verifies ownership and the password; the flow only blocks the last method. */
export function LinkedIdentitiesFlow({ identities, providers, hasPassword, onLink, onUnlink, pendingProof, onConfirmProof, onDismissProof, formatDate = formatFlowDate, title = 'Linked sign-in providers', description, messages, fieldErrors, ...state }: LinkedIdentitiesFlowProps) {
  const id = useId();
  const copy = { ...identityMessages, ...messages };
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string>();
  const [target, setTarget] = useState<LinkedIdentity>();
  const locked = state.busy || state.disabled;
  const blocked = !hasPassword && identities.length <= 1;
  const ask = (identity: LinkedIdentity) => {
    if (hasPassword && !password) { setPasswordError(copy.passwordRequired); return; }
    setTarget(identity);
  };
  const columns: DataColumn<LinkedIdentity>[] = [
    { key: 'providerName', header: copy.provider, rowHeader: true, wrap: true },
    { key: 'email', header: copy.email, wrap: true, render: row => row.email ?? '' },
    { key: 'linkedAt', header: copy.linkedOn, render: row => formatDate(row.linkedAt) },
  ];
  return <SettingsFlow {...state} title={title} description={description}>
    {blocked && <Alert tone="info" title={copy.lastMethod} />}
    {hasPassword && <Field label={copy.password} htmlFor={`${id}-password`} error={passwordError ?? fieldErrors?.password}>
      <Input id={`${id}-password`} name="password" type="password" autoComplete="current-password" value={password} onChange={event => { setPassword(event.target.value); setPasswordError(undefined); }} />
    </Field>}
    <DataTable<LinkedIdentity> ariaLabel={title} columns={columns} rows={identities} rowKey={row => row.id} {...staticTable} emptyTitle={copy.empty}
      rowActionsLabel={copy.actions} rowActions={row => <Button type="button" variant="secondary" size="sm" disabled={locked || blocked} aria-label={`${copy.unlink}: ${row.providerName}`} onClick={() => ask(row)}>{copy.unlink}</Button>} />
    {providers.length > 0 && <Stack gap={2}>
      <Heading level={3} size="sm">{copy.linkHeading}</Heading>
      <FormActions>{providers.map(provider => <Button key={provider.id} type="button" variant="secondary" href={provider.href} onClick={provider.href ? undefined : () => onLink(provider.id)}>{copy.link.replace('{provider}', provider.name)}</Button>)}</FormActions>
    </Stack>}
    {pendingProof && <Alert tone="warning" title={copy.proofTitle.replace('{provider}', pendingProof.providerName)} actions={<>
      <Button type="button" onClick={() => void onConfirmProof?.()} disabled={locked}>{copy.confirmProof}</Button>
      <Button type="button" variant="secondary" onClick={onDismissProof} disabled={locked}>{copy.dismissProof}</Button>
    </>}>
      <Text size="sm">{copy.proofIntro}</Text>
      <DescriptionList items={[
        { term: copy.provider, description: pendingProof.providerName }, { term: copy.issuer, description: pendingProof.issuer }, { term: copy.subject, description: pendingProof.subject },
        ...(pendingProof.email ? [{ term: copy.email, description: pendingProof.email }] : []), { term: copy.expires, description: formatDate(pendingProof.expiresAt) },
      ]} />
    </Alert>}
    <TargetConfirm target={target} onClose={() => setTarget(undefined)} title={copy.unlinkTitle} description={copy.unlinkDescription} subject={row => row.providerName} confirmLabel={copy.unlink} onConfirm={row => onUnlink({ id: row.id, password })} />
  </SettingsFlow>;
}
