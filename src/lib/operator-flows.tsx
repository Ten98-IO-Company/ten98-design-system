'use client';

/* Presentation-only operator and owner settings flows. Applications keep requests, authorization, secrets and the vault;
 * secrets are write-only here: fields start blank, are cleared after submit, and nothing is ever echoed back. */
import { useState, type FormEvent } from 'react';
import { Alert, Badge, Button, Checkbox, Field, Input, Select, Textarea } from './primitives.js';
import { Disclosure, RadioGroup, StatusLine } from './controls.js';
import { DataTable, type DataColumn } from './patterns.js';
import { DescriptionList, FormActions, Heading, Inline, Stack, Text } from './structure.js';
import { ConfirmDialog, CopyButton } from './workspace.js';
import { SettingsFlow, formatFlowDate, ranOrThrow, staticTable, useSingleSubmit } from './flow-frame.js';
import type { FlowState, Submit } from './settings-base.js';

const lines = (value: string) => value.split('\n').map(line => line.trim()).filter(Boolean);

/* ------------------------------------------------------------ OIDC providers */

export interface OidcProviderSettings {
  name: string;
  issuer: string;
  clientId: string;
  authentication: 'basic' | 'post';
  allowedOrigins: string[];
  allowedAddresses: string[];
  trustVerifiedEmail: boolean;
}
export interface OidcProviderConfig {
  id: string;
  revision: number;
  settings: OidcProviderSettings;
  enabled: boolean;
  activeRevision: number | null;
  testedRevision: number | null;
  testedAt: string | Date | null;
}
/** A draft to save; `id` is absent for a new provider. `clientSecret` is write-only and replaces the stored one. */
export interface OidcDraftValues extends OidcProviderSettings { id?: string; clientSecret: string }
export interface OidcTestProof { id: string; password: string; secondFactor: 'none' | 'authenticator' | 'recovery'; code?: string }
export interface OidcTestIdentity { providerId: string; providerName: string; issuer: string; subject: string; email: string | null; emailVerified: boolean; expiresAt: string | Date }
export type OidcTestReview =
  | { state: 'loading' }
  | { state: 'ready'; identity: OidcTestIdentity }
  | { state: 'expired' }
  | { state: 'error'; message: string };
export interface OidcProvidersFlowProps extends FlowState {
  /** `unavailable`: the viewer lost operator access. */
  state?: 'loading' | 'load-error' | 'unavailable' | 'ready';
  onRetry?: () => void;
  providers: OidcProviderConfig[];
  /** Read-only; operators register it with the provider. */
  callbackUrl: string;
  /** Without a vault, saving, testing and enabling are disabled. */
  vaultConfigured: boolean;
  onSaveDraft: Submit<OidcDraftValues>;
  onDisable: Submit<{ id: string }>;
  /** Starts a test sign-in; the app redirects to the provider. The proof is cleared after submit. */
  onStartTest: Submit<OidcTestProof>;
  /** The test result returned by the app after the redirect. Enabling happens only from here. */
  review?: OidcTestReview;
  onEnableTested: Submit<{ id: string }>;
  onDismissReview: () => void;
  onRetryReview?: () => void;
  /** Only `replace-only` today: every save replaces the stored secret, which can never be viewed. */
  secretMode?: 'replace-only';
  formatDate?: (value: string | Date) => string;
  title?: string;
  description?: string;
}

const blankDraft: OidcDraftValues = { name: '', issuer: '', clientId: '', clientSecret: '', authentication: 'basic', allowedOrigins: [], allowedAddresses: [], trustVerifiedEmail: false };

