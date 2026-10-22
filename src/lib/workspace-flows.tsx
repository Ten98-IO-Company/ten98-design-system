'use client';

import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Alert, Badge, Button, Checkbox, Field, Input, Select, type IconName, type SelectOption } from './primitives.js';
import { CheckboxGroup, RadioGroup, type ChoiceOption } from './controls.js';
import { DataTable, type DataColumn, type TableIndexPage, type TablePageChange } from './patterns.js';
import { SidebarNav, type NavLinkComponent, type SidebarNavGroup } from './shell.js';
import { FormActions, Heading, Inline, Stack, Text } from './structure.js';
import { SettingsTemplate } from './templates.js';
import { ConfirmDialog, CopyButton, SecretField, type CopyButtonMessages } from './workspace.js';
import { FlowActionControl, SettingsFlow, TargetConfirm, formText, formatFlowDate, staticTable, useSingleSubmit, type LabelledAction } from './flow-frame.js';
import type { FlowState, Submit } from './settings-base.js';

/* Presentation-only workspace settings flows. Applications keep requests, authorization and secrets, and supply every
 * message. Team members and invitations are managed only in TeamFlow, and flows never ask for the workspace or project:
 * the application already knows the current context. */

type DateValue = string | Date;

interface OneTimeValueProps { label: string; value: string; masked: boolean; messages: Partial<CopyButtonMessages> & { copy: string }; warning: string; dismiss?: { label: string; onClick: () => void } }
/** A value the application will never show again, with copy (and its manual fallback) and an optional dismiss. */
function OneTimeValue({ label, value, masked, messages, warning, dismiss }: OneTimeValueProps) {
  const id = useId();
  const { copy, ...copyMessages } = messages;
  return <Alert tone="warning" title={warning}>
    <Stack gap={3}>
      {masked
        ? <SecretField label={label} value={value} />
        : <Field label={label} htmlFor={id}><Input id={id} value={value} readOnly autoComplete="off" /></Field>}
      <Inline gap={2}>
        <CopyButton value={value} label={copy} messages={copyMessages} />
        {dismiss && <Button type="button" variant="secondary" size="sm" onClick={dismiss.onClick}>{dismiss.label}</Button>}
      </Inline>
    </Stack>
  </Alert>;
}

/* ----------------------------------------------------------------- API keys */

