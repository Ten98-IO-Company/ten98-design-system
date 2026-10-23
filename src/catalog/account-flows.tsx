import { AccountProfileFlow, Field, Input, LinkedIdentitiesFlow, PasswordChangeFlow, SessionListFlow, SettingsPanel, TwoFactorSetupFlow } from '../lib';
import { tsx, type ComponentEntry, type ComponentProp } from './model';

const prop = (name: string, type: string, description: string, required = false, defaultValue?: string): ComponentProp => ({ name, type, description, required, defaultValue });
const tokens = ['--t98-surface', '--t98-subtle', '--t98-text', '--t98-muted', '--t98-accent', '--t98-danger', '--t98-border', '--t98-font'];
const ownership = 'Applications keep requests, authorization, secrets and sessions, and supply every message; this component only presents them. Each value is edited only in this flow, so do not repeat these controls elsewhere.';
const nothing = () => undefined;
const stateProps = [
  prop('busy', 'boolean', 'Sets aria-busy, disables the controls and shows a loading submit button.', false, 'false'),
  prop('busyLabel', 'string', 'Submit label while busy.'),
  prop('error', 'string', 'Form-level failure shown as an alert. Focus moves to it when it changes after a submit.'),
  prop('unconfirmed', 'string', 'The outcome of the last request is unknown. Shown as a warning alert; say what to check and not to assume success or failure.'),
  prop('notice', '{ tone: Tone; text: string }', 'Status message, for example after saving.'),
  prop('fieldErrors', 'Partial<Record<string, string>>', 'Per-field messages keyed by the field names in the usage text.'),
  prop('disabled', 'boolean', 'Read-only view for restricted roles: inputs and actions are disabled and values stay visible.', false, 'false'),
  prop('title', 'string', 'Section heading (h2).'),
  prop('description', 'string', 'Supporting copy under the heading.'),
  prop('messages', 'Partial<Messages>', 'Replaces any built-in English text.'),
];
const accessibility = [
  'Each flow is a labelled section with an h2; fields keep native labels, autocomplete tokens and required validation.',
  'Errors and unconfirmed outcomes render as alerts; a destructive action opens one confirmation dialog and runs only after confirming.',
  'Controls are at least 44px tall; busy and disabled flows lock every control through a disabled fieldset.',
];

const sessions = [
  { id: 's1', device: 'Chrome on Windows', location: 'Dubai, AE', lastActiveAt: '2030-01-15T12:00:00Z', current: true },
  { id: 's2', device: 'Safari on iPhone', location: 'Doha, QA', lastActiveAt: '2030-01-14T08:30:00Z', current: false },
];
const sessionSetup = [
  'const sessions = [',
  "  { id: 's1', device: 'Chrome on Windows', location: 'Dubai, AE', lastActiveAt: '2030-01-15T12:00:00Z', current: true },",
  "  { id: 's2', device: 'Safari on iPhone', location: 'Doha, QA', lastActiveAt: '2030-01-14T08:30:00Z', current: false },",
  '];',
  'const revoke = (id: string) => console.log(id);',
  'const revokeOthers = () => undefined;',
].join('\n');
const sessionJsx = '<SessionListFlow\n  sessions={sessions}\n  onRevoke={({ id }) => revoke(id)}\n  onRevokeOthers={() => revokeOthers()}\n/>';

const identities = [{ id: 'i1', providerName: 'Microsoft', email: 'member@example.test', linkedAt: '2030-01-10T09:00:00Z' }];
const providers = [{ id: 'google', name: 'Google' }];
const identitySetup = [
  "const identities = [{ id: 'i1', providerName: 'Microsoft', email: 'member@example.test', linkedAt: '2030-01-10T09:00:00Z' }];",
  "const providers = [{ id: 'google', name: 'Google' }];",
  'const link = (providerId: string) => console.log(providerId);',
  'const unlink = (id: string, password: string) => console.log(id, password);',
].join('\n');
const identityJsx = (providersExpr: string, hasPassword: string, extra = '') => `<LinkedIdentitiesFlow\n  identities={identities}\n  providers={${providersExpr}}\n  ${hasPassword}\n  onLink={providerId => link(providerId)}\n  onUnlink={({ id, password }) => unlink(id, password)}${extra}\n/>`;
const proof = { providerName: 'Google', issuer: 'https://accounts.example.test', subject: 'subject-123', email: 'member@example.test', expiresAt: '2030-01-15T12:00:00Z' };
const proofJsx = "\n  pendingProof={{ providerName: 'Google', issuer: 'https://accounts.example.test', subject: 'subject-123', email: 'member@example.test', expiresAt: '2030-01-15T12:00:00Z' }}\n  onConfirmProof={() => undefined}\n  onDismissProof={() => undefined}";

