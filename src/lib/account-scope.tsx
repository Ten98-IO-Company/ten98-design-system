'use client';

import { useId, useState, type ReactNode } from 'react';
import { Badge, Button, Field, Select } from './primitives.js';
import { Combobox, Fieldset, RadioGroup, StatusLine } from './controls.js';
import { Text } from './structure.js';

/* Choose a provider connection, then the account inside it. Presentation only: loading the accounts, the default
 * account after a connection change and reconnecting stay with the caller. */

export type ConnectionStatus = 'connected' | 'expired' | 'error';
export interface ScopeConnection { id: string; label: string; status?: ConnectionStatus; detail?: ReactNode }
export interface ScopeAccount { id: string; label: string; detail?: ReactNode; disabled?: boolean; disabledReason?: string }

export interface AccountScopeLabels {
  legend: string;
  connection: string;
  account: string;
  chooseConnection: string;
  chooseConnectionFirst: string;
  loading: string;
  noAccounts: string;
  noConnections: string;
  connect: string;
  reconnect: string;
  expired: string;
  error: string;
  expiredExplanation: string;
  errorExplanation: string;
}
const defaultLabels: AccountScopeLabels = {
  legend: 'Account',
  connection: 'Connection',
  account: 'Account',
  chooseConnection: 'Choose a connection',
  chooseConnectionFirst: 'Choose a connection to see its accounts.',
  loading: 'Loading accounts…',
  noAccounts: 'This connection has no accounts available.',
  noConnections: 'No connections yet.',
  connect: 'Connect an account',
  reconnect: 'Reconnect',
  expired: 'Expired',
  error: 'Error',
  expiredExplanation: 'This connection has expired. Reconnect it to choose an account.',
  errorExplanation: 'This connection has an error. Reconnect it or contact support to choose an account.',
};

/** Up to this many accounts are shown as radio buttons; more use a list-only Combobox. */
const ACCOUNT_RADIO_LIMIT = 6;

export interface AccountScopePickerProps {
  connections: ScopeConnection[];
  /** `null` while the accounts of the chosen connection are loading. */
  accounts: ScopeAccount[] | null;
  connectionId: string | null;
  accountId: string | null;
  onConnectionChange: (id: string) => void;
  /** Called with an empty string when the choice is cleared. */
  onAccountChange: (id: string) => void;
  /** Where to send people when there are no connections, or to reconnect an expired one. */
  connectHref?: string;
  onConnect?: () => void;
  labels?: Partial<AccountScopeLabels>;
  required?: boolean;
  /** Read-only: both choices are shown but cannot change, for example without permission or while saving. */
  disabled?: boolean;
  error?: ReactNode;
  /** Native form names: `${name}.connection` and `${name}.account`. */
  name?: string;
}

/** A connection Select followed by the accounts inside it, as radio buttons or a list-only combobox. */
export function AccountScopePicker({ connections, accounts, connectionId, accountId, onConnectionChange, onAccountChange, connectHref, onConnect, labels: custom, required, disabled = false, error, name }: AccountScopePickerProps) {
  const labels = { ...defaultLabels, ...custom };
  const fallbackName = useId();
  const [typed, setTyped] = useState('');
  const connection = connections.find(item => item.id === connectionId);
  const status = connection?.status ?? 'connected';
  const statusText = (value: ConnectionStatus) => value === 'expired' ? labels.expired : labels.error;
  const connect = connectHref !== undefined || onConnect ? (label: string) => <Button variant="secondary" href={connectHref} onClick={onConnect}>{label}</Button> : null;

  if (connections.length === 0) {
    return <Fieldset legend={labels.legend} error={error}>
      <Text tone="muted">{labels.noConnections}</Text>
      {connect?.(labels.connect)}
    </Fieldset>;
  }

  const choose = (id: string) => {
    if (id === connectionId) return;
    onConnectionChange(id);
    // The caller decides any default account for the new connection.
    if (accountId) onAccountChange('');
    setTyped('');
  };
  const chosen = accountId ?? '';
  return <Fieldset legend={labels.legend} error={error}>
    <Field label={labels.connection} description={connection?.detail} required={required}>
      <Select name={name && `${name}.connection`} value={connectionId ?? ''} required={required} disabled={disabled} placeholder={labels.chooseConnection}
        options={connections.map(item => ({ value: item.id, label: item.status && item.status !== 'connected' ? `${item.label} (${statusText(item.status)})` : item.label }))}
        onChange={event => choose(event.target.value)} />
    </Field>
    {connection && status !== 'connected' && <div className="t98-account-scope-status">
      <Badge tone={status === 'expired' ? 'warning' : 'danger'} dot>{statusText(status)}</Badge>
      <Text size="sm" tone="muted">{status === 'expired' ? labels.expiredExplanation : labels.errorExplanation}</Text>
      {connect?.(labels.reconnect)}
    </div>}
    {!connection && <Text size="sm" tone="muted">{labels.chooseConnectionFirst}</Text>}
    {connection && status === 'connected' && (accounts === null
      ? <StatusLine busy>{labels.loading}</StatusLine>
      : accounts.length === 0
        ? <Text tone="muted">{labels.noAccounts}</Text>
        : accounts.length <= ACCOUNT_RADIO_LIMIT
          ? <RadioGroup legend={labels.account} required={required} disabled={disabled} name={name ? `${name}.account` : `${fallbackName}-account`} value={chosen} onValueChange={onAccountChange}
            options={accounts.map(item => ({ value: item.id, label: item.label, disabled: item.disabled,
              description: item.disabled && item.disabledReason ? item.disabledReason : item.detail }))} />
          // The combobox keeps unlisted text as its value, so typing clears the account until a listed one is accepted.
          : <Combobox label={labels.account} required={required} disabled={disabled} allowCustom={false} name={name && `${name}.account`}
            options={accounts.filter(item => !item.disabled).map(item => ({ value: item.id, label: item.label }))}
            value={chosen || typed}
            onValueChange={value => {
              if (accounts.some(item => item.id === value && !item.disabled)) { setTyped(''); if (value !== chosen) onAccountChange(value); return; }
              setTyped(value);
              if (chosen) onAccountChange('');
            }} />)}
  </Fieldset>;
}