export interface ApiKey { id: string; name: string; prefix: string; scopes: string[]; createdAt: DateValue; expiresAt?: DateValue; lastUsedAt?: DateValue; revoked: boolean }
export interface ApiKeyCreateValues { name: string; scopes: string[]; /** `null` when the chosen expiry option is not a number of days. */ expiresInDays: number | null }
export interface ApiKeysMessages {
  name: string; scopes: string; created: string; expires: string; lastUsed: string; status: string; actions: string; never: string; revoked: string; active: string; empty: string;
  createHeading: string; nameLabel: string; scopesLegend: string; scopesRequired: string; expiryLegend: string; create: string; revoke: string; revokeTitle: string; revokeDescription: string;
  secretLabel: string; secretWarning: string; secretDismiss: string; copy: string; copied: string; copyFailed: string; copyManual: string;
}
const apiKeyMessages: ApiKeysMessages = {
  name: 'Name', scopes: 'Scopes', created: 'Created', expires: 'Expires', lastUsed: 'Last used', status: 'Status', actions: 'Actions', never: 'Never', revoked: 'Revoked', active: 'Active', empty: 'No API keys.',
  createHeading: 'Create a key', nameLabel: 'Key name', scopesLegend: 'Scopes', scopesRequired: 'Choose at least one scope.', expiryLegend: 'Expiry', create: 'Create key', revoke: 'Revoke',
  revokeTitle: 'Revoke this key?', revokeDescription: 'Anything using it stops working immediately.',
  secretLabel: 'New API key', secretWarning: 'Copy this key now. You won’t see it again.', secretDismiss: 'I have saved it', copy: 'Copy key', copied: 'Copied', copyFailed: 'Copy failed. The key is selected: copy it manually.', copyManual: 'Select and copy',
};
export interface ApiKeysFlowProps extends FlowState {
  keys: ApiKey[];
  scopes: ChoiceOption[];
  /** Each value is a number of days; any other value means the key does not expire. */
  expiryOptions: ChoiceOption[];
  onCreate: Submit<ApiKeyCreateValues>;
  /** Shown once, in a masked field with a copy button, until the application calls for it to be cleared. */
  revealedSecret?: { id: string; token: string };
  onDismissSecret: () => void;
  onRevoke: Submit<{ id: string }>;
  page?: TableIndexPage;
  onPageChange?: (change: TablePageChange) => void;
  formatDate?: (value: DateValue) => string;
  title?: string;
  description?: string;
  messages?: Partial<ApiKeysMessages>;
}
function ApiKeyForm({ scopes, expiryOptions, onCreate, fieldErrors, copy }: Pick<ApiKeysFlowProps, 'scopes' | 'expiryOptions' | 'onCreate' | 'fieldErrors'> & { copy: ApiKeysMessages }) {
  const id = useId();
  const singleFlight = useSingleSubmit();
  const [selected, setSelected] = useState<string[]>([]);
  const [scopeError, setScopeError] = useState<string>();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected.length) { setScopeError(copy.scopesRequired); return; }
    const form = new FormData(event.currentTarget);
    const days = Number(form.get('expiry'));
    void singleFlight(() => onCreate({ name: formText(form, 'name'), scopes: selected, expiresInDays: Number.isInteger(days) && formText(form, 'expiry').trim() !== '' ? days : null }));
  }
  return <form onSubmit={submit}>
    <Stack gap={4}>
      <Heading level={3} size="sm">{copy.createHeading}</Heading>
      <Field label={copy.nameLabel} htmlFor={`${id}-name`} error={fieldErrors?.name}>
        <Input name="name" autoComplete="off" required maxLength={120} />
      </Field>
      <CheckboxGroup legend={copy.scopesLegend} name="scopes" options={scopes} value={selected} onValueChange={value => { setSelected(value); setScopeError(undefined); }} error={scopeError ?? fieldErrors?.scopes} />
      <RadioGroup legend={copy.expiryLegend} name="expiry" options={expiryOptions} defaultValue={expiryOptions[0]?.value} error={fieldErrors?.expiry} />
      <FormActions><Button type="submit">{copy.create}</Button></FormActions>
    </Stack>
  </form>;
}
/** API keys: create with scopes and expiry, show the new secret once, revoke after one confirmation. */
export function ApiKeysFlow({ keys, scopes, expiryOptions, onCreate, revealedSecret, onDismissSecret, onRevoke, page, onPageChange, formatDate = formatFlowDate, title = 'API keys', description, messages, ...state }: ApiKeysFlowProps) {
  const copy = { ...apiKeyMessages, ...messages };
  const [target, setTarget] = useState<ApiKey>();
  const locked = state.busy || state.disabled;
  const scopeLabel = (value: string) => scopes.find(scope => scope.value === value)?.label ?? value;
  const columns: DataColumn<ApiKey>[] = [
    { key: 'name', header: copy.name, rowHeader: true, wrap: true, minWidth: 'md', render: row => <Stack gap={0}><span>{row.name}</span><Text as="code" size="sm" tone="muted" mono>{row.prefix}…</Text></Stack> },
    { key: 'scopes', header: copy.scopes, wrap: true, render: row => <Inline gap={1}>{row.scopes.map(scope => <Badge key={scope}>{scopeLabel(scope)}</Badge>)}</Inline> },
    { key: 'createdAt', header: copy.created, render: row => formatDate(row.createdAt) },
    { key: 'expiresAt', header: copy.expires, render: row => row.expiresAt ? formatDate(row.expiresAt) : copy.never },
    { key: 'lastUsedAt', header: copy.lastUsed, render: row => row.lastUsedAt ? formatDate(row.lastUsedAt) : copy.never },
    { key: 'revoked', header: copy.status, render: row => <Badge tone={row.revoked ? 'neutral' : 'success'}>{row.revoked ? copy.revoked : copy.active}</Badge> },
  ];
  return <SettingsFlow {...state} title={title} description={description}>
    <Stack gap={5}>
      {revealedSecret && <OneTimeValue label={copy.secretLabel} value={revealedSecret.token} masked warning={copy.secretWarning} dismiss={{ label: copy.secretDismiss, onClick: onDismissSecret }}
        messages={{ copy: copy.copy, copied: copy.copied, copyFailed: copy.copyFailed, select: copy.copyManual }} />}
      <ApiKeyForm key={revealedSecret?.id ?? 'form'} scopes={scopes} expiryOptions={expiryOptions} onCreate={onCreate} fieldErrors={state.fieldErrors} copy={copy} />
      <DataTable<ApiKey> ariaLabel={title} columns={columns} rows={keys} rowKey={row => row.id} {...staticTable} pagination={page !== undefined} page={page} onPageChange={onPageChange} responsive="stack" emptyTitle={copy.empty}
        rowActionsLabel={copy.actions} rowActions={row => row.revoked ? null : <Button type="button" variant="secondary" size="sm" disabled={locked} aria-label={`${copy.revoke}: ${row.name}`} onClick={() => setTarget(row)}>{copy.revoke}</Button>} />
    </Stack>
    <TargetConfirm target={target} onClose={() => setTarget(undefined)} title={copy.revokeTitle} description={copy.revokeDescription} subject={key => key.name} confirmLabel={copy.revoke} onConfirm={key => onRevoke({ id: key.id })} />
  </SettingsFlow>;
}

