import { useState } from 'react';
import { AppBrand, AppField, AppIcon } from '../lib/app';
import { Select } from '../lib/primitives';
import type { Theme, Density } from '../lib/tokens';
import { AdapterPreview } from './AdapterPreview';
import { Code } from './Code';
import { routeHref } from './navigation';

export const brandCode = `'use client';\n\nimport { AppBrand, AppIcon } from '@ten98/ui/app';\n\nexport default function BrandExample() {\n  return (\n    <div>\n      <AppBrand product="Campaign" href="/" />\n      <button type="button" className="icon-button" aria-label="Search campaigns">\n        <AppIcon name="search" />\n      </button>\n    </div>\n  );\n}\n`;
export const loginCode = `'use client';

import { useState } from 'react';
import { AppBrand, AppField, AppIcon } from '@ten98/ui/app';
// Load app-tokens.css, then app.css once at the application root.

export default function CampaignLogin() {
  const [message, setMessage] = useState('');
  return (
    <main className="auth-shell auth-split">
      <section className="auth-story" aria-label="Campaign overview">
        <AppBrand product="Campaign" href="/" />
        <div>
          <span className="eyebrow">CAMPAIGN MANAGEMENT</span>
          <h1>Plan.<br />Publish.<br /><em>Measure.</em></h1>
          <p>Manage social posts, advertising and campaign assets.</p>
          <div className="auth-channels">
            <span><AppIcon name="send" />Social</span>
            <span><AppIcon name="target" />Advertising</span>
            <span><AppIcon name="billboard" />Out of home</span>
          </div>
        </div>
        <small>ten98 Campaign</small>
        <div className="auth-orbit" aria-hidden="true" />
      </section>
      <section className="auth-form">
        <div className="auth-form-inner">
          <div className="eyebrow">YOUR WORKSPACE</div>
          <h2>Sign in</h2>
          <p>Use your account to access your workspaces.</p>
          <form onSubmit={event => {
            event.preventDefault();
            // Connect the app's existing authentication controller here.
            setMessage('Form validated. This example does not sign you in.');
          }}>
            <AppField label="Email address" name="email" type="email" autoComplete="username" required />
            <AppField label="Password" name="password" type="password" autoComplete="current-password" required maxLength={128} />
            <button className="button primary full" type="submit">Sign in<AppIcon name="arrow" size={16} /></button>
            {message && <p role="status">{message}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
`;

export function BrandReference({ theme, density }: { theme: Theme; density: Density }) {
  const [mode, setMode] = useState('Sign in');
  const [message, setMessage] = useState('');
  const setup = mode === 'Owner setup';
  const busy = mode === 'Signing in';
  return <><header className="reference-page-heading"><div><p className="reference-eyebrow">Campaign visual reference</p><h1>The existing logo, icons and login pattern</h1><p>Reuse Campaign's original 98 mark, ten98 wordmark, SVG geometry and split login composition.</p></div></header><section className="reference-section"><h2>Logo and icons</h2><div className="reference-brand-row"><AppBrand product="Campaign"/><AppBrand product="Discover"/></div><p>Use <a href={routeHref('Components', { component: 'AppBrand' })}>AppBrand</a> for the wordmark and <a href={routeHref('Components', { component: 'AppIcon', tab: 'States' })}>AppIcon</a> for Campaign's existing icon vocabulary. The main <a href={routeHref('Components', { component: 'Icon', tab: 'States' })}>Icon</a> entry documents additional library symbols.</p><Code value={brandCode}/></section><section className="reference-section"><div className="reference-section-heading"><div><h2>Login pattern</h2><p>Presentation from the current Campaign app. Authentication, setup and submission remain app-owned.</p></div><label className="reference-inline-label">Reference state<Select value={mode} onChange={event => { setMode(event.target.value); setMessage(''); }}>{['Sign in', 'Owner setup', 'Signing in', 'Error'].map(name => <option key={name}>{name}</option>)}</Select></label></div><AdapterPreview title={`Campaign login: ${mode}`} theme={theme} density={density} large><main className="auth-shell auth-split"><section className="auth-story" aria-label="Campaign overview"><AppBrand product="Campaign" href="/"/><div><span className="eyebrow">CAMPAIGN MANAGEMENT</span><h1>Plan.<br/>Publish.<br/><em>Measure.</em></h1><p>Manage social posts, advertising and campaign assets.</p><div className="auth-channels"><span><AppIcon name="send"/>Social</span><span><AppIcon name="target"/>Advertising</span><span><AppIcon name="billboard"/>Out of home</span></div></div><small>ten98 Campaign</small><div className="auth-orbit" aria-hidden="true"/></section><section className="auth-form"><div className="auth-form-inner"><div className="eyebrow">YOUR WORKSPACE</div><h2>{setup ? 'Create owner account' : 'Sign in'}</h2><p>{setup ? 'Create the owner account for this app.' : 'Use your account to access your workspaces.'}</p><form key={mode} onSubmit={event => { event.preventDefault(); setMessage('Form validated. This example does not sign you in.'); }}>{setup && <AppField label="Your name" name="name" autoComplete="name" required maxLength={120}/>}<AppField label="Email address" name="email" type="email" autoComplete="username" required/><AppField label="Password" name="password" type="password" autoComplete={setup ? 'new-password' : 'current-password'} required minLength={setup ? 12 : 1} maxLength={128}/>{setup && <small className="field-help">Use at least 12 characters.</small>}{mode === 'Error' && <p className="form-error" role="alert">Sign-in failed. Check your details and try again.</p>}<button type="submit" className="button primary full" disabled={busy}>{busy ? 'Signing in…' : setup ? 'Create owner account' : 'Sign in'}<AppIcon name="arrow" size={16}/></button>{message && <p role="status">{message}</p>}</form></div></section></main></AdapterPreview><p className="reference-muted">This specimen uses synthetic state and performs no authentication requests. The app decides which errors, setup fields and sign-on providers are available.</p><Code value={loginCode}/></section></>;
}