const locales = [{ value: 'en', label: 'English' }, { value: 'ar', label: 'Arabic' }];
const zones = ['Asia/Dubai', 'Asia/Qatar', 'UTC'];
const profileSetup = [
  "const localeOptions = [{ value: 'en', label: 'English' }, { value: 'ar', label: 'Arabic' }];",
  "const timeZones = ['Asia/Dubai', 'Asia/Qatar', 'UTC'];",
  'const saveProfile = (values: unknown) => console.log(values);',
].join('\n');
const profileJsx = (extra = '') => `<AccountProfileFlow\n  email="member@example.test"\n  emailHref="/account/email"\n  defaultValues={{ name: 'Sam Rivera', theme: 'system', locale: 'en', timeZone: 'Asia/Dubai' }}\n  localeOptions={localeOptions}\n  timeZones={timeZones}\n  onDetectTimeZone={() => Intl.DateTimeFormat().resolvedOptions().timeZone}\n  onSubmit={values => saveProfile(values)}${extra}\n/>`;

const passwordSetup = 'const changePassword = (values: unknown) => console.log(values);';
const passwordJsx = (props: string) => `<PasswordChangeFlow\n  ${props}\n  onSubmit={values => changePassword(values)}\n/>`;

const twoFactorSetup = [
  'const startEnrolment = (password: string) => console.log(password);',
  'const verifyCode = (code: string) => console.log(code);',
  'const closeCodes = () => undefined;',
  'const regenerateCodes = (password: string) => console.log(password);',
  'const disableTwoFactor = (password: string) => console.log(password);',
].join('\n');
const enrolmentSetup = `${twoFactorSetup}\nconst enrolment = { qrDataUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', manualKey: 'JBSWY3DPEHPK3PXP' };`;
const twoFactorJsx = (stage: string, extra = '') => `<TwoFactorSetupFlow\n  stage="${stage}"${extra}\n  onStart={({ password }) => startEnrolment(password)}\n  onVerify={({ code }) => verifyCode(code)}\n  onAcknowledgeCodes={() => closeCodes()}\n  onRegenerate={({ password }) => regenerateCodes(password)}\n  onDisable={({ password }) => disableTwoFactor(password)}\n/>`;
const twoFactorHandlers = { onStart: nothing, onVerify: nothing, onAcknowledgeCodes: nothing, onRegenerate: nothing, onDisable: nothing };

const panelSetup = "const fieldErrors: Record<string, string> = {};\nconst saveWebhook = (form: FormData) => console.log(form.get('url'));";
const panelJsx = (extra = '') => `<SettingsPanel\n  title="Webhook"\n  description="Where campaign events are sent."\n  submitLabel="Save"${extra}\n  onSubmit={form => saveWebhook(form)}\n>\n  <Field label="Endpoint URL" htmlFor="url" error={fieldErrors.url}>\n    <Input id="url" name="url" type="url" defaultValue="https://example.test/hook" required />\n  </Field>\n</SettingsPanel>`;