/* --------------------------------------------------------------------- Team */

export interface TeamMember { id: string; name: string; email: string; role: string; twoFactor?: boolean }
export interface TeamInvitation { id: string; email: string; role: string; expiresAt: DateValue; status: string }
export interface TeamPolicy { twoFactorRequired: boolean; onChange: (required: boolean) => void | Promise<void> }
export interface TeamOwnership { candidates: SelectOption[]; onTransfer: Submit<{ userId: string }> }
export interface TeamMessages {
  members: string; member: string; email: string; role: string; twoFactor: string; twoFactorOn: string; twoFactorOff: string; actions: string; you: string; remove: string; removeTitle: string; removeDescription: string; membersEmpty: string;
  roleFor: string; invitations: string; invitationsEmpty: string; expires: string; status: string; revokeInvitation: string; revokeInvitationTitle: string; revokeInvitationDescription: string;
  inviteHeading: string; inviteEmail: string; inviteRole: string; invite: string; linkLabel: string; linkWarning: string; linkDismiss: string; copy: string; copied: string; copyFailed: string; copyManual: string;
  policy: string; policyLabel: string; ownership: string; ownershipDescription: string; ownershipCandidate: string; ownershipChoose: string; transfer: string; transferTitle: string; transferDescription: string; transferConfirmation: string;
}
const teamMessages: TeamMessages = {
  members: 'Members', member: 'Member', email: 'Email', role: 'Role', twoFactor: 'Two-factor', twoFactorOn: 'On', twoFactorOff: 'Off', actions: 'Actions', you: 'You', remove: 'Remove', removeTitle: 'Remove this member?',
  removeDescription: 'They lose access to this workspace immediately.', membersEmpty: 'No members.', roleFor: 'Role for {name}', invitations: 'Invitations', invitationsEmpty: 'No pending invitations.', expires: 'Expires', status: 'Status',
  revokeInvitation: 'Revoke', revokeInvitationTitle: 'Revoke this invitation?', revokeInvitationDescription: 'The invitation link stops working.',
  inviteHeading: 'Invite someone', inviteEmail: 'Email address', inviteRole: 'Role', invite: 'Send invitation', linkLabel: 'Invitation link', linkWarning: 'Share this link now. It won’t be shown again.', linkDismiss: 'Done',
  copy: 'Copy link', copied: 'Copied', copyFailed: 'Copy failed. The link is selected: copy it manually.', copyManual: 'Select and copy',
  policy: 'Policy', policyLabel: 'Require two-factor authentication for every member', ownership: 'Ownership', ownershipDescription: 'Make another member the owner. You become an administrator.', ownershipCandidate: 'New owner', ownershipChoose: 'Choose a member',
  transfer: 'Transfer ownership', transferTitle: 'Transfer ownership?', transferDescription: 'You lose owner rights. Only the new owner can undo this.', transferConfirmation: 'TRANSFER',
};
/** Labels for the canonical workspace roles (@ten98/runtime workspaceRoles). */
const canonicalRoleLabels: Partial<Record<string, string>> = { owner: 'Owner', admin: 'Admin', editor: 'Editor', viewer: 'Viewer' };
/** Sentence-case labels for the known invitation states; an unknown status is shown as given. */
const invitationStatusText: Record<string, string> = { pending: 'Pending', accepted: 'Accepted', expired: 'Expired', revoked: 'Revoked' };
const invitationTone = (status: string) => ({ pending: 'info', accepted: 'success', expired: 'warning', revoked: 'neutral' } as const)[status as 'pending'] ?? 'neutral';
export interface TeamFlowProps extends FlowState {
  currentUserId: string;
  members: TeamMember[];
  /** Roles the current user may invite people as. Member rows are labelled from all canonical roles, not this list. */
  roles: SelectOption[];
  /** Overrides the built-in Owner/Admin/Editor/Viewer labels, for applications that rename roles. */
  roleLabels?: Partial<Record<string, string>>;
  /** Overrides the built-in Pending/Accepted/Expired/Revoked invitation labels. Statuses stay raw values for the flow's own checks. */
  invitationStatusLabels?: Partial<Record<string, string>>;
  /** Roles the current user may give this member. Empty makes the row read-only. */
  assignableRoles: (target: TeamMember) => string[];
  onRoleChange: Submit<{ id: string; role: string }>;
  onRemove: Submit<{ id: string }>;
  invitations: TeamInvitation[];
  /** Invitations are the only way to add people. */
  onInvite: Submit<{ email: string; role: string }>;
  onRevokeInvitation: Submit<{ id: string }>;
  /** Shown once for copying until the application clears it. */
  inviteLink?: { id: string; url: string };
  onDismissInviteLink?: () => void;
  policy?: TeamPolicy;
  ownership?: TeamOwnership;
  /** Role preselected in the invite form. Defaults to the last entry of `roles`, which should be the least privileged. */
  defaultInviteRole?: string;
  formatDate?: (value: DateValue) => string;
  title?: string;
  description?: string;
  messages?: Partial<TeamMessages>;
}
/** The one place to manage members, roles, invitations, the two-factor policy and ownership. */
export function TeamFlow({ currentUserId, members, roles, roleLabels, invitationStatusLabels, assignableRoles, onRoleChange, onRemove, invitations, onInvite, onRevokeInvitation, inviteLink, onDismissInviteLink, policy, ownership, defaultInviteRole = roles[roles.length - 1]?.value, formatDate = formatFlowDate, title = 'Team', description, messages, ...state }: TeamFlowProps) {
  const id = useId();
  const copy = { ...teamMessages, ...messages };
  const singleFlight = useSingleSubmit();
  const [removing, setRemoving] = useState<TeamMember>();
  const [revoking, setRevoking] = useState<TeamInvitation>();
  const [newOwner, setNewOwner] = useState('');
  const [transferring, setTransferring] = useState(false);
  const locked = state.busy || state.disabled;
  // An admin may invite only editors and viewers, yet still sees owner and admin rows, so labels come from every canonical role.
  const roleLabel = (value: string) => roleLabels?.[value] ?? canonicalRoleLabels[value] ?? roles.find(role => role.value === value)?.label ?? value;
  const memberColumns: DataColumn<TeamMember>[] = [
    { key: 'name', header: copy.member, rowHeader: true, wrap: true, render: row => <Stack gap={0}><Inline gap={2}><span>{row.name}</span>{row.id === currentUserId && <Badge tone="info">{copy.you}</Badge>}</Inline><Text size="sm" tone="muted">{row.email}</Text></Stack> },
    { key: 'role', header: copy.role, render: row => {
      const allowed = assignableRoles(row);
      if (!allowed.length) return roleLabel(row.role);
      const options = [row.role, ...allowed.filter(role => role !== row.role)].map(role => ({ value: role, label: roleLabel(role) }));
      return <Select aria-label={copy.roleFor.replace('{name}', row.name)} options={options} value={row.role} disabled={locked} onChange={event => { const role = event.target.value; void singleFlight(() => onRoleChange({ id: row.id, role })); }} />;
    } },
    { key: 'twoFactor', header: copy.twoFactor, render: row => row.twoFactor === undefined ? '' : <Badge tone={row.twoFactor ? 'success' : 'warning'}>{row.twoFactor ? copy.twoFactorOn : copy.twoFactorOff}</Badge> },
  ];
  const invitationColumns: DataColumn<TeamInvitation>[] = [
    { key: 'email', header: copy.email, rowHeader: true, wrap: true },
    { key: 'role', header: copy.role, render: row => roleLabel(row.role) },
    { key: 'expiresAt', header: copy.expires, render: row => formatDate(row.expiresAt) },
    { key: 'status', header: copy.status, render: row => <Badge tone={invitationTone(row.status)}>{invitationStatusLabels?.[row.status] ?? invitationStatusText[row.status] ?? row.status}</Badge> },
  ];
  const candidate = ownership?.candidates.find(option => option.value === newOwner);
  return <SettingsFlow {...state} title={title} description={description}>
    <Stack gap={6}>
      {policy && <Stack gap={2}>
        <Heading level={3} size="sm">{copy.policy}</Heading>
        <Checkbox label={copy.policyLabel} checked={policy.twoFactorRequired} onChange={event => { const next = event.target.checked; void singleFlight(() => policy.onChange(next)); }} />
      </Stack>}
      <Stack gap={2}>
        <Heading level={3} size="sm">{copy.members}</Heading>
        <DataTable<TeamMember> ariaLabel={copy.members} columns={memberColumns} rows={members} rowKey={row => row.id} {...staticTable} emptyTitle={copy.membersEmpty}
          rowActionsLabel={copy.actions} rowActions={row => row.id === currentUserId || !assignableRoles(row).length ? null
            : <Button type="button" variant="secondary" size="sm" disabled={locked} aria-label={`${copy.remove}: ${row.name}`} onClick={() => setRemoving(row)}>{copy.remove}</Button>} />
      </Stack>
      <Stack gap={2}>
        <Heading level={3} size="sm">{copy.invitations}</Heading>
        {inviteLink && <OneTimeValue label={copy.linkLabel} value={inviteLink.url} masked={false} warning={copy.linkWarning} dismiss={onDismissInviteLink && { label: copy.linkDismiss, onClick: onDismissInviteLink }}
          messages={{ copy: copy.copy, copied: copy.copied, copyFailed: copy.copyFailed, select: copy.copyManual }} />}
        <DataTable<TeamInvitation> ariaLabel={copy.invitations} columns={invitationColumns} rows={invitations} rowKey={row => row.id} {...staticTable} emptyTitle={copy.invitationsEmpty} emptyDescription={null}
          rowActionsLabel={copy.actions} rowActions={row => row.status !== 'pending' ? null
            : <Button type="button" variant="secondary" size="sm" disabled={locked} aria-label={`${copy.revokeInvitation}: ${row.email}`} onClick={() => setRevoking(row)}>{copy.revokeInvitation}</Button>} />
        <form key={inviteLink?.id ?? 'invite'} onSubmit={event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void singleFlight(() => onInvite({ email: formText(form, 'email'), role: formText(form, 'role') }));
        }}>
          <Stack gap={3}>
            <Heading level={4} size="sm">{copy.inviteHeading}</Heading>
            <Field label={copy.inviteEmail} htmlFor={`${id}-email`} error={state.fieldErrors?.email}><Input name="email" type="email" autoComplete="off" required maxLength={254} /></Field>
            <Field label={copy.inviteRole} htmlFor={`${id}-role`} error={state.fieldErrors?.role}><Select name="role" options={roles.map(role => ({ ...role, label: roleLabel(role.value) }))} defaultValue={defaultInviteRole} /></Field>
            <FormActions><Button type="submit">{copy.invite}</Button></FormActions>
          </Stack>
        </form>
      </Stack>
      {ownership && <Stack gap={3}>
        <Heading level={3} size="sm">{copy.ownership}</Heading>
        <Text tone="muted" size="sm">{copy.ownershipDescription}</Text>
        <Field label={copy.ownershipCandidate} htmlFor={`${id}-owner`}><Select options={ownership.candidates} placeholder={copy.ownershipChoose} value={newOwner} disabled={!ownership.candidates.length} onChange={event => setNewOwner(event.target.value)} /></Field>
        <FormActions><Button type="button" variant="danger" disabled={locked || !candidate} onClick={() => setTransferring(true)}>{copy.transfer}</Button></FormActions>
      </Stack>}
    </Stack>
    <TargetConfirm target={removing} onClose={() => setRemoving(undefined)} title={copy.removeTitle} description={copy.removeDescription} subject={member => member.name} confirmLabel={copy.remove} onConfirm={member => onRemove({ id: member.id })} />
    <TargetConfirm target={revoking} onClose={() => setRevoking(undefined)} title={copy.revokeInvitationTitle} description={copy.revokeInvitationDescription} subject={invitation => invitation.email} confirmLabel={copy.revokeInvitation} onConfirm={invitation => onRevokeInvitation({ id: invitation.id })} />
    {ownership && <ConfirmDialog open={transferring} onOpenChange={setTransferring} title={copy.transferTitle} description={candidate ? `${candidate.label}. ${copy.transferDescription}` : copy.transferDescription} confirmLabel={copy.transfer} danger confirmationText={copy.transferConfirmation}
      onConfirm={() => candidate ? ownership.onTransfer({ userId: candidate.value }) : undefined} />}
  </SettingsFlow>;
}