/** Operator settings for the installation's OIDC sign-in providers: drafts, test sign-in, enable after a test, disable. */
export function OidcProvidersFlow({ state = 'ready', onRetry, providers, callbackUrl, vaultConfigured, onSaveDraft, onDisable, onStartTest, review, onEnableTested, onDismissReview, onRetryReview,
  formatDate = formatFlowDate, title = 'Identity providers', description = 'Manage your installation’s sign-in providers.', fieldErrors, ...flow }: OidcProvidersFlowProps) {
  const [editing, setEditing] = useState<OidcDraftValues | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [disabling, setDisabling] = useState<OidcProviderConfig>();
  const single = useSingleSubmit();
  const locked = flow.busy || flow.disabled || !vaultConfigured;

  if (state === 'loading') return <SettingsFlow {...flow} title={title} description={description}><StatusLine busy>Loading sign-in settings…</StatusLine></SettingsFlow>;
  if (state === 'load-error' || state === 'unavailable') return <SettingsFlow {...flow} title={title} description={description}>
    <Alert tone={state === 'unavailable' ? 'warning' : 'danger'} title={state === 'unavailable' ? 'Operator access is no longer available.' : 'Sign-in settings could not be loaded.'}
      actions={onRetry && <Button type="button" variant="secondary" size="sm" onClick={onRetry}>Try again</Button>} />
  </SettingsFlow>;

  const current = providers.find(provider => review?.state === 'ready' && provider.id === review.identity.providerId);
  if (review) return <SettingsFlow {...flow} title="Review test sign-in" description={title}>
    {review.state === 'loading' && <StatusLine busy>Loading the sign-in result…</StatusLine>}
    {review.state === 'expired' && <Alert tone="warning" title="Sign-in expired" actions={<Button type="button" variant="secondary" size="sm" onClick={onDismissReview}>Dismiss</Button>}>Start the test sign-in again.</Alert>}
    {review.state === 'error' && <Alert tone="danger" title={review.message} actions={<Inline gap={2}>
      {onRetryReview && <Button type="button" variant="secondary" size="sm" onClick={onRetryReview}>Try again</Button>}
      <Button type="button" variant="ghost" size="sm" onClick={onDismissReview}>Dismiss</Button>
    </Inline>} />}
    {review.state === 'ready' && <Stack gap={4}>
      <Text>The test sign-in to {review.identity.providerName} returned this identity. A matching email does not mean it is the same account.</Text>
      <DescriptionList items={[
        { key: 'provider', term: 'Provider', description: review.identity.providerName },
        { key: 'issuer', term: 'Issuer', description: <Text as="span" mono>{review.identity.issuer}</Text> },
        { key: 'subject', term: 'Subject', description: <Text as="span" mono>{review.identity.subject}</Text> },
        { key: 'email', term: 'Email', description: review.identity.email ? `${review.identity.email} (${review.identity.emailVerified ? 'verified by provider' : 'not verified'})` : 'None returned' },
        { key: 'expires', term: 'Expires', description: formatDate(review.identity.expiresAt) },
      ]} />
      {!vaultConfigured && <Alert tone="warning" title="Credential storage is not configured, so the provider cannot be enabled." />}
      <FormActions>
        <Button type="button" disabled={locked || !current} onClick={() => current && void single(() => onEnableTested({ id: current.id }))}>Enable tested provider</Button>
        <Button type="button" variant="secondary" onClick={onDismissReview}>Cancel</Button>
      </FormActions>
    </Stack>}
  </SettingsFlow>;

  const meta = (provider: OidcProviderConfig) => [
    `Draft revision ${provider.revision}`,
    `Live revision ${provider.activeRevision ?? 'none'}`,
    provider.testedRevision != null ? `Tested revision ${provider.testedRevision}${provider.testedAt ? ` (${formatDate(provider.testedAt)})` : ''}` : 'Not tested',
  ].join(' · ');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget, data = new FormData(form), text = (name: string) => String(data.get(name) ?? '').trim();
    const values: OidcDraftValues = {
      ...(editing?.id ? { id: editing.id } : {}), name: text('name'), issuer: text('issuer'), clientId: text('clientId'), clientSecret: String(data.get('clientSecret') ?? ''),
      authentication: text('authentication') === 'post' ? 'post' : 'basic', allowedOrigins: lines(String(data.get('allowedOrigins') ?? '')),
      allowedAddresses: lines(String(data.get('allowedAddresses') ?? '')), trustVerifiedEmail: data.get('trustVerifiedEmail') === 'on',
    };
    // The secret never stays in the page: clear it before the request runs.
    const secret = form.elements.namedItem('clientSecret') as HTMLInputElement | null;
    if (secret) secret.value = '';
    void single(() => onSaveDraft(values));
  };
  const draft = editing ?? blankDraft;
  return <SettingsFlow {...flow} title={title} description={description}>
    {!vaultConfigured && <Alert tone="warning" title="Credential storage is not configured on this server.">Saving, testing and enabling providers are disabled until the installation operator enables it.</Alert>}
    <Field label="Callback URL" description="Register this redirect URL with each provider.">
      <Inline gap={2}><Text as="code" mono>{callbackUrl}</Text><CopyButton value={callbackUrl} label="Copy callback URL" /></Inline>
    </Field>
    {providers.length === 0 && <Text tone="muted">No providers configured yet. Create a draft below.</Text>}
    {providers.map(provider => <ProviderCard key={provider.id} provider={provider} meta={meta(provider)} locked={locked}
      onEdit={() => { setEditing({ ...provider.settings, id: provider.id, clientSecret: '' }); setFormKey(key => key + 1); }}
      onDisable={() => setDisabling(provider)} onStartTest={proof => single(() => onStartTest(proof))} />)}
    <form key={formKey} onSubmit={submit} aria-labelledby="oidc-draft-heading">
      <Stack gap={4}>
        <Heading level={3} size="sm" id="oidc-draft-heading">{editing?.id ? 'Edit draft' : 'New draft'}</Heading>
        <fieldset disabled={locked} className="t98-flow-fieldset">
          <Stack gap={4}>
            <Field label="Display name" required error={fieldErrors?.name}><Input name="name" required maxLength={120} defaultValue={draft.name} /></Field>
            <Field label="Issuer URL" required description="HTTPS, without a query string." error={fieldErrors?.issuer}>
              <Input name="issuer" type="text" inputMode="url" required maxLength={2048} spellCheck={false} defaultValue={draft.issuer} />
            </Field>
            <Field label="Client ID" required error={fieldErrors?.clientId}><Input name="clientId" required maxLength={512} spellCheck={false} defaultValue={draft.clientId} /></Field>
            <Field label="Client secret" description="Saving replaces the stored secret. It can't be viewed after saving." error={fieldErrors?.clientSecret}>
              <Input name="clientSecret" type="password" autoComplete="new-password" maxLength={4096} defaultValue="" />
            </Field>
            <Field label="Client authentication" error={fieldErrors?.authentication}>
              <Select name="authentication" defaultValue={draft.authentication} options={[{ value: 'basic', label: 'HTTP Basic' }, { value: 'post', label: 'Form body / public client' }]} />
            </Field>
            <Disclosure summary="Advanced network options">
              <Stack gap={4}>
                <Field label="Additional allowed origins" description="HTTPS origins, one per line, up to 8." error={fieldErrors?.allowedOrigins}>
                  <Textarea name="allowedOrigins" rows={3} spellCheck={false} defaultValue={draft.allowedOrigins.join('\n')} />
                </Field>
                <Field label="Private provider addresses" description="IP addresses, one per line, up to 16." error={fieldErrors?.allowedAddresses}>
                  <Textarea name="allowedAddresses" rows={3} spellCheck={false} defaultValue={draft.allowedAddresses.join('\n')} />
                </Field>
                <Checkbox name="trustVerifiedEmail" defaultChecked={draft.trustVerifiedEmail}
                  label="Trust verified email: only confirms invited users by email; it never merges accounts." />
              </Stack>
            </Disclosure>
          </Stack>
        </fieldset>
        <FormActions>
          <Button type="submit" loading={flow.busy} disabled={locked}>{editing?.id ? 'Save draft' : 'Create draft'}</Button>
          {editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setFormKey(key => key + 1); }}>Cancel editing</Button>}
        </FormActions>
      </Stack>
    </form>
    <ConfirmDialog open={disabling !== undefined} onOpenChange={open => { if (!open) setDisabling(undefined); }} title={`Disable ${disabling?.settings.name ?? ''}?`}
      description="People can no longer sign in with this provider until it is enabled again." confirmLabel="Disable provider" danger
      onConfirm={() => disabling ? ranOrThrow(single(() => onDisable({ id: disabling.id }))) : undefined} />
  </SettingsFlow>;
}

