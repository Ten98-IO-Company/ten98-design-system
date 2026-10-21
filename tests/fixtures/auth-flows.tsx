import { useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppStateScreen, AuthErrorBoundary, AuthStory, FirstUserSetupFlow, InvitationAcceptFlow, OidcProviderButtons, PasswordRecoveryFlow, SignInFlow, Text, TwoFactorChallengeFlow, WorkspaceOnboarding, type SignInValues, type TwoFactorMode } from '@ten98/ui';
import { AppBrand } from '@ten98/ui/app';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements, className or style.
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';
const brand = <AppBrand product="Campaign" />;
const story = <AuthStory label="About Campaign" eyebrow="CAMPAIGN MANAGEMENT" title="Plan. Publish." emphasis="Measure." lead="Manage social posts, advertising and campaign assets." channels={[{ icon: 'send', label: 'Social' }, { icon: 'target', label: 'Advertising' }]} footnote="ten98 Campaign" />;
const providers = [{ id: 'entra', name: 'Microsoft', href: '#entra' }, { id: 'google', name: 'Google' }];
const noop = () => undefined;
const unconfirmed = 'We could not confirm whether your password changed. Do not assume the old password still works. Reload this page, then try again.';

function Thrower(): ReactNode { throw new Error('Synthetic render failure'); }

/** Fails until the app's in-place recovery runs, then renders normally. */
let recovered = false;
function FailsOnce(): ReactNode {
  if (!recovered) throw new Error('Synthetic render failure');
  return <Text id="recovered">Recovered without a page reload.</Text>;
}

/** A controlled sign-in whose request fails after a moment, with a new message each time. */
function Interactive() {
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [submitted, setSubmitted] = useState('');
  function submit(values: SignInValues) {
    setBusy(true);
    setSubmitted(Object.keys(values).join(','));
    setTimeout(() => { setAttempts(count => count + 1); setBusy(false); }, 300);
  }
  return <SignInFlow brand={brand} title="Sign in" description="Use your account to access your workspaces." onSubmit={submit} busy={busy}
    error={attempts ? `The email or password is incorrect. Attempt ${attempts}.` : undefined}
    notice={submitted ? { tone: 'info', text: `Submitted ${submitted}` } : undefined}
    forgotPassword={{ onClick: noop }} />;
}

/** The application owns the two-factor mode; the flow only reports the request to change it. */
function TwoFactor({ initial }: { initial: TwoFactorMode }) {
  const [mode, setMode] = useState<TwoFactorMode>(initial);
  return <TwoFactorChallengeFlow brand={brand} aside={story} title="Verify your identity" description="Confirm it is you to finish signing in." mode={mode} onModeChange={setMode} onSubmit={noop} cancel={{ onClick: noop }} />;
}

const backToSignIn = { href: '#signin' };
const invitation = { workspaceName: 'Acme Marketing', email: 'new.member@example.test', role: 'Editor', expiresAt: '2030-01-15T12:00:00Z' };
const invitationFrame = { brand, title: 'Join Acme Marketing', description: 'You were invited to collaborate.', onSubmit: noop, invitation, formatDate: (value: string | Date) => new Date(value).toISOString().slice(0, 10) };

/** Shows the typed values a flow hands to the application. */
function ValuesProbe({ optIn }: { optIn: boolean }) {
  const [values, setValues] = useState('');
  return <FirstUserSetupFlow brand={brand} title="Create owner account" workspaceName sampleOptIn={optIn ? { label: 'Add sample content' } : false} hiddenFields={{ csrf: 'token-from-server' }} onSubmit={submitted => setValues(JSON.stringify(submitted))} notice={values ? { tone: 'info', text: values } : undefined} />;
}