/* ------------------------------------------------- Workspace and project forms */

interface NameFormProps extends FlowState {
  title: string;
  description?: string;
  submitLabel: string;
  cancel?: LabelledAction;
  cancelLabel: string;
  onSubmit: (form: FormData) => void | Promise<void>;
  children: ReactNode;
}
function NameForm({ title, description, submitLabel, cancel, cancelLabel, onSubmit, children, ...state }: NameFormProps) {
  const singleSubmit = useSingleSubmit();
  return <SettingsFlow {...state} title={title} description={description} submitLabel={submitLabel}
    extraActions={cancel && <FlowActionControl action={cancel} label={cancel.label ?? cancelLabel} variant="secondary" size="md" />}
    onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); void singleSubmit(() => onSubmit(form)); }}>
    {children}
  </SettingsFlow>;
}

export interface WorkspaceCreateFlowMessages { nameLabel: string; create: string; rename: string; createTitle: string; renameTitle: string; cancel: string }
const workspaceMessages: WorkspaceCreateFlowMessages = { nameLabel: 'Workspace name', create: 'Create workspace', rename: 'Save name', createTitle: 'Create a workspace', renameTitle: 'Workspace name', cancel: 'Cancel' };
export interface WorkspaceCreateFlowProps extends FlowState {
  mode: 'create' | 'rename';
  defaultValues: { name: string };
  onSubmit: Submit<{ name: string }>;
  cancel?: LabelledAction;
  title?: string;
  description?: string;
  messages?: Partial<WorkspaceCreateFlowMessages>;
}
/** Names a new workspace or renames the current one. */
export function WorkspaceCreateFlow({ mode, defaultValues, onSubmit, cancel, title, description, messages, ...state }: WorkspaceCreateFlowProps) {
  const id = useId();
  const copy = { ...workspaceMessages, ...messages };
  return <NameForm {...state} title={title ?? (mode === 'create' ? copy.createTitle : copy.renameTitle)} description={description} submitLabel={mode === 'create' ? copy.create : copy.rename} cancel={cancel} cancelLabel={copy.cancel}
    onSubmit={form => onSubmit({ name: formText(form, 'name') })}>
    <Field label={copy.nameLabel} htmlFor={`${id}-name`} error={state.fieldErrors?.name}><Input name="name" autoComplete="organization" required maxLength={120} defaultValue={defaultValues.name} /></Field>
  </NameForm>;
}