function ProviderCard({ provider, meta, locked, onEdit, onDisable, onStartTest }: {
  provider: OidcProviderConfig; meta: string; locked: boolean; onEdit: () => void; onDisable: () => void; onStartTest: (proof: OidcTestProof) => void;
}) {
  const [factor, setFactor] = useState<OidcTestProof['secondFactor']>('none');
  const ahead = provider.activeRevision != null && provider.revision > provider.activeRevision;
  const tested = provider.testedRevision === provider.revision;
  return <section className="t98-operator-card" aria-labelledby={`oidc-${provider.id}`}>
    <Stack gap={3}>
      <Inline gap={2} align="center">
        <Heading level={3} size="sm" id={`oidc-${provider.id}`}>{provider.settings.name}</Heading>
        <Badge tone={provider.enabled ? 'success' : 'neutral'}>{provider.enabled ? 'Enabled' : 'Disabled'}</Badge>
        {tested && <Badge tone="info">Draft tested</Badge>}
        {ahead && <Badge tone="warning">Draft ahead of live</Badge>}
      </Inline>
      <Text size="sm" tone="muted">{meta}</Text>
      <Inline gap={2}>
        <Button type="button" variant="secondary" size="sm" onClick={onEdit}>Edit draft</Button>
        {provider.enabled && <Button type="button" variant="danger" size="sm" onClick={onDisable}>Disable</Button>}
      </Inline>
      <Disclosure summary="Test sign-in">
        <form onSubmit={event => {
          event.preventDefault();
          const form = event.currentTarget, data = new FormData(form);
          const proof: OidcTestProof = { id: provider.id, password: String(data.get('password') ?? ''), secondFactor: factor, ...(factor === 'none' ? {} : { code: String(data.get('code') ?? '').trim() }) };
          form.reset();
          onStartTest(proof);
        }}>
          <fieldset disabled={locked} className="t98-flow-fieldset">
            <Stack gap={3}>
              <Field label="Current password"><Input name="password" type="password" autoComplete="current-password" required maxLength={128} /></Field>
              <RadioGroup name={`factor-${provider.id}`} legend="Second factor" orientation="horizontal" value={factor} onValueChange={value => setFactor(value as OidcTestProof['secondFactor'])}
                options={[{ value: 'none', label: 'None' }, { value: 'authenticator', label: 'Authenticator code' }, { value: 'recovery', label: 'Recovery code' }]} />
              {factor !== 'none' && <Field label={factor === 'authenticator' ? 'Authenticator code' : 'Recovery code'}>
                <Input name="code" autoComplete="one-time-code" required spellCheck={false} maxLength={factor === 'authenticator' ? 6 : 21}
                  inputMode={factor === 'authenticator' ? 'numeric' : undefined} pattern={factor === 'authenticator' ? '[0-9]{6}' : undefined} />
              </Field>}
              <FormActions><Button type="submit" variant="secondary">Start test sign-in</Button></FormActions>
            </Stack>
          </fieldset>
        </form>
      </Disclosure>
    </Stack>
  </section>;
}

