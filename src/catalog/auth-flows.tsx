import type { ComponentProps, ReactNode } from 'react';
import { AppBrand } from '../lib/app';
import { AppStateScreen, AuthErrorBoundary, AuthStory, FirstUserSetupFlow, OidcProviderButtons, SignInFlow } from '../lib';
import { tsx, type ComponentEntry, type ComponentProp, type ComponentState } from './model';

const prop = (name: string, type: string, description: string, required = false, defaultValue?: string): ComponentProp => ({ name, type, description, required, defaultValue });
const tokens = ['--t98-surface', '--t98-subtle', '--t98-surface-raised', '--t98-text', '--t98-muted', '--t98-accent', '--t98-danger', '--t98-font'];
const ownership = 'Applications keep requests, sessions, routing, CSRF and OIDC redirects, and supply every message; this component only presents them.';
const brand = <AppBrand product="Campaign" />;
const nothing = () => undefined;

/** Copyable file: public imports plus AppBrand from the app entry point. */
function code(imports: string[], jsx: string, setup = '', reactImports: string[] = []) {
  return tsx(imports, jsx, setup, reactImports).replace("'use client';", "'use client';\n\nimport { AppBrand } from '@ten98/ui/app';\n// Load @ten98/ui/styles.css once at the application root.");
}

const baseProps = [
  prop('brand', 'ReactNode', 'Brand content, normally AppBrand.', true),
  prop('title', 'string', 'The screen’s only h1.', true),
  prop('description', 'string', 'Supporting copy below the title.'),
  prop('eyebrow', 'string', 'Small label above the title.'),
  prop('aside', 'ReactNode', 'Side panel, normally AuthStory. Stacks above the form below 760px.'),
  prop('footer', 'ReactNode', 'Legal or support text below the form.'),
  prop('label', 'string', 'Accessible name for the whole screen.'),
  prop('onSubmit', '(values: AuthFormValues) => void | Promise<void>', 'Controlled mode: receives the form values, including hidden fields. Omit it to post natively to action.'),
  prop('action', 'string', 'Native posting target used when onSubmit is absent.'),
  prop('method', "'get' | 'post'", 'Native posting method.', false, "'post'"),
  prop('hiddenFields', 'Record<string, string>', 'Extra values such as a CSRF token, posted with the form.'),
  prop('busy', 'boolean', 'Sets aria-busy, disables the fields, shows a loading submit button and ignores repeated submits.', false, 'false'),
  prop('busyLabel', 'string', 'Submit label while busy.'),
  prop('error', 'string', 'Form-level failure shown as an alert. Focus moves to it when it changes after a submit.'),
  prop('notice', '{ tone: Tone; text: string }', 'Status message, for example after a password reset.'),
  prop('fieldErrors', 'Partial<Record<AuthFieldName, string>>', 'Per-field messages keyed email, password, token, name or workspaceName.'),
  prop('submitLabel', 'string', 'Submit button text.'),
  prop('linkComponent', 'ComponentType<{ href; className; children }>', 'Router link used for href actions.'),
];
const baseAccessibility = [
  'Exactly one h1 per screen; fields keep native labels, autocomplete tokens and required validation.',
  'Errors render as role=alert and receive focus after a failed submit; notices use role=status.',
  'While busy the form has aria-busy and a disabled fieldset, so repeated submits cannot happen.',
];

const signInJsx = (extra = '') => `<SignInFlow
  brand={<AppBrand product="Campaign" />}
  title="Sign in"
  description="Use your account to access your workspaces."
  action="/login"
  hiddenFields={{ csrf: 'token-from-server' }}${extra}
/>`;
const setupJsx = (extra = '') => `<FirstUserSetupFlow
  brand={<AppBrand product="Campaign" />}
  title="Create owner account"
  description="Create the owner account for this installation."
  action="/setup"
  tokenHint="Printed in the server log on first start."${extra}
/>`;
const state = (name: string, description: string, preview: ReactNode, source: string): ComponentState => ({ name, description, preview, code: source });

