import { useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppStateScreen, AuthErrorBoundary, AuthStory, FirstUserSetupFlow, OidcProviderButtons, SignInFlow } from '@ten98/ui';
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

function Thrower(): ReactNode { throw new Error('Synthetic render failure'); }

/** A controlled sign-in whose request fails after a moment, with a new message each time. */
function Interactive() {
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [submitted, setSubmitted] = useState('');
  function submit(values: Record<string, string>) {
    setBusy(true);
    setSubmitted(Object.keys(values).join(','));
    setTimeout(() => { setAttempts(count => count + 1); setBusy(false); }, 300);
  }
  return <SignInFlow brand={brand} title="Sign in" description="Use your account to access your workspaces." onSubmit={submit} busy={busy}
    error={attempts ? `The email or password is incorrect. Attempt ${attempts}.` : undefined}
    notice={submitted ? { tone: 'info', text: `Submitted ${submitted}` } : undefined}
    forgotPassword={{ onClick: noop }} />;
}

const screens: Record<string, ReactNode> = {
  'signin': <SignInFlow brand={brand} aside={story} label="Sign in" eyebrow="WELCOME BACK" title="Sign in" description="Use your account to access your workspaces." action="/login" hiddenFields={{ csrf: 'token-from-server' }} forgotPassword={{ href: '#forgot' }} cancel={{ label: 'Back to Campaign', href: '#campaign' }} footer="Authentication stays with the application." providers={<OidcProviderButtons providers={providers} onStart={noop} />} />,
  'signin-single': <SignInFlow brand={brand} title="Sign in" description="Use your account to access your workspaces." onSubmit={noop} />,
  'signin-busy': <SignInFlow brand={brand} aside={story} title="Sign in" description="Use your account to access your workspaces." onSubmit={noop} busy />,
  'signin-error': <SignInFlow brand={brand} aside={story} title="Sign in" description="Use your account to access your workspaces." onSubmit={noop} error="The email or password is incorrect." notice={{ tone: 'success', text: 'Password updated. Sign in with the new password.' }} fieldErrors={{ email: 'Enter a valid email address.' }} defaultValues={{ email: 'member@example.test' }} />,
  'signin-providers-pending': <SignInFlow brand={brand} title="Sign in" onSubmit={noop} providers={<OidcProviderButtons providers={providers} pending="google" />} />,
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
  'interactive': <Interactive />,
};

createRoot(document.getElementById('auth-flows-fixture')!).render(screens[params.get('screen') || 'signin'] ?? screens['signin']);