/* ------------------------------------------------------- Provider credentials */

export type ProviderKind = 'openrouter' | 'dataforseo';
export interface ProviderConnection {
  id: string; name: string; provider: ProviderKind; revision: number;
  checkStatus: 'untested' | 'ok' | 'error'; diagnostic?: string | null; lastCheckedAt: string | Date | null; createdAt: string | Date; updatedAt: string | Date;
}
/** Credentials are write-only: blank on open, cleared after submit, never returned by the app. */
export type ProviderCredentials = { provider: 'openrouter'; apiKey: string } | { provider: 'dataforseo'; login: string; password: string };
export interface ProviderBudget { month: string; spentUsd: number; reservedUsd: number; uncertainUsd: number }
export interface ProviderLedgerEntry { id: string; operation: string; status: string; estimateUsd: number | null; actualUsd: number | null }
export interface ProviderCredentialsFlowProps extends FlowState {
  /** `lost-access`: the viewer is no longer the owner (typed secrets are wiped). `uncertain`: the last change may already be
   * saved, so controls stay locked until a reload. */
  state?: 'loading' | 'load-error' | 'lost-access' | 'uncertain' | 'ready';
  onReload?: () => void;
  connections: ProviderConnection[];
  vaultConfigured: boolean;
  onAdd: Submit<{ name: string; credentials: ProviderCredentials }>;
  onCheck: Submit<{ id: string }>;
  onRotate: Submit<{ id: string; name: string; credentials: ProviderCredentials }>;
  onDisconnect: Submit<{ id: string }>;
  /** Workspace-wide: pauses new paid provider work. */
  paused: boolean;
  onSavePause: Submit<{ paused: boolean }>;
  /** Shown after a successful pause save. */
  pauseSaved?: boolean;
  budget?: ProviderBudget;
  ledger?: ProviderLedgerEntry[];
  formatDate?: (value: string | Date) => string;
  formatUsd?: (value: number) => string;
  title?: string;
  description?: string;
}