export interface ProjectCreateFlowMessages { nameLabel: string; originLabel: string; originHint: string; create: string; save: string; createTitle: string; editTitle: string; cancel: string }
const projectMessages: ProjectCreateFlowMessages = {
  nameLabel: 'Project name', originLabel: 'Site origin', originHint: 'The address of the site, for example https://www.example.com.', create: 'Create project', save: 'Save project', createTitle: 'Create a project', editTitle: 'Project details', cancel: 'Cancel',
};
export interface ProjectCreateFlowProps extends FlowState {
  mode: 'create' | 'edit';
  defaultValues: { name: string; origin?: string };
  /** Defaults to true. When false the origin may stay empty. */
  originRequired?: boolean;
  /** Defaults to true. False is for projects without a website: no origin field, validation or submitted value. */
  showOrigin?: boolean;
  onSubmit: Submit<{ name: string; origin?: string }>;
  cancel?: LabelledAction;
  title?: string;
  description?: string;
  messages?: Partial<ProjectCreateFlowMessages>;
}
/** Names a project and sets the origin of its site. */
export function ProjectCreateFlow({ mode, defaultValues, originRequired = true, showOrigin = true, onSubmit, cancel, title, description, messages, ...state }: ProjectCreateFlowProps) {
  const id = useId();
  const copy = { ...projectMessages, ...messages };
  return <NameForm {...state} title={title ?? (mode === 'create' ? copy.createTitle : copy.editTitle)} description={description} submitLabel={mode === 'create' ? copy.create : copy.save} cancel={cancel} cancelLabel={copy.cancel}
    onSubmit={form => onSubmit(showOrigin ? { name: formText(form, 'name'), origin: formText(form, 'origin') } : { name: formText(form, 'name') })}>
    <Field label={copy.nameLabel} htmlFor={`${id}-name`} error={state.fieldErrors?.name}><Input name="name" autoComplete="off" required maxLength={120} defaultValue={defaultValues.name} /></Field>
    {showOrigin && <Field label={copy.originLabel} htmlFor={`${id}-origin`} description={copy.originHint} error={state.fieldErrors?.origin}><Input name="origin" type="url" inputMode="url" autoComplete="off" spellCheck={false} required={originRequired} maxLength={2048} defaultValue={defaultValues.origin} /></Field>}
  </NameForm>;
}