const signIn = (props: Partial<ComponentProps<typeof SignInFlow>> = {}) => <SignInFlow brand={brand} title="Sign in" description="Use your account to access your workspaces." onSubmit={nothing} {...props} />;
const setup = (props: Partial<ComponentProps<typeof FirstUserSetupFlow>> = {}) => <FirstUserSetupFlow brand={brand} title="Create owner account" description="Create the owner account for this installation." tokenHint="Printed in the server log on first start." onSubmit={nothing} {...props} />;
const imports = (...names: string[]) => names;
const signInImports = imports('SignInFlow');
const setupImports = imports('FirstUserSetupFlow');

export const authFlowEntries: ComponentEntry[] = [
  {
    name: 'SignInFlow', category: 'Application adapters', description: 'Complete email and password sign-in screen.',
    usage: `Compose it once per sign-in route. Controlled mode (onSubmit) reads values from the form; native mode (action and method) posts the form so the server can redirect. ${ownership} Pass OidcProviderButtons as providers for single sign-on.`,
    props: [...baseProps, prop('defaultValues', '{ email?: string }', 'Initial email. Passwords are never prefilled.'), prop('passwordPolicy', '{ maxLength: number }', 'Only the maximum applies to a current password.'), prop('forgotPassword', '{ label?: string; onClick(email) } | { label?: string; href }', 'Recovery action under the password field. onClick receives the typed email.'), prop('cancel', '{ label: string; onClick?: () => void; href?: string }', 'Secondary exit, for example back to a product page.'), prop('providers', 'ReactNode', 'Sign-on provider slot below the form.')],
    tokens, accessibility: [...baseAccessibility, 'Email uses autocomplete=username and the password current-password so password managers fill both.'], related: ['FirstUserSetupFlow', 'OidcProviderButtons', 'AuthStory', 'AuthLayout'],
    example: code(signInImports, signInJsx()),
    states: [
      state('Native post', 'Posts to the server with a CSRF value in a hidden field.', signIn({ onSubmit: undefined, action: '/login', hiddenFields: { csrf: 'token-from-server' } }), code(signInImports, signInJsx())),
      state('Controlled with recovery', 'onSubmit receives { email, password }; forgotPassword receives the typed email.', signIn({ forgotPassword: { onClick: nothing }, cancel: { label: 'Back to Campaign', href: '#campaign' } }), code(signInImports, signInJsx('\n  forgotPassword={{ onClick: email => console.log(email) }}\n  cancel={{ label: \'Back to Campaign\', href: \'/\' }}').replace('\n  action="/login"\n  hiddenFields={{ csrf: \'token-from-server\' }}', '\n  onSubmit={values => console.log(values.email)}'))),
      state('Busy', 'Fields are disabled, the button shows a spinner and repeated submits are ignored.', signIn({ busy: true }), code(signInImports, signInJsx('\n  busy').replace('\n  action="/login"\n  hiddenFields={{ csrf: \'token-from-server\' }}', '\n  onSubmit={() => undefined}'))),
      state('Error and notice', 'The app supplies the error text and any status notice.', signIn({ error: 'The email or password is incorrect.', notice: { tone: 'success', text: 'Password updated. Sign in with the new password.' }, fieldErrors: { email: 'Enter a valid email address.' } }), code(signInImports, signInJsx('\n  error="The email or password is incorrect."\n  notice={{ tone: \'success\', text: \'Password updated. Sign in with the new password.\' }}\n  fieldErrors={{ email: \'Enter a valid email address.\' }}'))),
    ],
  },
  {
    name: 'FirstUserSetupFlow', category: 'Application adapters', description: 'Owner account creation for a new installation.',
    usage: `Use when no user exists yet. The setup token proves control of the server; ${ownership.toLowerCase()} Set workspaceName to also collect a workspace name and sampleOptIn to offer sample content.`,
    props: [...baseProps, prop('defaultValues', '{ name?: string; email?: string; workspaceName?: string }', 'Initial values. Passwords and tokens are never prefilled.'), prop('passwordPolicy', '{ minLength: number; maxLength: number; hint?: string }', 'Length limits and the hint shown under the password.', false, '{ minLength: 12, maxLength: 128 }'), prop('tokenLength', '{ min?: number; max?: number }', 'Setup token length limits.'), prop('tokenHint', 'string', 'Where to find the setup token.'), prop('workspaceName', 'boolean', 'Show the workspace name field.', false, 'false'), prop('sampleOptIn', '{ label: string; defaultChecked?: boolean } | false', 'Checkbox named sample; sent as "true" when checked.', false, 'false'), prop('signInInstead', '{ label?: string; onClick(email) } | { label?: string; href }', 'Link for people who already have an account.')],
    tokens, accessibility: [...baseAccessibility, 'The token is a password field with autocomplete=off; the new password uses autocomplete=new-password and shows the policy as its description.'], related: ['SignInFlow', 'AuthStory', 'AuthLayout'],
    example: code(setupImports, setupJsx('\n  workspaceName\n  sampleOptIn={{ label: \'Add sample content\', defaultChecked: true }}\n  signInInstead={{ href: \'/login\' }}')),
    states: [
      state('Owner account', 'Name, token, email and password with the default 12 to 128 character policy.', setup(), code(setupImports, setupJsx())),
      state('Workspace and sample', 'Adds a workspace name and a sample content opt-in.', setup({ workspaceName: true, sampleOptIn: { label: 'Add sample content', defaultChecked: true }, signInInstead: { href: '#login' } }), code(setupImports, setupJsx('\n  workspaceName\n  sampleOptIn={{ label: \'Add sample content\', defaultChecked: true }}\n  signInInstead={{ href: \'/login\' }}'))),
      state('Busy', 'Disabled form with a loading button.', setup({ busy: true }), code(setupImports, setupJsx('\n  busy'))),
      state('Field errors', 'Server validation messages attach to their fields and focus moves to the first one after a submit.', setup({ error: 'The account could not be created.', fieldErrors: { token: 'The setup token does not match.', password: 'Use at least 12 characters.' } }), code(setupImports, setupJsx('\n  error="The account could not be created."\n  fieldErrors={{ token: \'The setup token does not match.\', password: \'Use at least 12 characters.\' }}'))),
    ],
  },
  {
    name: 'OidcProviderButtons', category: 'Application adapters', description: 'Single sign-on provider choices below a divider.',
    usage: `Pass it as SignInFlow providers. A provider with href is a native link to the app’s redirect route; without href the button calls onStart so the app can begin the flow. An empty list renders nothing. ${ownership}`,
    props: [prop('providers', '{ id: string; name: string; href?: string }[] | null', 'Available providers; null while unknown.', true), prop('loading', 'boolean', 'Shows a status while providers load.', false, 'false'), prop('loadingLabel', 'string', 'Loading text.', false, "'Loading sign-in options…'"), prop('error', 'string', 'Failure loading providers.'), prop('onRetry', '() => void', 'Adds a retry button to the error.'), prop('retryLabel', 'string', 'Retry button text.', false, "'Try again'"), prop('onStart', '(id: string) => void', 'Starts the flow for a provider without href.'), prop('pending', 'string | null', 'Provider being started; it shows loading and the others are disabled.', false, 'null'), prop('dividerLabel', 'string', 'Text in the divider.', false, "'or continue with'"), prop('labelFor', '(provider) => string', 'Button text.', false, "provider => `Continue with ${provider.name}`")],
    tokens, accessibility: ['Providers are a labelled list of links or buttons; loading uses role=status and failure role=alert.', 'A pending provider is disabled and busy so it cannot start twice.'], related: ['SignInFlow', 'Button'],
    example: code(['SignInFlow', 'OidcProviderButtons'], '<SignInFlow\n  brand={<AppBrand product="Campaign" />}\n  title="Sign in"\n  action="/login"\n  providers={<OidcProviderButtons providers={[{ id: \'entra\', name: \'Microsoft\', href: \'/auth/entra\' }]} />}\n/>'),
    states: [
      state('Links and buttons', 'href renders a native link; no href calls onStart.', <OidcProviderButtons providers={[{ id: 'entra', name: 'Microsoft', href: '#entra' }, { id: 'google', name: 'Google' }]} onStart={nothing} />, code(['OidcProviderButtons'], '<OidcProviderButtons\n  providers={[{ id: \'entra\', name: \'Microsoft\', href: \'/auth/entra\' }, { id: \'google\', name: \'Google\' }]}\n  onStart={id => console.log(id)}\n/>')),
      state('Pending', 'The started provider loads; the others are disabled.', <OidcProviderButtons providers={[{ id: 'entra', name: 'Microsoft' }, { id: 'google', name: 'Google' }]} pending="google" />, code(['OidcProviderButtons'], '<OidcProviderButtons providers={[{ id: \'entra\', name: \'Microsoft\' }, { id: \'google\', name: \'Google\' }]} pending="google" />')),
      state('Loading and error', 'A status while loading, then an alert with retry.', <OidcProviderButtons providers={null} error="Sign-in providers could not be loaded." onRetry={nothing} />, code(['OidcProviderButtons'], '<OidcProviderButtons providers={null} error="Sign-in providers could not be loaded." onRetry={() => undefined} />')),
    ],
  },
  {
    name: 'AuthStory', category: 'Layout', description: 'Side-panel story for authentication screens.',
    usage: 'Pass it as aside to SignInFlow or FirstUserSetupFlow. The title is styled text, not a heading, so the form keeps the screen’s only h1. The panel stacks above the form below 760px and its channel chips are hidden on phones.',
    props: [prop('eyebrow', 'string', 'Small uppercase label.', true), prop('title', 'string', 'Large styled statement.', true), prop('emphasis', 'string', 'Final words of the title in the accent color.'), prop('lead', 'string', 'Supporting sentence.', true), prop('channels', '{ icon: string; label: string }[]', 'Decorative chips; icon is an Icon name. Hidden from assistive technology.'), prop('footnote', 'string', 'Small text at the bottom.', true), prop('label', 'string', 'Accessible name for the story group.')],
    tokens, accessibility: ['Not a heading; the form supplies the h1.', 'Channel chips are aria-hidden because the lead already says what they illustrate.'], related: ['SignInFlow', 'FirstUserSetupFlow', 'Icon'],
    example: code(['AuthStory', 'SignInFlow'], '<SignInFlow\n  brand={<AppBrand product="Campaign" />}\n  title="Sign in"\n  action="/login"\n  aside={\n    <AuthStory\n      eyebrow="CAMPAIGN MANAGEMENT"\n      title="Plan. Publish."\n      emphasis="Measure."\n      lead="Manage social posts, advertising and campaign assets."\n      channels={[{ icon: \'send\', label: \'Social\' }, { icon: \'target\', label: \'Advertising\' }]}\n      footnote="ten98 Campaign"\n    />\n  }\n/>'),
    states: [state('With channels', 'Eyebrow, emphasized title, lead, channel chips and footnote.', signIn({ aside: <AuthStory eyebrow="CAMPAIGN MANAGEMENT" title="Plan. Publish." emphasis="Measure." lead="Manage social posts, advertising and campaign assets." channels={[{ icon: 'send', label: 'Social' }, { icon: 'target', label: 'Advertising' }]} footnote="ten98 Campaign" /> }), code(['AuthStory', 'SignInFlow'], '<SignInFlow\n  brand={<AppBrand product="Campaign" />}\n  title="Sign in"\n  onSubmit={() => undefined}\n  aside={\n    <AuthStory\n      eyebrow="CAMPAIGN MANAGEMENT"\n      title="Plan. Publish."\n      emphasis="Measure."\n      lead="Manage social posts, advertising and campaign assets."\n      channels={[{ icon: \'send\', label: \'Social\' }, { icon: \'target\', label: \'Advertising\' }]}\n      footnote="ten98 Campaign"\n    />\n  }\n/>'))],
  },
  {
    name: 'AppStateScreen', category: 'Application adapters', description: 'Full-screen loading and failure states before the app shell is available.',
    usage: 'Use while a session or configuration loads, when it fails, or as a boundary fallback. Loading is a status; error and boundary show an alert with a retry button when onRetry is given. The title is the screen’s h1.',
    props: [prop('state', "'loading' | 'error' | 'boundary'", 'Which state to show.', true), prop('brand', 'ReactNode', 'Brand content, normally AppBrand.', true), prop('title', 'string', 'The h1. Defaults per state.'), prop('message', 'string', 'What happened, in plain words. Defaults per state.'), prop('onRetry', '() => void', 'Shows the retry button.'), prop('retryLabel', 'string', 'Retry button text. Defaults to Try again, or Reload for boundary.')],
    tokens, accessibility: ['Loading uses role=status; failures use role=alert.', 'One h1 per screen.'], related: ['AuthErrorBoundary', 'SignInFlow', 'Alert'],
    example: code(['AppStateScreen'], '<AppStateScreen\n  state="error"\n  brand={<AppBrand product="Campaign" />}\n  title="Could not load your session"\n  message="The server did not respond."\n  onRetry={() => window.location.reload()}\n/>'),
    states: [
      state('Loading', 'Spinner with a status message.', <AppStateScreen state="loading" brand={brand} />, code(['AppStateScreen'], '<AppStateScreen state="loading" brand={<AppBrand product="Campaign" />} />')),
      state('Error', 'What failed and how to retry.', <AppStateScreen state="error" brand={brand} title="Could not load your session" message="The server did not respond." onRetry={nothing} />, code(['AppStateScreen'], '<AppStateScreen state="error" brand={<AppBrand product="Campaign" />} title="Could not load your session" message="The server did not respond." onRetry={() => undefined} />')),
      state('Boundary', 'Shown when an unexpected render failure is caught.', <AppStateScreen state="boundary" brand={brand} onRetry={nothing} />, code(['AppStateScreen'], '<AppStateScreen state="boundary" brand={<AppBrand product="Campaign" />} onRetry={() => undefined} />')),
    ],
  },
  {
    name: 'AuthErrorBoundary', category: 'Application adapters', description: 'Error boundary that falls back to AppStateScreen.',
    usage: 'Wrap the application root. After an uncaught render error it shows the boundary state with a reload action (page reload by default). Report failures with onError; the boundary logs nothing itself.',
    props: [prop('children', 'ReactNode', 'The protected application.', true), prop('fallback', 'Partial<AppStateScreenProps>', 'Overrides for the fallback screen, such as brand, title and message.'), prop('onReload', '() => void', 'Replaces the default location.reload().'), prop('onError', '(error: Error) => void', 'Receives the caught error for reporting.')],
    tokens, accessibility: ['The fallback is a full screen with one h1 and a focusable retry button.'], related: ['AppStateScreen'],
    example: code(['AuthErrorBoundary'], '<AuthErrorBoundary fallback={{ brand: <AppBrand product="Campaign" /> }} onError={error => console.error(error)}>\n  <main>Application</main>\n</AuthErrorBoundary>'),
    states: [state('Healthy children', 'Renders children until one throws.', <AuthErrorBoundary fallback={{ brand }}><p>Application content</p></AuthErrorBoundary>, code(['AuthErrorBoundary'], '<AuthErrorBoundary fallback={{ brand: <AppBrand product="Campaign" /> }}>\n  <main>Application</main>\n</AuthErrorBoundary>'))],
  },
];