const providerNames: Record<ProviderKind, string> = { openrouter: 'OpenRouter', dataforseo: 'DataForSEO' };
const checkLabels = { untested: 'Saved — untested', ok: 'Check passed', error: 'Check failed' } as const;
const checkTones = { untested: 'neutral', ok: 'success', error: 'danger' } as const;
const defaultUsd = (value: number) => new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }).format(value);

function CredentialFields({ provider, renewing }: { provider: ProviderKind; renewing: boolean }) {
  const prefix = renewing ? 'New ' : '';
  return provider === 'openrouter'
    ? <Field label={`${prefix}OpenRouter API key`}><Input name="apiKey" type="password" autoComplete="new-password" required maxLength={4096} defaultValue="" /></Field>
    : <>
      <Field label={`${prefix}DataForSEO API login email`}><Input name="login" type="email" autoComplete="off" required maxLength={254} defaultValue="" /></Field>
      <Field label={`${prefix}DataForSEO API password`}><Input name="password" type="password" autoComplete="new-password" required maxLength={4096} defaultValue="" /></Field>
    </>;
}
function readCredentials(form: HTMLFormElement, provider: ProviderKind): ProviderCredentials {
  const data = new FormData(form), value = (name: string) => String(data.get(name) ?? '');
  const credentials: ProviderCredentials = provider === 'openrouter' ? { provider, apiKey: value('apiKey') } : { provider, login: value('login').trim(), password: value('password') };
  // Secrets never stay in the page once handed to the app.
  for (const name of ['apiKey', 'login', 'password']) { const field = form.elements.namedItem(name) as HTMLInputElement | null; if (field) field.value = ''; }
  return credentials;
}