/* ------------------------------------------------------------- Danger zone */

export interface DangerAction { id: string; title: string; description: string; confirmLabel: string; confirmationText?: string; retryOnly?: boolean }
export interface DangerZoneMessages { title: string; retry: string; confirmTitle: string }
const dangerMessages: DangerZoneMessages = { title: 'Danger zone', retry: 'Retry', confirmTitle: '{action}?' };
export interface DangerZoneFlowProps extends FlowState {
  actions: DangerAction[];
  onConfirm: Submit<{ id: string }>;
  title?: string;
  description?: string;
  messages?: Partial<DangerZoneMessages>;
}
/** Irreversible actions, each confirmed once. After an unconfirmed outcome only an exact retry of the attempted action is offered. */
export function DangerZoneFlow({ actions, onConfirm, title, description, messages, ...state }: DangerZoneFlowProps) {
  const copy = { ...dangerMessages, ...messages };
  const singleFlight = useSingleSubmit();
  const [target, setTarget] = useState<DangerAction>();
  const [attempted, setAttempted] = useState<string>();
  const locked = state.busy || state.disabled;
  // After a remount the attempt is unknown, so actions marked retryOnly stand in for it, but they confirm again:
  // only an attempt confirmed in this mount may be retried directly.
  const retry = state.unconfirmed ? actions.filter(action => attempted !== undefined ? action.id === attempted : action.retryOnly) : [];
  const directRetry = state.unconfirmed !== undefined && attempted !== undefined;
  const shown = state.unconfirmed ? retry : actions;
  const run = (action: DangerAction) => { setAttempted(action.id); return onConfirm({ id: action.id }); };
  return <SettingsFlow {...state} title={title ?? copy.title} description={description}>
    <Stack gap={4}>
      {shown.map(action => <div key={action.id} className="t98-workspace-danger-row">
        <Stack gap={1}><Heading level={3} size="sm">{action.title}</Heading><Text tone="muted" size="sm">{action.description}</Text></Stack>
        {directRetry
          ? <Button type="button" variant="danger" disabled={locked} aria-label={`${copy.retry}: ${action.title}`} onClick={() => void singleFlight(() => run(action))}>{copy.retry}</Button>
          : <Button type="button" variant="danger" disabled={locked} onClick={() => setTarget(action)}>{action.confirmLabel}</Button>}
      </div>)}
    </Stack>
    <ConfirmDialog open={target !== undefined} onOpenChange={open => { if (!open) setTarget(undefined); }} title={target ? copy.confirmTitle.replace('{action}', target.title) : copy.title} description={target?.description ?? ''} confirmLabel={target?.confirmLabel} danger
      confirmationText={target?.confirmationText} onConfirm={() => target ? singleFlight(() => run(target)) : undefined} />
  </SettingsFlow>;
}