const screens: Record<string, ReactNode> = {
  'signin': <SignInFlow brand={brand} aside={story} label="Sign in" eyebrow="WELCOME BACK" title="Sign in" description="Use your account to access your workspaces." action="/login" hiddenFields={{ csrf: 'token-from-server' }} forgotPassword={{ href: '#forgot' }} cancel={{ label: 'Back to Campaign', href: '#campaign' }} footer="Authentication stays with the application." providers={<OidcProviderButtons providers={providers} onStart={noop} />} />,
  'signin-single': <SignInFlow brand={brand} title="Sign in" description="Use your account to access your workspaces." onSubmit={noop} />,
  'signin-busy': <SignInFlow brand={brand} aside={story} title="Sign in" description="Use your account to access your workspaces." onSubmit={noop} busy />,
  'signin-error': <SignInFlow brand={brand} aside={story} title="Sign in" description="Use your account to access your workspaces." onSubmit={noop} error="The email or password is incorrect." notice={{ tone: 'success', text: 'Password updated. Sign in with the new password.' }} fieldErrors={{ email: 'Enter a valid email address.' }} defaultValues={{ email: 'member@example.test' }} />,
  'signin-providers-pending': <SignInFlow brand={brand} title="Sign in" onSubmit={noop} providers={<OidcProviderButtons providers={providers} pending="google" />} />,
  'signin-providers-start-error': <SignInFlow brand={brand} title="Sign in" onSubmit={noop} providers={<OidcProviderButtons providers={providers} onStart={noop} error="Microsoft sign-in could not be started." />} />,
  'signin-providers-loading': <SignInFlow brand={brand} title="Sign in" onSubmit={noop} providers={<OidcProviderButtons providers={null} loading />} />,
  'signin-providers-error': <SignInFlow brand={brand} title="Sign in" onSubmit={noop} providers={<OidcProviderButtons providers={null} error="Sign-in providers could not be loaded." onRetry={noop} />} />,
  'signin-providers-empty': <SignInFlow brand={brand} title="Sign in" onSubmit={noop} providers={<OidcProviderButtons providers={[]} />} />,
  'setup': <FirstUserSetupFlow brand={brand} aside={story} eyebrow="FIRST RUN" title="Create owner account" description="Create the owner account for this installation." tokenHint="Printed in the server log on first start." tokenLength={{ min: 8, max: 64 }} onSubmit={noop} />,
  'setup-full': <FirstUserSetupFlow brand={brand} aside={story} title="Create owner account" description="Create the owner account for this installation." tokenHint="Printed in the server log on first start." workspaceName sampleOptIn={{ label: 'Add sample content to the workspace', defaultChecked: true }} signInInstead={{ href: '#login' }} action="/setup" hiddenFields={{ csrf: 'token-from-server' }} />,
  'setup-error': <FirstUserSetupFlow brand={brand} title="Create owner account" tokenHint="Printed in the server log on first start." onSubmit={noop} error="The account could not be created." fieldErrors={{ token: 'The setup token does not match.', password: 'Use at least 12 characters.' }} />,
  'setup-busy': <FirstUserSetupFlow brand={brand} title="Create owner account" onSubmit={noop} busy />,
  'loading': <AppStateScreen state="loading" brand={brand} />,
  'error': <AppStateScreen state="error" brand={brand} title="Could not load your session" message="The server did not respond." onRetry={noop} />,
  'boundary': <AuthErrorBoundary fallback={{ brand }} onReload={noop} onError={noop}><Thrower /></AuthErrorBoundary>,
  'boundary-recover': <AuthErrorBoundary fallback={{ brand }} onReload={() => { recovered = true; }} onError={noop}><FailsOnce /></AuthErrorBoundary>,
  'interactive': <Interactive />,
  'values': <ValuesProbe optIn />,
  'values-hidden': <ValuesProbe optIn={false} />,
  '2fa-authenticator': <TwoFactor initial="authenticator" />,
  '2fa-recovery': <TwoFactor initial="recovery" />,
  '2fa-error': <TwoFactorChallengeFlow brand={brand} title="Verify your identity" mode="authenticator" onModeChange={noop} onSubmit={noop} error="The code is incorrect or expired." fieldErrors={{ code: 'Enter the 6-digit code.' }} cancel={{ href: '#signin' }} />,
  'recovery-request': <PasswordRecoveryFlow brand={brand} aside={story} stage="request" title="Reset your password" description="Enter your email address and we send a reset link." onSubmit={noop} backToSignIn={backToSignIn} />,
  'recovery-loading': <PasswordRecoveryFlow brand={brand} stage="request" availability="loading" title="Reset your password" backToSignIn={backToSignIn} />,
  'recovery-disabled': <PasswordRecoveryFlow brand={brand} stage="request" availability="disabled" title="Reset your password" backToSignIn={backToSignIn} />,
  'recovery-error': <PasswordRecoveryFlow brand={brand} stage="request" availability="error" title="Reset your password" backToSignIn={backToSignIn} />,
  'recovery-sent': <PasswordRecoveryFlow brand={brand} stage="request" sent title="Check your email" backToSignIn={backToSignIn} />,
  'recovery-reset': <PasswordRecoveryFlow brand={brand} aside={story} stage="reset" title="Choose a new password" onSubmit={noop} token="reset-token" backToSignIn={backToSignIn} />,
  'recovery-reset-link': <PasswordRecoveryFlow brand={brand} stage="reset" title="Choose a new password" onSubmit={noop} onRequestNewLink={noop} backToSignIn={backToSignIn} />,
  'recovery-reset-error': <PasswordRecoveryFlow brand={brand} stage="reset" title="Choose a new password" onSubmit={noop} error="The password could not be changed." fieldErrors={{ password: 'This password is too common.' }} backToSignIn={backToSignIn} />,
  'recovery-unconfirmed': <PasswordRecoveryFlow brand={brand} stage="reset" title="Choose a new password" onSubmit={noop} unconfirmed={unconfirmed} backToSignIn={backToSignIn} />,
  'recovery-invalid': <PasswordRecoveryFlow brand={brand} stage="reset" invalid title="Choose a new password" onRequestNewLink={noop} backToSignIn={backToSignIn} />,
  'invitation-loading': <InvitationAcceptFlow {...invitationFrame} state="loading" invitation={undefined} />,
  'invitation-new': <InvitationAcceptFlow {...invitationFrame} aside={story} state="details" token="invite-token" providers={<OidcProviderButtons providers={providers} onStart={noop} />} onSignIn={noop} cancel={{ onClick: noop }} />,
  'invitation-signin-label': <InvitationAcceptFlow {...invitationFrame} state="details" onSignIn={noop} signInLabel="I already have an account" />,
  'invitation-busy': <InvitationAcceptFlow {...invitationFrame} state="details" signedInEmail="new.member@example.test" busy />,
  'invitation-signin-busy': <InvitationAcceptFlow {...invitationFrame} state="signin-required" onSignIn={noop} busy />,
  'invitation-join': <InvitationAcceptFlow {...invitationFrame} state="details" signedInEmail="new.member@example.test" cancel={{ onClick: noop }} />,
  'invitation-signin': <InvitationAcceptFlow {...invitationFrame} state="details" accountExists providers={<OidcProviderButtons providers={providers} onStart={noop} />} onSignIn={noop} cancel={{ href: '#home' }} />,
  'invitation-mismatch': <InvitationAcceptFlow {...invitationFrame} state="mismatch" signedInEmail="someone.else@example.test" onSwitchAccount={noop} cancel={{ onClick: noop }} />,
  'invitation-unavailable': <InvitationAcceptFlow {...invitationFrame} state="unavailable" invitation={undefined} error="This invitation was cancelled by the workspace owner." onRetry={noop} cancel={{ href: '#home' }} />,
  'invitation-accepted': <InvitationAcceptFlow {...invitationFrame} state="accepted" continueAction={{ href: '#workspace' }} />,
  'onboarding': <WorkspaceOnboarding brand={brand} aside={story} email="member@example.test" help="Ask an owner to invite you, or create a workspace of your own." onSubmit={noop} onRefresh={noop} account={{ label: 'Account settings', href: '#account' }} signOut={{ onClick: noop }}><Text tone="muted" size="sm">Invitations you receive appear here.</Text></WorkspaceOnboarding>,
  'onboarding-native': <WorkspaceOnboarding brand={brand} email="member@example.test" action="/workspaces" hiddenFields={{ csrf: 'token-from-server' }} signOut={{ action: '/logout', hiddenFields: { csrf: 'token-from-server' } }} onRefresh={noop} />,
  'onboarding-error': <WorkspaceOnboarding brand={brand} email="a.very.long.address.for.a.narrow.screen@example.test" onSubmit={noop} error="The workspace could not be created." fieldErrors={{ name: 'Enter a workspace name.' }} />,
  'unconfirmed': <AppStateScreen state="unconfirmed" brand={brand} onRetry={noop} />,
  'signin-unconfirmed': <SignInFlow brand={brand} title="Sign in" onSubmit={noop} unconfirmed="We could not confirm the sign-in. Reload this page, then try again." />,
};

createRoot(document.getElementById('auth-flows-fixture')!).render(screens[params.get('screen') || 'signin'] ?? screens['signin']);