/** Workspace-owner settings for paid provider connections (AI and search): add, check, rotate, disconnect, and pause paid work. */
export function ProviderCredentialsFlow({ state = 'ready', onReload, connections, vaultConfigured, onAdd, onCheck, onRotate, onDisconnect, paused, onSavePause, pauseSaved, budget, ledger,
  formatDate = formatFlowDate, formatUsd = defaultUsd, title = 'Provider connections', description = 'AI and search provider credentials for this workspace.', ...flow }: ProviderCredentialsFlowProps) {
  const [adding, setAdding] = useState<ProviderKind>('openrouter');
  const [rotating, setRotating] = useState<ProviderConnection>();
  const [disconnecting, setDisconnecting] = useState<ProviderConnection>();
  const [pauseDraft, setPauseDraft] = useState(paused);
  const [showSpending, setShowSpending] = useState(false);
  const single = useSingleSubmit();
  const frozen = flow.busy || flow.disabled || state === 'uncertain';
  const vaultLocked = frozen || !vaultConfigured;

  if (state === 'loading') return <SettingsFlow {...flow} title={title} description={description}><StatusLine busy>Loading provider connections…</StatusLine></SettingsFlow>;
  const reload = onReload && <Button type="button" variant="secondary" size="sm" onClick={onReload}>Reload saved settings</Button>;
  if (state === 'load-error') return <SettingsFlow {...flow} title={title} description={description}><Alert tone="danger" title="Provider connections could not be loaded." actions={reload} /></SettingsFlow>;
  if (state === 'lost-access') return <SettingsFlow {...flow} title={title} description={description}>
    <Alert tone="warning" title="Only the workspace owner can manage provider connections." actions={reload}>Anything you typed has been cleared.</Alert>
  </SettingsFlow>;

  const ledgerColumns: DataColumn<ProviderLedgerEntry>[] = [
    { key: 'operation', header: 'Operation', rowHeader: true, wrap: true }, { key: 'status', header: 'Status' },
    { key: 'estimateUsd', header: 'Estimate', numeric: true, render: row => row.estimateUsd == null ? null : formatUsd(row.estimateUsd) },
    { key: 'actualUsd', header: 'Actual', numeric: true, render: row => row.actualUsd == null ? null : formatUsd(row.actualUsd) },
  ];
  return <SettingsFlow {...flow} title={title} description={description}>
    {state === 'uncertain' && <Alert tone="warning" title="The change may already be saved." actions={reload}>Reload saved settings before making more changes.</Alert>}
    {!vaultConfigured && <Alert tone="warning" title="Credential storage is not configured on this server.">Ask the installation operator to enable it before saving, rotating or checking connections. You can still pause paid work.</Alert>}

    <Stack gap={3} className="t98-operator-pause">
      <Heading level={3} size="sm">Paid provider work</Heading>
      <StatusLine tone={paused ? 'warning' : 'neutral'}>{paused ? 'Paid provider work is paused.' : 'Paid provider work is not paused.'}</StatusLine>
      <Checkbox label="Pause paid provider work" checked={pauseDraft} disabled={frozen || (!vaultConfigured && pauseDraft && paused)}
        onChange={event => setPauseDraft(event.target.checked)} />
      <Text size="sm" tone="muted">Pauses new paid work after saving; off for new workspaces.</Text>
      <Inline gap={2}>
        <Button type="button" variant="secondary" size="sm" disabled={frozen || pauseDraft === paused} onClick={() => void single(() => onSavePause({ paused: pauseDraft }))}>Save pause setting</Button>
        {(budget || ledger) && <Button type="button" variant="ghost" size="sm" aria-expanded={showSpending} onClick={() => setShowSpending(open => !open)}>Review spending</Button>}
      </Inline>
      {pauseSaved && <StatusLine tone="success">Paid-work setting saved. No work was started.</StatusLine>}
      {showSpending && <Stack gap={3}>
        {budget && <DescriptionList columns={2} items={[
          { key: 'month', term: 'Month', description: budget.month }, { key: 'spent', term: 'Spent', description: formatUsd(budget.spentUsd) },
          { key: 'reserved', term: 'Reserved', description: formatUsd(budget.reservedUsd) }, { key: 'uncertain', term: 'Uncertain', description: formatUsd(budget.uncertainUsd) },
        ]} />}
        {ledger && <DataTable<ProviderLedgerEntry> ariaLabel="Recent paid operations" columns={ledgerColumns} rows={ledger.slice(0, 50)} rowKey={row => row.id} {...staticTable} emptyTitle="No paid operations yet." emptyDescription={null} />}
      </Stack>}
    </Stack>

    {connections.length === 0 && <Text tone="muted">No provider connections yet.</Text>}
    {connections.map(connection => <section key={connection.id} className="t98-operator-card" aria-labelledby={`connection-${connection.id}`}>
      <Stack gap={2}>
        <Inline gap={2} align="center">
          <Heading level={3} size="sm" id={`connection-${connection.id}`}>{connection.name}</Heading>
          <Text as="span" size="sm" tone="muted">{providerNames[connection.provider]}</Text>
          <Badge tone={checkTones[connection.checkStatus]}>{checkLabels[connection.checkStatus]}</Badge>
        </Inline>
        {connection.diagnostic && <Text size="sm">{connection.diagnostic}</Text>}
        <Text size="sm" tone="muted">Last checked: {connection.lastCheckedAt ? formatDate(connection.lastCheckedAt) : 'Never'}</Text>
        <Inline gap={2}>
          <Button type="button" variant="secondary" size="sm" disabled={vaultLocked} onClick={() => void single(() => onCheck({ id: connection.id }))}>Run check</Button>
          <Button type="button" variant="secondary" size="sm" disabled={vaultLocked} onClick={() => setRotating(connection)}>Rotate credentials</Button>
          <Button type="button" variant="danger" size="sm" disabled={frozen} onClick={() => setDisconnecting(connection)}>Disconnect</Button>
        </Inline>
        {rotating?.id === connection.id && <form onSubmit={event => {
          event.preventDefault();
          const form = event.currentTarget, name = String(new FormData(form).get('name') ?? '').trim();
          const credentials = readCredentials(form, connection.provider);
          setRotating(undefined);
          void single(() => onRotate({ id: connection.id, name, credentials }));
        }} aria-label={`Rotate credentials for ${connection.name}`}>
          <fieldset disabled={vaultLocked} className="t98-flow-fieldset">
            <Stack gap={3}>
              <Field label="Name"><Input name="name" required maxLength={120} defaultValue={connection.name} /></Field>
              <CredentialFields provider={connection.provider} renewing />
              <FormActions>
                <Button type="submit">Rotate credentials</Button>
                <Button type="button" variant="secondary" onClick={() => setRotating(undefined)}>Cancel</Button>
              </FormActions>
            </Stack>
          </fieldset>
        </form>}
      </Stack>
    </section>)}

    <form onSubmit={event => {
      event.preventDefault();
      const form = event.currentTarget, name = String(new FormData(form).get('name') ?? '').trim();
      const credentials = readCredentials(form, adding);
      void single(() => onAdd({ name, credentials }));
    }} aria-labelledby="provider-add-heading">
      <fieldset disabled={vaultLocked} className="t98-flow-fieldset">
        <Stack gap={4}>
          <Heading level={3} size="sm" id="provider-add-heading">Add connection</Heading>
          <Field label="Name"><Input name="name" required maxLength={120} /></Field>
          <Field label="Provider"><Select name="provider" value={adding} onChange={event => setAdding(event.target.value as ProviderKind)}
            options={[{ value: 'openrouter', label: providerNames.openrouter }, { value: 'dataforseo', label: providerNames.dataforseo }]} /></Field>
          <CredentialFields provider={adding} renewing={false} />
          <FormActions><Button type="submit" loading={flow.busy}>Save connection</Button></FormActions>
        </Stack>
      </fieldset>
    </form>

    <ConfirmDialog open={disconnecting !== undefined} onOpenChange={open => { if (!open) setDisconnecting(undefined); }}
      title={`Permanently disconnect "${disconnecting?.name ?? ''}"?`} description="This cannot be undone." confirmLabel="Disconnect" danger
      onConfirm={() => disconnecting ? ranOrThrow(single(() => onDisconnect({ id: disconnecting.id }))) : undefined} />
  </SettingsFlow>;
}