/* ---------------------------------------------------------- Settings layout */

export type SettingsGroupId = 'account' | 'workspace' | 'project' | 'operator';
export interface SettingsNavItem {
  id: string;
  label: string;
  group: SettingsGroupId;
  href?: string;
  icon?: IconName;
  /** `false` omits the item for this user. This hides navigation only; the application still authorizes every request. */
  allowed?: boolean;
  keywords?: string[];
}
const defaultGroupLabels: Record<SettingsGroupId, string> = { account: 'Account', workspace: 'Workspace', project: 'Project', operator: 'Operator' };
const groupOrder: SettingsGroupId[] = ['account', 'workspace', 'project', 'operator'];
export interface SettingsLayoutProps {
  title: string;
  /** Names the workspace or project the settings apply to; display only. */
  scope?: string;
  items: SettingsNavItem[];
  /** Id of the item for the current page. */
  current: string;
  linkComponent?: NavLinkComponent;
  onNavigate?: (item: SettingsNavItem) => void;
  feedback?: ReactNode;
  navigationLabel?: string;
  groupLabels?: Partial<Record<SettingsGroupId, string>>;
  children: ReactNode;
}
/** Settings page with grouped navigation. It stacks above the content at narrow widths. */
export function SettingsLayout({ title, scope, items, current, linkComponent, onNavigate, feedback, navigationLabel = 'Settings', groupLabels, children }: SettingsLayoutProps) {
  const labels = { ...defaultGroupLabels, ...groupLabels };
  if (!onNavigate && items.some(item => item.href === undefined) && (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !== 'production') {
    console.warn('@ten98/ui SettingsLayout: items without href need onNavigate, otherwise they do nothing.');
  }
  const groups: SidebarNavGroup[] = groupOrder.map(group => ({
    id: group,
    label: labels[group],
    items: items.filter(item => item.group === group && item.allowed !== false).map(item => ({
      id: item.id, label: item.label, icon: item.icon, keywords: item.keywords, current: item.id === current,
      // Items without href rely on onNavigate; SettingsLayoutProps requires one of the two.
      ...(item.href !== undefined ? { href: item.href } : { onSelect: () => undefined }),
    })),
  })).filter(group => group.items.length > 0);
  const navigate = onNavigate && ((nav: { id: string }) => { const item = items.find(candidate => candidate.id === nav.id); if (item) onNavigate(item); });
  return <SettingsTemplate title={title} scope={scope ? <Text tone="muted" size="sm">{scope}</Text> : undefined} feedback={feedback}
    navigation={<SidebarNav label={navigationLabel} groups={groups} linkComponent={linkComponent} onNavigate={navigate} />}>
    {children}
  </SettingsTemplate>;
}
