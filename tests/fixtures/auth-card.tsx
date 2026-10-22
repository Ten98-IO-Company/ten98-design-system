import { createRoot } from 'react-dom/client';
import { AuthStory, SignInFlow, Text } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements or styles of our own.
const brand = <Text as="span" weight="semibold">Ten98</Text>;
// ?split renders the brand panel beside the form with an explicit card surface.
const split = new URLSearchParams(location.search).has('split');
createRoot(document.getElementById('auth-card-fixture')!).render(split
  ? <SignInFlow surface="card" aside={<AuthStory eyebrow="Campaign" title="Plan. Publish. Measure." lead="One workspace for every campaign." footnote="Synthetic fixture." />} brand={brand} title="Sign in to Campaign" description="Use your work email." onSubmit={() => {}} />
  : <SignInFlow brand={brand} title="Sign in to Campaign" description="Use your work email." onSubmit={() => {}} />);