export const accountFlowEntries: ComponentEntry[] = [
  {
    name: 'SettingsPanel', category: 'Application adapters', description: 'The section frame of the library settings flows, for your own settings screens.',
    usage: `Wrap your own fields. onSubmit(form: FormData) runs once at a time (a double submit sends one request) and the panel prevents the default post; omit onSubmit and pass action and method for a native post. Outcome alerts, the busy and read-only lock, and focus on a new error or invalid field behave as in the built-in flows, which use the same implementation. Pass each message from fieldErrors to the matching Field's error prop. Use actions for extra buttons beside submitLabel. ${ownership}`,
    props: [prop('onSubmit', '(form: FormData) => void | Promise<void>', 'Receives the form values; omit for read-mostly panels or native posts.'), prop('action', 'string', 'Native post target when onSubmit is omitted.'), prop('method', "'get' | 'post'", 'Native method.'), prop('submitLabel', 'string', 'Submit button label; omit when actions holds the buttons.'), prop('submitDisabled', 'boolean', 'Disables the submit button.'), prop('actions', 'ReactNode', 'Extra buttons or links beside the submit button.'), prop('children', 'ReactNode', 'The fields.', true), ...stateProps.filter(item => item.name !== 'messages')],
    tokens, accessibility, related: ['AccountProfileFlow', 'SettingsSection', 'SettingsTemplate'],
    example: tsx(['Field', 'Input', 'SettingsPanel'], panelJsx(), panelSetup),
    states: [
      { name: 'Default', description: 'Heading, fields and a submit button.', preview: <SettingsPanel title="Webhook" description="Where campaign events are sent." submitLabel="Save" onSubmit={nothing}><Field label="Endpoint URL" htmlFor="url"><Input id="url" name="url" type="url" defaultValue="https://example.test/hook" required /></Field></SettingsPanel>, code: tsx(['Field', 'Input', 'SettingsPanel'], panelJsx(), panelSetup) },
      { name: 'Error', description: 'A failure appears as an alert and takes focus after a submit.', preview: <SettingsPanel title="Webhook" submitLabel="Save" onSubmit={nothing} error="The endpoint could not be saved."><Field label="Endpoint URL" htmlFor="url"><Input id="url" name="url" type="url" defaultValue="https://example.test/hook" /></Field></SettingsPanel>, code: tsx(['Field', 'Input', 'SettingsPanel'], panelJsx('\n  error="The endpoint could not be saved."'), panelSetup) },
    ],
  },
  {
    name: 'AccountProfileFlow', category: 'Application adapters', description: 'Profile settings: name, theme, language and time zone.',
    usage: `Shows the email read-only, with an optional emailHref to where it is changed. onSubmit receives { name, theme, locale, timeZone }; the time zone is chosen from timeZones (no custom values) and onDetectTimeZone powers a "Use my time zone" button. onDirtyChange reports unsaved edits so the app can guard navigation. fieldErrors keys: name, theme, locale, timeZone. ${ownership}`,
    props: [prop('email', 'string', 'Read-only email address.', true), prop('emailHref', 'string', 'Link to where the email is changed.'), prop('defaultValues', '{ name: string; theme: "system" | "light" | "dark"; locale: string; timeZone: string }', 'Initial values.', true), prop('localeOptions', 'SelectOption[]', 'Language and region choices.', true), prop('timeZones', 'string[]', 'Allowed time zones.', true), prop('onDetectTimeZone', '() => string | null', 'Returns the device time zone; adds the detect button.'), prop('onSubmit', '(values: AccountProfileValues) => void | Promise<void>', 'Receives the typed values.', true), prop('onDirtyChange', '(dirty: boolean) => void', 'Called when the form differs from defaultValues.'), ...stateProps],
    tokens, accessibility, related: ['PasswordChangeFlow', 'Combobox', 'RadioGroup'],
    example: tsx(['AccountProfileFlow'], profileJsx(), profileSetup),
    states: [
      { name: 'Default', description: 'Editable profile with a read-only email.', preview: <AccountProfileFlow email="member@example.test" emailHref="#email" defaultValues={{ name: 'Sam Rivera', theme: 'system', locale: 'en', timeZone: 'Asia/Dubai' }} localeOptions={locales} timeZones={zones} onDetectTimeZone={() => 'UTC'} onSubmit={nothing} />, code: tsx(['AccountProfileFlow'], profileJsx(), profileSetup) },
      { name: 'Read only', description: 'Disabled flows keep values visible.', preview: <AccountProfileFlow email="member@example.test" defaultValues={{ name: 'Sam Rivera', theme: 'dark', locale: 'ar', timeZone: 'Asia/Qatar' }} localeOptions={locales} timeZones={zones} onSubmit={nothing} disabled />, code: tsx(['AccountProfileFlow'], profileJsx('\n  disabled'), profileSetup) },
    ],
  },
  {
    name: 'PasswordChangeFlow', category: 'Application adapters', description: 'Change password with confirmation and policy hint.',
    usage: `onSubmit receives { currentPassword, newPassword }; the confirmation match is checked in the library before it is called. Set hasPassword to false for accounts without a password: the form is replaced by an explanation and an optional link (setPasswordHref). fieldErrors keys: currentPassword, newPassword, confirmation. ${ownership}`,
    props: [prop('hasPassword', 'boolean', 'False replaces the form with a "set a password" message.', true), prop('setPasswordHref', 'string', 'Where a password is set when hasPassword is false.'), prop('policy', '{ minLength: number; maxLength: number; hint?: string }', 'Length limits and hint.', false, '{ minLength: 12, maxLength: 128 }'), prop('onSubmit', '(values: { currentPassword: string; newPassword: string }) => void | Promise<void>', 'Receives the typed values.', true), ...stateProps],
    tokens, accessibility: [...accessibility, 'Passwords use current-password and new-password autocomplete tokens so password managers behave.'], related: ['AccountProfileFlow', 'TwoFactorSetupFlow'],
    example: tsx(['PasswordChangeFlow'], passwordJsx('hasPassword'), passwordSetup),
    states: [
      { name: 'Default', description: 'Current, new and confirmation fields.', preview: <PasswordChangeFlow hasPassword onSubmit={nothing} />, code: tsx(['PasswordChangeFlow'], passwordJsx('hasPassword'), passwordSetup) },
      { name: 'No password', description: 'Provider-only account.', preview: <PasswordChangeFlow hasPassword={false} setPasswordHref="#set" onSubmit={nothing} />, code: tsx(['PasswordChangeFlow'], passwordJsx('hasPassword={false}\n  setPasswordHref="/account/set-password"'), passwordSetup) },
      { name: 'Unconfirmed', description: 'The outcome is unknown after a timeout.', preview: <PasswordChangeFlow hasPassword onSubmit={nothing} unconfirmed="We could not confirm whether your password changed. Reload this page before trying again." />, code: tsx(['PasswordChangeFlow'], passwordJsx('hasPassword\n  unconfirmed="We could not confirm whether your password changed. Reload this page before trying again."'), passwordSetup) },
    ],
  },
  {
    name: 'TwoFactorSetupFlow', category: 'Application adapters', description: 'Two-factor enrolment, recovery codes and management.',
    usage: `Drive stage from your own state: off (password then start), enrolling (QR image, copyable key and a one-time-code field), codes (recovery codes with Copy all, Download and "I saved these codes") and on (regenerate or turn off, both confirmed once). Recovery codes render only in the codes stage; downloadName names the .txt file. Callbacks: onStart({ password }), onVerify({ code }), onAcknowledgeCodes(), onRegenerate({ password }), onDisable({ password }). fieldErrors keys: password, code. ${ownership}`,
    props: [prop('stage', "'off' | 'enrolling' | 'codes' | 'on'", 'Which step to show.', true), prop('enrolment', '{ qrDataUrl: string; manualKey: string; uri?: string }', 'Enrolment secrets for the enrolling stage.'), prop('recoveryCodes', 'string[]', 'Shown only in the codes stage.'), prop('codeLength', 'number', 'Digits in the authentication code.', false, '6'), prop('downloadName', 'string', 'File name of the recovery-code download.', false, "'recovery-codes.txt'"), prop('onStart', '(values: { password: string }) => void | Promise<void>', 'Begin enrolment.', true), prop('onVerify', '(values: { code: string }) => void | Promise<void>', 'Verify the first code.', true), prop('onAcknowledgeCodes', '() => void | Promise<void>', 'The person saved the codes.', true), prop('onRegenerate', '(values: { password: string }) => void | Promise<void>', 'Runs after confirmation.', true), prop('onDisable', '(values: { password: string }) => void | Promise<void>', 'Runs after confirmation.', true), ...stateProps],
    tokens, accessibility: [...accessibility, 'The QR image has alt text and a copyable key; the code field uses autocomplete=one-time-code with numeric input.'], related: ['PasswordChangeFlow', 'CopyButton', 'CodeBlock'],
    example: tsx(['TwoFactorSetupFlow'], twoFactorJsx('off'), twoFactorSetup),
    states: [
      { name: 'Off', description: 'Confirm the password to start.', preview: <TwoFactorSetupFlow stage="off" {...twoFactorHandlers} />, code: tsx(['TwoFactorSetupFlow'], twoFactorJsx('off'), twoFactorSetup) },
      { name: 'Enrolling', description: 'QR code, setup key and verification.', preview: <TwoFactorSetupFlow stage="enrolling" enrolment={{ qrDataUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', manualKey: 'JBSWY3DPEHPK3PXP' }} {...twoFactorHandlers} />, code: tsx(['TwoFactorSetupFlow'], twoFactorJsx('enrolling', '\n  enrolment={enrolment}'), enrolmentSetup) },
      { name: 'Recovery codes', description: 'Shown once, with copy and download.', preview: <TwoFactorSetupFlow stage="codes" recoveryCodes={['a1b2-c3d4', 'e5f6-g7h8']} {...twoFactorHandlers} />, code: tsx(['TwoFactorSetupFlow'], twoFactorJsx('codes', "\n  recoveryCodes={['a1b2-c3d4', 'e5f6-g7h8']}"), twoFactorSetup) },
      { name: 'On', description: 'Regenerate or turn off, each confirmed.', preview: <TwoFactorSetupFlow stage="on" {...twoFactorHandlers} />, code: tsx(['TwoFactorSetupFlow'], twoFactorJsx('on'), twoFactorSetup) },
    ],
  },
  {
    name: 'SessionListFlow', category: 'Application adapters', description: 'Signed-in sessions with sign-out actions.',
    usage: `Lists sessions in a table that stacks on narrow screens. The current session is marked and has no revoke action. onRevoke({ id }) and onRevokeOthers() run only after one confirmation. formatDate defaults to a deterministic English, UTC, medium date. ${ownership}`,
    props: [prop('sessions', '{ id: string; device: string; location?: string; lastActiveAt: string | Date; current: boolean }[]', 'Active sessions.', true), prop('onRevoke', '(values: { id: string }) => void | Promise<void>', 'Runs after confirmation.', true), prop('onRevokeOthers', '() => void | Promise<void>', 'Runs after confirmation.', true), prop('formatDate', '(value: string | Date) => string', 'Date formatter.', false, 'English, UTC, medium'), ...stateProps],
    tokens, accessibility: [...accessibility, 'Table semantics are kept when stacked; each revoke button names its device.'], related: ['DataTable', 'LinkedIdentitiesFlow'],
    example: tsx(['SessionListFlow'], sessionJsx, sessionSetup),
    states: [
      { name: 'Default', description: 'The current session cannot be revoked.', preview: <SessionListFlow sessions={sessions} onRevoke={nothing} onRevokeOthers={nothing} />, code: tsx(['SessionListFlow'], sessionJsx, sessionSetup) },
    ],
  },
  {
    name: 'LinkedIdentitiesFlow', category: 'Application adapters', description: 'Linked sign-in providers with link and unlink.',
    usage: `Lists linked providers and offers providers to link (onLink(providerId)). onUnlink({ id, password }) runs after one confirmation; when hasPassword is true a current-password field must be filled first. Unlinking the last sign-in method is blocked when hasPassword is false, with an explanation. Pass pendingProof with onConfirmProof and onDismissProof to show the provider account details for a final check before linking. fieldErrors key: password. ${ownership}`,
    props: [prop('identities', '{ id: string; providerName: string; email?: string; linkedAt: string | Date }[]', 'Linked providers.', true), prop('providers', 'OidcProvider[]', 'Providers that can be linked.', true), prop('hasPassword', 'boolean', 'Whether the account has a password.', true), prop('onLink', '(providerId: string) => void', 'Starts linking; providers with href are links instead.', true), prop('onUnlink', '(values: { id: string; password: string }) => void | Promise<void>', 'Runs after confirmation.', true), prop('pendingProof', '{ providerName: string; issuer: string; subject: string; email?: string; expiresAt: string | Date }', 'Provider account awaiting confirmation.'), prop('onConfirmProof', '() => void | Promise<void>', 'Confirms the pending link.'), prop('onDismissProof', '() => void', 'Cancels the pending link.'), prop('formatDate', '(value: string | Date) => string', 'Date formatter.', false, 'English, UTC, medium'), ...stateProps],
    tokens, accessibility: [...accessibility, 'A blocked unlink is disabled and explained in text, not by colour alone.'], related: ['SessionListFlow', 'OidcProviderButtons'],
    example: tsx(['LinkedIdentitiesFlow'], identityJsx('providers', 'hasPassword'), identitySetup),
    states: [
      { name: 'Default', description: 'Unlink needs the current password.', preview: <LinkedIdentitiesFlow identities={identities} providers={providers} hasPassword onLink={nothing} onUnlink={nothing} />, code: tsx(['LinkedIdentitiesFlow'], identityJsx('providers', 'hasPassword'), identitySetup) },
      { name: 'Last method', description: 'Without a password the only identity cannot be unlinked.', preview: <LinkedIdentitiesFlow identities={identities} providers={[]} hasPassword={false} onLink={nothing} onUnlink={nothing} />, code: tsx(['LinkedIdentitiesFlow'], identityJsx('[]', 'hasPassword={false}'), identitySetup) },
      { name: 'Pending proof', description: 'Confirm the provider account before linking.', preview: <LinkedIdentitiesFlow identities={identities} providers={providers} hasPassword onLink={nothing} onUnlink={nothing} pendingProof={proof} onConfirmProof={nothing} onDismissProof={nothing} />, code: tsx(['LinkedIdentitiesFlow'], identityJsx('providers', 'hasPassword', proofJsx), identitySetup) },
    ],
  },
];
