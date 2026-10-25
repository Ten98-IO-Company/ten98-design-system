import { createRoot } from 'react-dom/client';
import { AppStateScreen, AuthErrorBoundary, AuthFrameProvider, AuthStory, SignInFlow } from '@ten98/ui';
import { AppBrand } from '@ten98/ui/app';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// One AuthFrameProvider at the root: each screen passes no brand, aside, label or password policy of its own.
const screen = new URLSearchParams(location.search).get('screen') ?? 'sign-in';
function Broken(): never { throw new Error('fixture failure'); }
const screens = {
  loading: <AppStateScreen state="loading" />,
  'sign-in': <SignInFlow title="Sign in" onSubmit={() => undefined} />,
  boundary: <AuthErrorBoundary onError={() => undefined}><Broken /></AuthErrorBoundary>,
  'no-aside': <AppStateScreen state="loading" aside={null} />,
};
createRoot(document.getElementById('auth-frame-fixture')!).render(
  <AuthFrameProvider brand={<AppBrand product="Campaign" href="/" />} aside={<AuthStory label="About Campaign" eyebrow="Campaign management" title="Plan. Publish." lead="Manage social posts and campaign assets." footnote="ten98 Campaign" />}
    passwordPolicy={{ minLength: 12, maxLength: 64 }}>
    {screens[screen as keyof typeof screens]}
  </AuthFrameProvider>);
